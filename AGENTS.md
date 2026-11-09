# AGENTS.md

Notes for coding agents and new developers.

- **Layout:**
  - `backend/` is an Express app on Postgres (ESM). It deploys as one Vercel
    function.
  - `frontend/` is the Preact and Vite app.
  - The two deploy separately, so they can't import each other's files.
- **Deploying and environment:** see [DEPLOY.md](DEPLOY.md).
- **Lifecycles** (accounts, password reset links, discussion assistance and
  others) are listed in [docs/STATE_MACHINES.md](docs/STATE_MACHINES.md).
  Change state through the machines in `backend/app/states/`, not by
  hand-checking timestamps.
- **Authorization:**
  - Use the guards in `backend/app/helpers/finders.js`: `userOnly`,
    `writerOnly`, `moderatorOnly`, `adminOnly` and `selfOnly`.
  - Use the helpers `isWriter`, `isModerator` and `isSelfOrAdmin` for
    ownership checks.
  - Every route that writes needs a guard.
- **Rendering user text:** show anything users write with
  `formatters.userMarkdown`. `formatters.markdown` is for trusted text only.
- **Tests:** `cd backend && npm test`.
