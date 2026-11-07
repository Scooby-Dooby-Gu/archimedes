#!/usr/bin/env node
// Copy the learning content (courses, lessons, quizzes, videos, goals...) from
// a restored backup of the old production database into this app's database.
// No user accounts, posts, activity, devices or companies are copied.
//
//   SOURCE_DATABASE_URL=postgresql://localhost/archimedes_backup \
//   DATABASE_URL_UNPOOLED=postgres://...  npm run import:content
//
// People references are handled like this:
// - Lesson/question/ambition authors all become one placeholder author,
//   "Archimedes" (no email, password or login).
// - Video experts (the presenters shown on video pages) are copied as public
//   profiles only: name, photo and bio. They get placeholder emails and no
//   password or API key, so nobody can sign in as them.
//
// Images: set UPLOADS_BASE_URL (e.g. https://app.getmedes.com/uploads) to
// rewrite every link to the old company's S3 bucket to that location. The
// images themselves live in frontend/public/uploads/, mirroring the bucket.
//
// The target must have the schema (`npm run db:setup`) and no content yet.
import 'dotenv/config';
import pg from 'pg';

// Every form the old bucket's URLs take in the data, including keys that
// start with an extra "/" (…production//tasks/…).
const OLD_BUCKET_URL = /https?:\/\/(?:s3[.-]us-west-1\.amazonaws\.com\/archimedes-user-uploads-production|archimedes-user-uploads-production\.s3(?:[.-]us-west-1)?\.amazonaws\.com)\/+/g;
let rewrittenLinks = 0;
function rewriteUploads(text) {
  const base = process.env.UPLOADS_BASE_URL;
  if (!base || typeof text !== 'string') return text;
  return text.replace(OLD_BUCKET_URL, () => { rewrittenLinks++; return base.replace(/\/+$/, '') + '/'; });
}

// Copied in this order so every reference points at a row that exists.
const TABLES = [
  'achievements',
  'games',
  'embeds',
  'boards',
  'topics',
  'courses',
  'videos',
  'lessons',     // -> courses, lessons (previous_lesson_id), users (author)
  'questions',   // -> videos, users (author)
  'ambitions',   // -> ambitions (previous_ambition_id), users (author)
  'goals',
  'goal_ambitions',
  'tasks',       // -> goals, lessons, videos
];
const AUTHOR_COLUMNS = { lessons: 'author_id', questions: 'author_id', ambitions: 'author_id' };
const SELF_REFERENCES = { lessons: 'previous_lesson_id', ambitions: 'previous_ambition_id' };
const PLACEHOLDER_AUTHOR_EMAIL = 'content@getmedes.invalid';

const isLocal = (url) => !url || /\/\/(?:[^@\/]*@)?(localhost|127\.0\.0\.1)(?::\d+)?\//.test(url) || /sslmode=disable/.test(url);
const client = (url) => new pg.Client({ connectionString: url, ssl: isLocal(url) ? undefined : { rejectUnauthorized: false } });

