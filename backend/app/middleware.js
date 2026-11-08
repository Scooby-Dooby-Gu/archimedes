import bodyParser from 'body-parser';
import Sentry from '@sentry/node';
import cors from 'cors';
//import { Tracing } from '@sentry/integrations';


import * as helpers from './helpers/index.js'
import * as exceptions from './exceptions.js';
import { findUserByApiKey } from './helpers/index.js';

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  environment: process.env.NODE_ENV || 'development',
  //integrations: [
//    new Tracing(),
  //],
  //release: 'medes-backend@' + process.env.SOURCE_VERSION,
  user: ['email', 'id', 'name']
});

const LOG_SQL = process.env.NODE_ENV === 'development' || process.env.LOG_SQL === 'true';

// Marketing pages are identical for every visitor: let browsers revalidate and
// let the CDN serve them for a few minutes.
const STATIC_PAGE_CACHE = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';

export async function beforeMiddleware (app) {

  app.use(Sentry.Handlers.requestHandler());

  Object.assign(app.locals, helpers);
  Object.assign(app.locals, exceptions);

  // wrap method handlers to catch all async errors
  // also it awaits for handlers to finish
  // and sends the returned value implicitly

  const delay = (time) => {
    return new Promise((a) => {
      setTimeout(() => {
        a()
      }, time);
    })
  }

  app.use(function(req, res, next) {
    var schema = req.headers['x-forwarded-proto'];
  
    if (process.env.NODE_ENV == 'development' || schema === 'https') {
      // Already https; don't do anything special.
      next();
    }
    else {
      // Redirect to https.
      res.redirect('https://' + req.headers.host + req.url);
    }
  });

  app.locals.async = function(callback) {
    return async (req, res, next) => {
      try {
        const result = await callback.call(this, req, res, next);
        await req.locals.release(req)
        //await delay( Math.random() * 200 + 2300);
        if (result !== res && result !== req) {
          if (typeof result === "string" && req.method === 'GET' && !req.locals.user && /^\s*<!DOCTYPE html/i.test(result)) {
            res.setHeader('Cache-Control', STATIC_PAGE_CACHE);
          }
          return res.send(typeof result === "string" ? result : app.locals.sanitizeResponse(result))
        } else {
          return res.end()
        }
      } catch(e) {
        return next(e)
      }
    }
  };

  ['post', 'get', 'put', 'patch', 'delete', 'options'].forEach((method) => {
    app[method + 'Async'] =  function (...args) {
      args[args.length - 1] = app.locals.async(args[args.length - 1])
      return app[method](...args);
    }
  })

  app.use(async (req, res, next) => {
    if (!req.locals) {
      req.locals = {}
    }
    req.locals.app = app;
    if (req.query.transaction_id) {
      Sentry.configureScope(function(scope) {
        scope.setTag("transaction_id", req.query.transaction_id);
      });
    }

    // API responses are per-user: never cache them. (This used to send a
    // one-year max-age to anything that accepted HTML, which includes fetch()
    // calls with Accept: */*.) Marketing pages opt into caching in the async
    // wrapper below.
    res.setHeader('Cache-Control', 'no-store');

    req.locals.startTime = Date.now();
    // acquire pg connection from the pool
    req.locals.client = await app.locals.pool.connect();

    // run query in transaction
    req.locals.query = async (query, values, name) => {
      if (!req.locals.transaction) {
        req.locals.transaction = true;
        await req.locals.client.query('BEGIN');
      }

      const time = new Date;
      try {
        if (name) {
          var results = await req.locals.client.query({text: query, values, name})
        } else {
          var results = await req.locals.client.query(query, values)
        }
        if (LOG_SQL) {
          // Development only: parameter values include password hashes,
          // API keys and tokens, so they must never reach production logs.
          const formattedValues = (values || []).map((v) => {
            return typeof v == 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v;
          });
          if (name) console.info('[' + (new Date - time) + 'ms ' + name + ']', formattedValues);
          else console.info('[' + (new Date - time) + 'ms]', query, query.substring(0, 100) + '...', formattedValues);
        }
      } catch(e) {
        console.log('Query failed' + (name ? ' (' + name + ')' : '') + ':', e.message)
        if (e.toString().indexOf('current transaction is aborted') == -1) {
          if (LOG_SQL) console.log(query)
          throw e;
        }
        var results = {rows: []}
      }
      return results;
    }

    const end = res.end;
    res.end = function() {
      req.locals.release(req);
      if (req.locals.startTime) {
        console.log('[' + (Date.now() - req.locals.startTime) + 'ms] ' + res.statusCode + ' ' + req.method + ' ' + req.path)
      }
      return end.apply(this, arguments)
    }

    // shortcut to run query
    req.locals.select = async (query, params, name) => {
      const results = await req.locals.query(query, params, name);
      return results.rows.map((row) => app.locals.camelizeObject(row.jsonb || row))
    };
    req.locals.selectOne = async (query, params, name) => {
      return app.locals.camelizeObject((await req.locals.select(query, params, name))[0])
    };

    req.locals.selectAndCount = async (query, params, name) => {
      const results = await req.locals.query(query.replace('SELECT ', 'SELECT count(*) OVER () as total_count, '), params, name);
      return results.rows.map((row) => ({
        ...(app.locals.camelizeObject(row.jsonb || row)), 
        totalCount: row.total_count
      }))
    };

    // release connection & commit the transaction
    req.locals.release = async (req, err) => {
      if (req.locals.transaction) {
        req.locals.transaction = null;
        if (err) {
          console.log('ROLLBACK')
        }
        await req.locals.client.query(err ? 'ROLLBACK' : 'COMMIT');
      }
      if (req.locals.client) {
        const client = req.locals.client;
        req.locals.client = null;
        await client.release();
      }
    }

    next();
  })

  // CORS: browsers may only call the API from the app and the marketing site
  // (plus localhost outside production, and any extra CORS_ORIGINS, comma
  // separated). Requests without an Origin header (curl, server-to-server,
  // same-origin pages) aren't affected.
  const allowedOrigins = new Set(
    [process.env.APP_URL, process.env.SITE_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
      .map((u) => (u || '').trim().replace(/\/+$/, ''))
      .filter(Boolean)
  );
  const isDevOrigin = (origin) => process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  app.use(cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.size === 0 || allowedOrigins.has(origin) || isDevOrigin(origin)),
  }))

  // allow _method query param instead of real method to avoid OPTIONS request 
  app.use(function (req, res, next) {
    if (req.query._method) {
      req.method = req.query._method.toUpperCase();
    }
    next()
  })


  // parse post body
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())
  

  app.use(async (req, res, next) => {
    if (!app.locals.migrated) {
      await app.locals.migrate(req);
      app.locals.migrated = true;
    }


    const apiKey = req.query.api_key || req.headers.authorization;
    if (apiKey) {
      try {
        const user = await findUserByApiKey(req, apiKey);
        if (user && !user.firstUsedAt && user.verifiedAt && (user.role != 'user' || req.query.wrapper)) {
          user.firstUsedAt = new Date();
          await req.locals.query(
            'UPDATE private.users SET first_used_at = $1 where id = $2', 
            [user.firstUsedAt, user.id],
            'set-first-used-date'
          )
        }
        req.user = req.locals.user = user;
        if (user) {
          Sentry.configureScope(function(scope) {
            scope.setUser({id: user.id, email: user.email, name: user.name, verifiedAt: user.verifiedAt});
          });
        }
      } catch(e) {
        return next(e)
      }
    }
    next()
  })

  app.use(app.locals.setVersion);
}


export async function afterMiddleware(app) {
  app.use(function (req, res, next) {
    next(new app.locals.NotFound('Can not find ' + req.method + ' ' + req.path))
  })

  app.use(async function(err, req, res, next) {
    if (req.locals.release)
      await req.locals.release(req, err)
    next(err);
  });

  app.use(async function(err, req, res, next) {
    //console.error(err.stack); // Log error message in our server's console
    if (!err.status) err.status = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.status).send({error: err.message}); // All HTTP requests must have a response, so let's send back an error with its status code and message
    next(err);
  });
  app.use(Sentry.Handlers.errorHandler());
  

}