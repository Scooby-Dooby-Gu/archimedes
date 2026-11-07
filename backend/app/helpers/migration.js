import glob from 'glob';
import fs from 'fs';
export async function migrate(req) {
  if (req.path === '/install') return;
  
  console.log('! Running migrations')
  try {
    await req.locals.selectOne('CREATE SCHEMA IF NOT EXISTS private');
    var { timestamp } = await req.locals.selectOne(`SELECT obj_description('private'::regnamespace, 'pg_namespace')::bigint as timestamp`)
  } catch(e) {
    console.log(e);
    timestamp = null;
  }
  console.log('! Current version is ' + timestamp);
  if (!timestamp) {
    try {
      await req.locals.query(`COMMENT ON SCHEMA private IS '${Math.round((new Date) / 1000)}'`)
    } catch(e) {
      console.log(e);
    }
  } else {
    const files = glob.sync('schema/migrations/**.sql').sort()
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      const filename = file.split('/').pop();
      const time = filename.split('.').shift();
      if (parseInt(time) > timestamp) {
        console.log('Running ', file, [timestamp, time])
        const content = fs.readFileSync(file);
        await req.locals.query(content.toString());
        
      }
    }
  }
}

export async function install(req, app) {
  const schema = fs.readFileSync('schema/schema.sql');
  const data = fs.readFileSync('schema/data.sql'); 
  const views = fs.readFileSync('schema/views.sql'); 
  const achievements = fs.readFileSync('schema/achievements.sql'); 
  try {
    await app.locals.pool.query(schema.toString());
    await app.locals.pool.query(views.toString());
    await app.locals.pool.query(achievements.toString());
    await app.locals.pool.query(data.toString());
  } catch(e) {
    console.log(e)
  }
  const pool = app.locals.pool;
  app.locals.pool = await app.locals.getPool()
  pool.end();
  console.log('Installing')
}