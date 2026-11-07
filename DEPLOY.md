# Deploying Archimedes to Vercel + getmedes.com

The repo deploys as **two Vercel projects** from the same GitHub repo, plus a
hosted Postgres database:

| Vercel project | Root directory | Domains | What it serves |
|---|---|---|---|
| `archimedes-frontend` | `frontend` | `app.getmedes.com` | The app, plus the marketing page's HTML/CSS/images |
| `archimedes-backend` | `backend` | `getmedes.com`, `www.getmedes.com`, `api.getmedes.com` | The API, and the marketing pages (rendered from the frontend's `marketing.html`) |

Both fit on Vercel's free Hobby plan as long as the site stays non-commercial
(no charging, ads, or paid referral deals).

Do the steps in order: the backend needs the database, and the marketing
pages need the frontend to be live.

---

## 1. Create the database (Neon)

1. In Vercel, open **Storage** (or **Integrations → Marketplace**) and add
   **Neon Postgres** on the free plan. Connect it to the `archimedes-backend`
   project once that project exists (you can also do this after step 3).
   The integration sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`
   (direct) on the project.
2. Create the schema once, from your machine, using the **direct** URL
   (Neon dashboard → Connection details → untick "Connection pooling"):

   ```bash
   cd backend
   DATABASE_URL_UNPOOLED='postgres://…neon.tech/neondb?sslmode=require' npm run db:setup
   ```

   This creates the tables without any sample data. (`--seed` loads the test
   accounts and is refused when `NODE_ENV=production`.) The old public
   `POST /install` route no longer exists.

3. **Import the course content** from the January 2023 production backup.
   Restore the backup into a local database first, then copy only the
   content across:

   ```bash
   createdb archimedes_backup
   pg_restore --no-owner --no-privileges -d archimedes_backup /path/to/backup.dump
   psql -d archimedes_backup -c "CREATE AGGREGATE array_cat_agg(anycompatiblearray) (SFUNC=array_cat, STYPE=anycompatiblearray);"

   cd backend
   SOURCE_DATABASE_URL=postgresql://localhost/archimedes_backup \
   DATABASE_URL_UNPOOLED='postgres://…neon.tech/neondb?sslmode=require' \
   UPLOADS_BASE_URL=https://app.getmedes.com/uploads \
   npm run import:content
   ```

   This copies courses, lessons, quizzes, videos, topics, goals, tasks,
   achievements and games. It copies **no** user accounts, posts, activity,
   devices or companies. Lesson authors become one "Archimedes" placeholder;
   the 5 video presenters are copied as public profiles only (name, photo,
   bio) with no login. Run it before anyone signs up; it refuses to run if the
   target already has courses. (The `pg_restore` step reports one error about
   `array_cat`, which the `CREATE AGGREGATE` line fixes.)

   **Images:** the 4,068 lesson, course, video and task images from the old
   company's S3 bucket are copied into `frontend/public/uploads/` (same folder
   layout as the bucket) and served by the frontend project at
   `https://app.getmedes.com/uploads/…`. `UPLOADS_BASE_URL` rewrites every old
   bucket link to that address during the import, so nothing depends on the
   old bucket. `frontend/vercel.json` serves `/uploads` with long caching,
   cross-origin access for the marketing site, and a policy that stops SVGs
   from running scripts.

   Keep the backup file out of the repo and off shared drives: it contains
   2,897 real users' emails and password hashes.

## 2. Deploy the frontend (`app.getmedes.com`)

1. Vercel → **Add New… → Project** → import `Scooby-Dooby-Gu/archimedes`.
2. **Root Directory:** `frontend`. **Framework preset:** Other. Build command
   and output directory come from `frontend/vercel.json`.
3. **Node.js version** (Settings → General): 24.x if offered, otherwise 22.x.
4. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_URL` | `https://app.getmedes.com` |
   | `API_URL` | `https://api.getmedes.com` |
   | `GOOGLE_CLIENT_ID` | optional, enables "Sign in with Google" |
   | `APPLE_CLIENT_ID` | optional, enables "Sign in with Apple" |
   | `SENTRY_DSN` | optional |
   | `VAPID_PUBLIC_KEY` | optional, same as the backend's |

   These are baked in at build time, so redeploy after changing them.
5. Deploy, then **Settings → Domains → Add** `app.getmedes.com`. Vercel shows
   the DNS record to create (step 5).

## 3. Deploy the backend (`getmedes.com`, `www`, `api`)

1. **Add New… → Project** → the same repo again.
2. **Root Directory:** `backend`. **Framework preset:** Other.
3. **Node.js version:** same as the frontend.
4. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_URL` | `https://app.getmedes.com` |
   | `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | set by the Neon integration |
   | `SENDGRID_API_KEY` | **needed for sign-ups**: new accounts must click a verification email |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional, Google sign-in |
   | `APPLE_CLIENT_ID` | optional, Apple sign-in |
   | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_USER_UPLOADS_BUCKET`, `AWS_S3_USER_UPLOADS_BUCKET_REGION` | optional, image uploads |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | optional, web push |
   | `APN_KEY`, `APN_KEY_ID`, `APN_TEAM_ID` | optional, iOS push |
   | `SENTRY_DSN` | optional |

   Anything optional can be left out: that feature is simply off.
5. Deploy. On **production** deploys the build runs `npm run db:migrate`
   (under a lock, so two deploys never migrate at once). Preview deploys skip
   migrations, because they may share the production database.
6. **Settings → Domains → Add** `getmedes.com`, `www.getmedes.com` and
   `api.getmedes.com`. Pick `getmedes.com` as the primary and let `www`
   redirect to it (or the other way round).

### Before switching DNS: test on the vercel.app URLs

Each project gets a `*.vercel.app` URL. To test end-to-end before touching
DNS, temporarily set the frontend's `API_URL` to the backend's `vercel.app`
URL and the backend's `APP_URL` to the frontend's, redeploy both, and try
signing up. Switch them back to the `getmedes.com` URLs before step 5.

### Make yourself an admin

The database starts with no users. Sign up on the live site, then in the Neon
SQL editor:

```sql
UPDATE private.users SET role = 'admin', verified_at = NOW()
WHERE email = 'you@example.com';
```

## 4. Google / Apple sign-in (optional)

- **Google:** in Google Cloud Console, edit the OAuth client and add
  `https://app.getmedes.com` under **Authorized JavaScript origins**.
- **Apple:** in the Services ID configuration, add `app.getmedes.com` as a
  domain and `https://app.getmedes.com/signin/apple` as a return URL.

---

## 5. Point getmedes.com at Vercel (Squarespace DNS)

getmedes.com is registered at **Squarespace Domains** (it moved there from
Google Domains). Right now the bare domain points at a Squarespace site, and
`www` and `app` point at Heroku, which no longer works.

> **Use the exact values Vercel shows** on each project's **Settings → Domains**
> page. Vercel has used `76.76.21.21` (A) and `cname.vercel-dns.com` (CNAME)
> for years, but newer projects can get project-specific values.

1. Sign in at **https://account.squarespace.com** with the account that owns
   getmedes.com.
2. Open **Domains** and click **getmedes.com**.
3. Open **DNS** (in some accounts: **DNS → DNS Settings**).
4. **Remove the old records** for the names you're moving:
   - If there's a **Squarespace Defaults** section (A records `198.185.159.x`
     and a `www` CNAME to `ext-sq.squarespace.com`), delete it with its trash
     icon. Only do this if you don't need the Squarespace site any more.
   - Under **Custom records**, delete the `www` and `app` CNAMEs pointing at
     `…herokudns.com`.
   - **Leave MX, TXT and other records alone**: they handle email and domain
     verification.
5. **Add the Vercel records** under **Custom records → Add record**:

   | Type | Host | Data (use Vercel's value) |
   |---|---|---|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |
   | CNAME | `app` | `cname.vercel-dns.com` |
   | CNAME | `api` | `cname.vercel-dns.com` |

   Keep the default TTL and save each record.
6. Back in Vercel, each domain should turn **Valid Configuration** within a
   few minutes to a few hours, and Vercel issues the HTTPS certificates
   automatically.

If Squarespace says the domain uses **custom nameservers**, the records
must be edited wherever those nameservers are hosted instead. Squarespace's
own nameservers for domains moved from Google Domains look like
`ns-cloud-b1.googledomains.com`, and that's what getmedes.com uses today, so
editing in Squarespace should work.

---

## Running locally

```bash
cd backend && npm install && npm run db:setup -- --seed && npm run start:development
cd frontend && npm install && npm run start:development
```

See `backend/.env.example` and `frontend/.env.example` for settings.
