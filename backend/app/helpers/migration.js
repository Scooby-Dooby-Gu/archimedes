import glob from 'glob';
import fs from 'fs';

// Schema version = unix timestamp stored as the comment on the `private`
// schema. Each file in schema/migrations/<timestamp>.sql is newer than the
// version it upgrades from.

export function migrationFiles() {
  return glob.sync('schema/migrations/**.sql').sort();
}

export function latestMigrationVersion() {
  const files = migrationFiles();
  const last = files.length ? files[files.length - 1].split('/').pop().split('.').shift() : null;
  return last ? parseInt(last) : Math.round(Date.now() / 1000);
}

// Runs pending migrations with `query(sql)`. Returns the files it applied.
export async function runMigrations(query) {
  await query('CREATE SCHEMA IF NOT EXISTS private');
  const result = await query(`SELECT obj_description('private'::regnamespace, 'pg_namespace')::bigint as timestamp`);
  const row = (result.rows || result)[0] || {};
  const timestamp = row.timestamp == null ? null : parseInt(row.timestamp);
  console.log('! Current schema version is ' + timestamp);

  if (!timestamp) {
    // Brand-new database without our schema: `npm run db:setup` creates it.
    const tables = await query(`SELECT to_regclass('private.users') AS t`);
    if (!((tables.rows || tables)[0] || {}).t) {
      throw new Error('Database has no Archimedes schema yet. Run `npm run db:setup` first.');
    }
    await query(`COMMENT ON SCHEMA private IS '${latestMigrationVersion()}'`);
    return [];
  }

  const applied = [];
  for (const file of migrationFiles()) {
    const time = parseInt(file.split('/').pop().split('.').shift());
    if (time > timestamp) {
      console.log('! Running migration', file);
      await query(fs.readFileSync(file).toString());
      applied.push(file);
    }
  }
  return applied;
}

// Development convenience: migrate on the first request. In production,
// migrations run once per deploy (`npm run db:migrate`) instead, because
// serverless instances start in parallel.
export async function migrate(req) {
  if (process.env.NODE_ENV !== 'development' && process.env.MIGRATE_ON_REQUEST !== 'true') return;
  try {
    await runMigrations((sql, values) => req.locals.query(sql, values));
  } catch (e) {
    console.log('! Migration skipped:', e.message);
  }
}
