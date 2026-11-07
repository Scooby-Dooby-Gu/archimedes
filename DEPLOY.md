# Deploying Archimedes to Vercel on gufamily.org

The repo deploys as **two Vercel projects** from the same GitHub repo, plus a
hosted Postgres database, on two subdomains of gufamily.org:

| Vercel project | Root directory | Domain | What it serves |
|---|---|---|---|
| `archimedes-backend` | `backend` | `archimedes.gufamily.org` | The marketing site (home page, public lessons, sitemap) **and** the API |
| `archimedes-frontend` | `frontend` | `app.archimedes.gufamily.org` | The web app, the marketing page's HTML/CSS, and the lesson images (`/uploads`) |

The app lives on its own subdomain rather than a path like
`gufamily.org/archimedes`: it keeps users' login keys in browser storage,
which a subdomain keeps separate from the personal site.

No domain is hardcoded. Everything comes from these settings:

| Setting | Value here | Used for |
|---|---|---|
| `SITE_URL` | `https://archimedes.gufamily.org` | Marketing links, share links, sitemap |
| `APP_URL` | `https://app.archimedes.gufamily.org` | Sign-up links, app links, images |
| `API_URL` (frontend) | `https://archimedes.gufamily.org` | Where the app sends API requests |
| `CONTACT_EMAIL` | e.g. `simon@gufamily.org` | "Having trouble? Email …" |
| `EMAIL_FROM`, `EMAIL_FROM_NAME` (backend) | an address on the domain verified in Resend | Outgoing email |

Both projects fit on Vercel's free Hobby plan as long as the site stays
non-commercial (no charging, ads, or paid referral deals).

Do the steps in order: the backend needs the database, and the marketing
pages need the frontend to be live.

---

## 1. Create the database (Neon)

1. In Vercel, open **Storage** (or **Integrations → Marketplace**) and add
   **Neon Postgres** on the free plan. Connect it to the `archimedes-backend`
   project once that project exists (you can also do this after step 3).
   The integration sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`
   (direct) on the project.
2. The schema is created automatically: the backend's first production
   deploy finds an empty database and creates the tables (no sample data);
   later deploys only apply migrations. You can also do it by hand with the
   **direct** URL (Neon → Connect → turn off "Connection pooling"):

   ```bash
   cd backend
   DATABASE_URL_UNPOOLED='postgres://…neon.tech/neondb?sslmode=require' npm run db:setup
   ```

   (`--seed` loads the test accounts and is refused when
   `NODE_ENV=production`.) Note that the Neon integration stores its variables
   as *sensitive* in Vercel, so `vercel env pull` returns them empty: copy the
   connection string from the Neon dashboard when a local command needs it.

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
   APP_URL=https://app.archimedes.gufamily.org \
   SITE_URL=https://archimedes.gufamily.org \
   npm run import:content
   ```

   This copies courses, lessons, quizzes, videos, topics, goals, tasks,
   achievements and games. It copies **no** user accounts, posts, activity,
   devices or companies. Lesson authors become one "Archimedes" placeholder;
   the 5 video presenters are copied as public profiles only (name, photo,
   bio) with no login. Run it before anyone signs up; it refuses to run if the
   target already has courses. (The `pg_restore` step reports one error about
   `array_cat`, which the `CREATE AGGREGATE` line fixes.)

   **Links:** the import rewrites old `app.getmedes.com` links to `APP_URL`,
   `getmedes.com`/`www.getmedes.com` links to `SITE_URL`, and links to the
   old company's S3 bucket to `APP_URL/uploads`. A few old email addresses
   written into lesson text (e.g. `legal@getmedes.com`) are left as they are.

   **Images:** the 4,068 lesson, course, video and task images are in
   `frontend/public/uploads/` (same layout as the old bucket), served by the
   frontend project with long caching, cross-origin access for the marketing
   site, and a policy that stops SVGs from running scripts.

   Keep the backup file out of the repo and off shared drives: it contains
   2,897 real users' emails and password hashes.

