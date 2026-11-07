// Long-running server entry point (local development, pm2, or any host that
// runs `node`). On Vercel, api/index.js exports the same app instead.
import app from './app.js';

const port = process.env.PORT || 80

// Warm up (runs migrations in development and loads the marketing page) before
// accepting traffic.
app.runMiddleware('/', {
  method: 'get'
}, () => {
  app.listen(port, () => {
    console.log(`Backend app listening on port ${port}!`)
    if (process.send)
      process.send('ready');
  })
})


process.on('SIGINT', function() {
  console.log('Backend shutting down')
  try {
    app.locals.pool.end();
    process.exit(0);
  } catch (err) {
    console.log('Exit error:', err)
    process.exit(1);
  }
});