async function columns(db, table) {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

// Insert rows whose self-reference (e.g. previous_lesson_id) is already present
// first, so the foreign key is satisfied without a second UPDATE pass (which
// would bump updated_at through the timestamp triggers).
function dependencyOrder(rows, column) {
  if (!column) return rows;
  const ids = new Set(rows.map((r) => r.id));
  const done = new Set();
  const ordered = [];
  let pending = rows.slice();
  while (pending.length) {
    const next = pending.filter((r) => r[column] == null || !ids.has(r[column]) || done.has(r[column]));
    if (!next.length) {
      throw new Error(`Circular ${column} references`);
    }
    for (const r of next) {
      if (r[column] != null && !ids.has(r[column])) r[column] = null; // dangling link
      ordered.push(r);
      done.add(r.id);
    }
    pending = pending.filter((r) => !done.has(r.id));
  }
  return ordered;
}

async function main() {
  const sourceUrl = process.env.SOURCE_DATABASE_URL;
  const targetUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    throw new Error('Set SOURCE_DATABASE_URL (the restored backup) and DATABASE_URL_UNPOOLED or DATABASE_URL (the target).');
  }
  if (sourceUrl === targetUrl) throw new Error('Source and target are the same database.');

  const source = client(sourceUrl);
  const target = client(targetUrl);
  await source.connect();
  await target.connect();

  try {
    const { rows: [schema] } = await target.query(`SELECT to_regclass('private.users') AS t`);
    if (!schema.t) throw new Error('Target has no schema yet. Run `npm run db:setup` first.');
    const { rows: [existing] } = await target.query(`SELECT (SELECT count(*) FROM courses) + (SELECT count(*) FROM lessons) AS n`);
    if (Number(existing.n) > 0) {
      throw new Error('Target already has courses or lessons. Import into a database without content (no `--seed`).');
    }

    await target.query('BEGIN');

    // 1. People: one placeholder author, plus public profiles for video experts.
    const { rows: [author] } = await target.query(
      `INSERT INTO private.users(name, email, role) VALUES ('Archimedes', $1, 'writer') RETURNING id`,
      [PLACEHOLDER_AUTHOR_EMAIL]
    );
    const { rows: experts } = await source.query(`
      SELECT id, name, avatar, avatar_sizes, bio_html
      FROM private.users
      WHERE id IN (SELECT DISTINCT unnest(expert_ids) FROM videos)
      ORDER BY id`);
    const expertIds = new Map();
    for (const e of experts) {
      const { rows: [row] } = await target.query(
        `INSERT INTO private.users(name, email, avatar, avatar_sizes, bio_html, role)
         VALUES ($1, $2, $3, $4, $5, 'writer') RETURNING id`,
        [e.name, `expert-${e.id}@getmedes.invalid`, rewriteUploads(e.avatar),
         e.avatar_sizes ? rewriteUploads(JSON.stringify(e.avatar_sizes)) : null, rewriteUploads(e.bio_html)]
      );
      expertIds.set(e.id, row.id);
    }

    // 2. Content tables, row data copied as-is apart from the people links.
    const summary = [];
    for (const table of TABLES) {
      const targetColumns = await columns(target, table);
      const sourceColumns = new Set(await columns(source, table));
      const shared = targetColumns.filter((c) => sourceColumns.has(c));
      if (!targetColumns.length || !shared.length) {
        summary.push([table, 'skipped (no matching table)']);
        continue;
      }

      let { rows } = await source.query(`SELECT row_to_json(t) AS r FROM public.${table} t ORDER BY id`);
      rows = rows.map((x) => x.r);

      for (const row of rows) {
        if (AUTHOR_COLUMNS[table] && row[AUTHOR_COLUMNS[table]] != null) row[AUTHOR_COLUMNS[table]] = author.id;
        if (table === 'videos' && Array.isArray(row.expert_ids)) {
          row.expert_ids = row.expert_ids.map((id) => expertIds.get(id)).filter(Boolean);
        }
        if (table === 'topics') row.discussion_count = 0; // discussions are not copied
      }
      rows = dependencyOrder(rows, SELF_REFERENCES[table]);

      const list = shared.map((c) => `"${c}"`).join(', ');
      // json_populate_recordset converts every type (jsonb, arrays, enums)
      // exactly as Postgres would, with no driver-side guessing.
      const chunk = 200;
      for (let i = 0; i < rows.length; i += chunk) {
        await target.query(
          `INSERT INTO public.${table} (${list})
           SELECT ${list} FROM json_populate_recordset(NULL::public.${table}, $1::json)`,
          [rewriteUploads(JSON.stringify(rows.slice(i, i + chunk)))]
        );
      }
      // Move the id sequence past the copied ids (tables with text ids, like
      // games, have no sequence).
      const { rows: [seq] } = await target.query(`SELECT pg_get_serial_sequence('public.${table}', 'id') AS s`);
      if (seq.s) {
        await target.query(`SELECT setval($1, GREATEST((SELECT max(id) FROM public.${table}), 1))`, [seq.s]);
      }
      summary.push([table, rows.length]);
    }

    // The backup's stored per-course totals were stale (lessons moved between
    // courses never updated the old course), so recompute them from the lessons.
    await target.query(`
      UPDATE courses c SET
        lesson_count = (SELECT count(*) FROM lessons l WHERE l.course_id = c.id),
        duration = (SELECT sum(duration) FROM lessons l WHERE l.course_id = c.id)`);

    await target.query('COMMIT');

    console.log('Imported content:');
    for (const [table, n] of summary) console.log(`  ${table.padEnd(16)} ${n}`);
    console.log(`  placeholder author: 1, video expert profiles: ${expertIds.size}`);
    console.log(process.env.UPLOADS_BASE_URL
      ? `Rewrote ${rewrittenLinks} image links to ${process.env.UPLOADS_BASE_URL}/`
      : 'Image links still point at the old S3 bucket (set UPLOADS_BASE_URL to rewrite them).');
    console.log('No user accounts, posts, activity, devices or companies were copied.');
  } catch (e) {
    await target.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch((e) => {
  console.error('Content import failed:', e.message);
  process.exit(1);
});