## 2. Deploy the frontend (`app.archimedes.gufamily.org`)

1. Vercel → **Add New… → Project** → import `Scooby-Dooby-Gu/archimedes`.
2. **Root Directory:** `frontend`. **Framework preset:** Other. Build command
   and output directory come from `frontend/vercel.json`.
3. **Node.js version** (Settings → General): 24.x if offered, otherwise 22.x.
4. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_URL` | `https://app.archimedes.gufamily.org` |
   | `SITE_URL` | `https://archimedes.gufamily.org` |
   | `API_URL` | `https://archimedes.gufamily.org` |
   | `CONTACT_EMAIL` | optional, shown when verification email trouble comes up |
   | `GOOGLE_CLIENT_ID` | optional, enables "Sign in with Google" |
   | `APPLE_CLIENT_ID` | optional, enables "Sign in with Apple" |
   | `SENTRY_DSN` | optional |
   | `VAPID_PUBLIC_KEY` | optional, same as the backend's |

   These are baked in at build time, so redeploy after changing them.
5. Deploy, then **Settings → Domains → Add** `app.archimedes.gufamily.org`.
   Vercel shows the DNS record to create (step 5).

## 3. Deploy the backend (`archimedes.gufamily.org`)

1. **Add New… → Project** → the same repo again.
2. **Root Directory:** `backend`. **Framework preset:** Other.
3. **Node.js version:** same as the frontend.
4. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `APP_URL` | `https://app.archimedes.gufamily.org` |
   | `SITE_URL` | `https://archimedes.gufamily.org` |
   | `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | set by the Neon integration |
   | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` | email (see "Email" below) |
   | `CONTACT_EMAIL` | where waitlist and demo-request form submissions are emailed |
   | `CRON_SECRET` | optional, 16+ random characters; lets scheduled jobs call the reminder/notification routes |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | optional, Google sign-in |
   | `APPLE_CLIENT_ID` | optional, Apple sign-in |
   | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_USER_UPLOADS_BUCKET`, `AWS_S3_USER_UPLOADS_BUCKET_REGION` | optional, new image uploads from the lesson editor |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | optional, web push |
   | `APN_KEY`, `APN_KEY_ID`, `APN_TEAM_ID` | optional, iOS push |
   | `SENTRY_DSN` | optional |

   Anything optional can be left out: that feature is simply off.
5. Deploy. On **production** deploys the build runs `npm run db:migrate`
   (under a lock, so two deploys never migrate at once). Preview deploys skip
   migrations, because they may share the production database.
6. **Settings → Domains → Add** `archimedes.gufamily.org`.

### Email

New accounts must confirm their email before most of the app unlocks. Email
goes through **[Resend](https://resend.com)** (free plan: about 3,000 emails a
month, 100 a day). The emails themselves (verification, password reset,
invites, reminders, …) are written in `backend/app/helpers/email-templates.js`,
so there's nothing to set up inside Resend besides the domain.

1. Create a Resend account and **Domains → Add Domain**. Use a sending
   subdomain such as `archimedes.gufamily.org`, which keeps any delivery
   problems away from your main gufamily.org mail.
2. Resend shows a few DNS records (a TXT record for DKIM, plus MX and TXT
   records for SPF on a `send` sub-subdomain). Add them **exactly as shown**
   in gufamily.org's DNS (Squarespace → Domains → gufamily.org → DNS →
   Custom records), then click **Verify** in Resend. They don't affect the
   existing records for the personal site or your email.
3. **API Keys → Create API key** with "Sending access", and set it as
   `RESEND_API_KEY` on the backend project.
4. Set `EMAIL_FROM` to an address on the verified domain, e.g.
   `hello@archimedes.gufamily.org`, and `EMAIL_FROM_NAME` to `Archimedes`.
   Replies go to the same address, so either set up forwarding for it or use
   an address you read.

Without `RESEND_API_KEY` nothing is sent: each email, including its link, is
printed to the backend log instead. That's how local development works. On
the live site, you can still verify someone by hand in the Neon SQL editor:

```sql
UPDATE private.users SET verified_at = NOW() WHERE email = 'someone@example.com';
```

The free plan's 100-a-day limit only matters for the reminder emails, which
go out in bulk.

### Scheduled jobs (optional)

`GET /notifications/daily` (push notifications), `POST /reminders/invites` and
`POST /reminders/limbo` (reminder emails) used to be public; they now need an
admin or `Authorization: Bearer <CRON_SECRET>`. To run them on a schedule,
set `CRON_SECRET` on the backend project and add a `crons` entry to
`backend/vercel.json` (Vercel Cron sends the header for you). Vercel's Hobby
plan runs each cron job at most once a day. Nothing is scheduled by default.

### Before switching DNS: test on the vercel.app URLs

Each project gets a `*.vercel.app` URL. To test end-to-end before touching
DNS, temporarily set the frontend's `API_URL` to the backend's `vercel.app`
URL and both projects' `APP_URL` to the frontend's, redeploy both, and try
signing up. Switch them back before step 5.

### Make yourself an admin

The database starts with no users. Sign up on the live site, then in the Neon
SQL editor:

```sql
UPDATE private.users SET role = 'admin', verified_at = NOW()
WHERE email = 'you@example.com';
```

## 4. Google / Apple sign-in (optional)

- **Google:** in Google Cloud Console, edit the OAuth client and add
  `https://app.archimedes.gufamily.org` under **Authorized JavaScript origins**.
