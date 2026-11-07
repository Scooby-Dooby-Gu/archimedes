#!/usr/bin/env node
// Database setup and migrations, run from the command line or a deploy step.
//
//   npm run db:setup              create the schema in an empty database
//   npm run db:setup -- --seed    ...and load schema/data.sql (local dev only)
//   npm run db:migrate            apply pending migrations
//   npm run vercel-build          migrate only on Vercel production deploys
//
// Connection: DATABASE_URL_UNPOOLED if set (Neon's direct connection; the
// migration lock needs a real session, which a transaction pooler doesn't
// keep), otherwise DATABASE_URL, otherwise the standard PG* variables.
import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';
import { runMigrations, latestMigrationVersion } from '../app/helpers/migration.js';

const LOCK_ID = 7215190413; // arbitrary, shared by every deploy of this app

function databaseUrl() {
  return process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
}

function connect() {
  const url = databaseUrl();
  const local = !url || /\/\/(?:[^@\/]*@)?(localhost|127\.0\.0\.1)(?::\d+)?\//.test(url) || /sslmode=disable/.test(url);
  return new pg.Client(url ? {
    connectionString: url,
    ssl: local ? undefined : { rejectUnauthorized: false },
  } : {});
}

async function withLock(fn) {
  const client = connect();
  await client.connect();
  try {
    // Serialize concurrent deploys so a migration never runs twice at once.
    await client.query('SELECT pg_advisory_lock($1)', [LOCK_ID]);
    return await fn(client);
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_ID]).catch(() => {});
    await client.end();
  }
}

async function hasSchema(client) {
  const { rows } = await client.query(`SELECT to_regclass('private.users') AS t`);
  return Boolean(rows[0].t);
}

async function setup({ seed }) {
  await withLock(async (client) => {
    if (await hasSchema(client)) {
      console.log('Schema already exists; running migrations instead.');
      const applied = await runMigrations((sql, values) => client.query(sql, values));
      console.log(applied.length ? `Applied ${applied.length} migration(s).` : 'Already up to date.');
      return;
    }
    if (seed && process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to load seed data (test admin accounts) into a production database.');
    }
    const files = ['schema/schema.sql', 'schema/views.sql', 'schema/achievements.sql'];
    if (seed) files.push('schema/data.sql');
    await client.query('BEGIN');
    try {
      for (const file of files) {
        console.log('Loading', file);
        await client.query(fs.readFileSync(file).toString());
      }
      await client.query(`COMMENT ON SCHEMA private IS '${latestMigrationVersion()}'`);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    }
    console.log('Database is set up' + (seed ? ' with seed data.' : '.'));
  });
}

async function migrate() {
  await withLock(async (client) => {
    if (!(await hasSchema(client))) {
      throw new Error('Database has no Archimedes schema yet. Run `npm run db:setup` first.');
    }
    const applied = await runMigrations((sql, values) => client.query(sql, values));
    console.log(applied.length ? `Applied ${applied.length} migration(s).` : 'Already up to date.');
  });
}

const [command, ...args] = process.argv.slice(2);
const run = {
  setup: () => setup({ seed: args.includes('--seed') }),
  migrate,
  'vercel-build': async () => {
    // Preview deploys may share the production database: only migrate on
    // production deploys (or when explicitly asked).
    if (process.env.VERCEL_ENV === 'production' || process.env.MIGRATE_ON_BUILD === 'true') {
      if (!databaseUrl()) throw new Error('DATABASE_URL is not set for this deploy.');
      await migrate();
    } else {
      console.log(`Skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV || 'unset'}).`);
    }
  },
}[command];

if (!run) {
  console.error('Usage: node scripts/db.js <setup [--seed] | migrate | vercel-build>');
  process.exit(1);
}
run().catch((e) => {
  console.error('Database command failed:', e.message);
  process.exit(1);
});
