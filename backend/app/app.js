// Builds the Express app without starting a server, so it can run both as a
// normal long-lived server (app/index.js) and as a Vercel function (api/index.js).
import express from 'express';
import runMiddleware from 'run-middleware';
import {beforeMiddleware, afterMiddleware} from './middleware.js';
import controllers from './controllers/index.js';


const app = express()

runMiddleware(app)
beforeMiddleware(app);
controllers(app)
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.getAsync('/', (req, res) => {
  return app.locals.renderedStaticPage(app, {
    type: 'mainpage'
  })
})
app.getAsync('/push', app.locals.userOnly, async (req, res) => {
  await app.locals.sendNotification(req, req.locals.user.id, {
    title: 'THIS WILL LINK TO GOOGLE',
    body: `OTM or out of the money call options are cheap to buy because of how fast Theta decay eats into the value and the difficulty selling them if the stock does not hockey stick up.`,
    link: 'http://google.com'
  })
})
app.getAsync('/version', (req, res) => ({ environment: process.env.NODE_ENV, version: app.locals.version }))
// The old public POST /install route (re-run schema + seed admin accounts) is
// gone: set up a database with `npm run db:setup` instead.

app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send(`User-agent: *
Sitemap: /sitemap.xml
`)
})

// The installable web app lives on the app domain; its manifest is
// frontend/public/app-manifest.json.
app.get('/app-manifest.json', (req, res) => {
  res.redirect(301, `${app.locals.appUrl()}/app-manifest.json`);
})

afterMiddleware(app)

export default app;