- **Apple:** in the Services ID configuration, add
  `app.archimedes.gufamily.org` as a domain and
  `https://app.archimedes.gufamily.org/signin/apple` as a return URL.

---

## 5. DNS: add the two subdomains to gufamily.org

gufamily.org's bare domain already points at Vercel for the personal site, so
nothing existing changes: you only **add** two records. The domain uses the
Google/Squarespace nameservers (`ns-cloud-d*.googledomains.com`), so edit DNS
wherever gufamily.org is registered (most likely **Squarespace Domains**,
where Google Domains moved).

> **Use the exact values Vercel shows** on each project's **Settings → Domains**
> page (or `vercel domains inspect <domain>`). For these subdomains it asked
> for A records to `76.76.21.21`.

1. Sign in at **https://account.squarespace.com** → **Domains** → **gufamily.org**
   → **DNS**.
2. Under **Custom records** (not Presets) → **Add record**, add:

   | Type | Host | Data (use Vercel's value) |
   |---|---|---|
   | A | `archimedes` | `76.76.21.21` |
   | A | `app.archimedes` | `76.76.21.21` |

   Host is only the part before `gufamily.org`.

3. **Don't touch** the existing `@`/`www` records (the personal site) or any
   MX/TXT records (email).
4. Back in Vercel, both domains should turn **Valid Configuration** within a
   few minutes to a few hours, and Vercel issues the HTTPS certificates
   automatically.

Then link to `https://archimedes.gufamily.org` from the Archimedes entry in the
Work section of the personal site.

### Optional: keep getmedes.com working

getmedes.com is still registered (through Aug 2027). To keep old links alive,
add `getmedes.com`, `www.getmedes.com` and `app.getmedes.com` to the projects
in Vercel as **redirects** to the gufamily.org addresses, and point their DNS at
Vercel in getmedes.com's Squarespace DNS (remove the old Heroku `www`/`app`
CNAMEs and, if you no longer need it, the Squarespace site records).

---

## Running locally

```bash
cd backend && npm install && npm run db:setup -- --seed && npm run start:development
cd frontend && npm install && npm run start:development
```

See `backend/.env.example` and `frontend/.env.example` for settings.
