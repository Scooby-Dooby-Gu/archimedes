// Fixed-window rate limiting stored in Postgres, so the limit holds across
// serverless instances. Counters are written outside the request's
// transaction, so a request that fails (a wrong password, say) still counts.
//
//   app.postAsync('/signin', rateLimit('signin', 10, 15 * 60), handler)
//
// limits each client IP to 10 requests per 15 minutes on that route.
import { TooManyRequests } from '../exceptions.js';

export function clientIp(req) {
  // Vercel sets x-forwarded-for to the real client address first.
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

export function rateLimit(name, limit, windowSeconds, keyFor = clientIp) {
  return async function (req, res, next) {
    const pool = req.locals.app.locals.pool;
    const key = `${name}:${keyFor(req)}`.slice(0, 255);
    try {
      const { rows: [row] } = await pool.query(
        `INSERT INTO private.rate_limits AS r (key, window_start, count) VALUES ($1, NOW(), 1)
         ON CONFLICT (key) DO UPDATE SET
           count = CASE WHEN r.window_start < NOW() - make_interval(secs => $2) THEN 1 ELSE r.count + 1 END,
           window_start = CASE WHEN r.window_start < NOW() - make_interval(secs => $2) THEN NOW() ELSE r.window_start END
         RETURNING count, window_start`,
        [key, windowSeconds]
      );
      if (row.count > limit) {
        const retryAfter = Math.max(1, Math.ceil((new Date(row.window_start).getTime() + windowSeconds * 1000 - Date.now()) / 1000));
        res.setHeader('Retry-After', String(retryAfter));
        return next(new TooManyRequests);
      }
      // Now and then, clear out old counters.
      if (Math.random() < 0.01) {
        pool.query(`DELETE FROM private.rate_limits WHERE window_start < NOW() - interval '1 day'`).catch(() => {});
      }
    } catch (e) {
      // Never lock people out because the limiter itself failed (e.g. the
      // table doesn't exist yet before the migration runs).
      console.log('Rate limit check failed:', e.message);
    }
    next();
  };
}
