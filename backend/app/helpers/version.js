
import fs from 'fs';
// Vercel exposes the deployed commit; other hosts can write .source-version.
var version = process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null;
if (!version) {
  try {
    version = fs.readFileSync('.source-version').toString().trim();
  } catch(e) {
    version = 'dev';
  }
}
console.log('App version', version)


export function setVersion(req, res, next)  {
  res.set('X-Client-Version', version)
  next();
}

export { version };
