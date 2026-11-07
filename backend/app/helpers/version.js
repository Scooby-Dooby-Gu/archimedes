
import fs from 'fs';
try {
  var version = fs.readFileSync('.source-version').toString(); 
} catch(e) {
  var version = 'dev';
}
console.log('App version', version)


export function setVersion(req, res, next)  {
  res.set('X-Client-Version', version)
  next();
}

export { version };