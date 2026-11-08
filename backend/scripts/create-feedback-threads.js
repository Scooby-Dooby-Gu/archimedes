#!/usr/bin/env node
// Give every lesson a feedback thread, so learners see "Provide feedback" at
// the bottom of each lesson. The old app had one discussion per lesson in the
// "Lesson discussions" topic (board 3, topic 0), started by staff; the content
// import doesn't copy discussions, so they're recreated here, empty.
//
//   DATABASE_URL_UNPOOLED=postgres://...  npm run feedback-threads
//
// Safe to run again: lessons that already have a thread are skipped. Threads
// are authored by the "Archimedes" placeholder user from the content import.
import 'dotenv/config';
import pg from 'pg';

const TOPIC_ID = 0; // "Lesson discussions" (the lesson page links to /boards/3/topics/0)
const PLACEHOLDER_AUTHOR_EMAIL = 'content@getmedes.invalid';
// Same text as the lesson page's "Start feedback page" button pre-fills.
const DESCRIPTION = `* Did you find anything confusing?
* Were there any mistakes or typos?
* Do you have any suggested supplementary materials?

Please let us know! We're here to help.`;

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL_UNPOOLED or DATABASE_URL.');
  process.exit(1);
}
const isLocal = /\/\/(?:[^@\/]*@)?(localhost|127\.0\.0\.1)(?::\d+)?\//.test(url) || /sslmode=disable/.test(url);
const db = new pg.Client({ connectionString: url, ssl: isLocal ? undefined : { rejectUnauthorized: false } });

async function main() {
  await db.connect();
  try {
    await db.query('BEGIN');
    const { rows: [topic] } = await db.query('SELECT id FROM topics WHERE id = $1', [TOPIC_ID]);
    if (!topic) throw new Error(`Topic ${TOPIC_ID} ("Lesson discussions") doesn't exist. Import the content first.`);

    const { rows: [author] } = await db.query('SELECT id FROM private.users WHERE email = $1', [PLACEHOLDER_AUTHOR_EMAIL]);
    if (!author) throw new Error(`No placeholder author (${PLACEHOLDER_AUTHOR_EMAIL}). Import the content first.`);

    const { rows } = await db.query(
      `INSERT INTO discussions (topic_id, user_id, lesson_id, name, description, created_at, last_reply_at)
       SELECT $1, $2, l.id, 'Feedback for ' || l.name, $3, l.created_at, l.created_at
       FROM lessons l
       WHERE NOT EXISTS (SELECT 1 FROM discussions d WHERE d.lesson_id = l.id)
       ORDER BY l.id
       RETURNING id`,
      [TOPIC_ID, author.id, DESCRIPTION]
    );
    await db.query('COMMIT');

    const { rows: [counts] } = await db.query(
      `SELECT (SELECT count(*) FROM lessons) AS lessons,
              (SELECT count(DISTINCT lesson_id) FROM discussions) AS with_thread`
    );
    console.log(`Created ${rows.length} feedback threads. ${counts.with_thread} of ${counts.lessons} lessons now have one.`);
  } catch (e) {
    await db.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error('Creating feedback threads failed:', e.message);
  process.exit(1);
});
