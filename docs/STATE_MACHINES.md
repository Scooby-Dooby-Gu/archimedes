# State machines

Most lifecycles in Archimedes are stored as plain columns, usually nullable
timestamps like `verified_at` or `assistance_requested_at`. The rules about
which states exist and how a record moves between them used to live in
scattered `if` checks. This file lists every lifecycle in the app. The ones
with real rules are now explicit modules.

## Explicit machines

Backend modules live in [`backend/app/states/`](../backend/app/states). Each
one is plain data built with `defineMachine` (no library). It has:

- `states`
- `stateOf(row)`, which reads the state from a database row (camelCase fields)
- `transitions`: `{ state: { event: nextState } }`
- `next(state, event)`, which returns the next state or throws
  `InvalidTransition` (HTTP 409)
- `can(state, event)` and `events(state)`

The frontend can't import backend files, because the two folders deploy
separately. [`frontend/src/lib/states.js`](../frontend/src/lib/states.js)
therefore has small read-only copies of the `stateOf` functions. A backend test
fails if they disagree.

### Account (`account.js`)

Stored in `private.users.verified_at`.

```
guest (signed out)    unverified --verify--> active
```

- **verify** happens when someone clicks the email link
  (`POST /verifications/:token`), signs in with Google or Apple, accepts an
  invite, sets a password from a reset link, or an admin approves them
  (`PUT /users/:id/approve`).
- **Who uses it:**
  - Every route guard in `helpers/finders.js` requires `isActive(user)`,
    except `possiblyUnverifiedUserOnly`.
  - The frontend router uses `accountState(user)`: `isUser` means active, and
    `isOnboarding` means unverified.
- **Roles** (`user`, `writer`, `moderator`, `admin` and others) are a separate
  dimension and aren't part of this machine. See `isWriter` and `isModerator`
  in `helpers/finders.js`.

### Password reset link (`password-reset.js`)

Stored in `password_reset_requests`: `created_at` and `used_at`.

```
pending --use--> used
pending --(24 hours)--> expired          unknown token: missing
```

- `GET /password_reset_requests/:token` returns `{state: 'pending'}`. For any
  other state it returns a 400 with a message that says why.
- `PUT /users/:id/password?token=` only accepts a pending link, then marks it
  used.
- The change-password page checks the link before showing the form.

### Assistance on a discussion (`assistance.js`)

Stored in `discussions.assistance_requested_at` and
`discussions.assistance_provided_at`.

```
none --request--> requested --resolve--> resolved
                  requested --cancel---> none
                              resolved --reset--> requested
```

- **Firing an event:** send `PUT .../discussions/:id/assistance` with
  `{state: <event>}`. The field is called `state` for historical reasons, but
  its value is an event.
- **Who can fire events:** only the discussion's author or a moderator.
- **Errors:** an event that isn't allowed from the current state returns 409.
  An unknown event returns 400.
- **Response:** includes `assistanceState`.
- **Notifications:** entering `requested` notifies the admins.
- **UI:** the assistance panel is currently turned off in the discussion view
  (`&& false`). The topic list shows the state as an icon.

## Implicit lifecycles left as they are

These are single flags, or states that only change in one place. Wrapping them
in a machine would add code without removing any rules. If one of them grows
more transitions, move it into `backend/app/states/`.

| Lifecycle | Stored as | States | Changed in |
|---|---|---|---|
| Video | `videos.published_at`, `scheduled_at` | upcoming (takes questions) → published | Video editor, writers only. Read with `videoState()` in the frontend. |
| Lesson publication | `lessons.published_at` | Only a display date. Unpublished lessons are still shown. | Lesson editor |
| Course visibility | `courses.state` enum | public, preview, hidden | Course editor |
| Discussion moderation | `discussions.closed_at`, `pinned_at` | open or closed; pinned or not | `POST .../discussions/:id`, moderators only |
| Invite | `invites.accepted_at`, `email` | pending → accepted. A link with no email can be reused and is never marked accepted. | `acceptInvitation()` in `profile/auth.js` |
| Game session | `game_sessions.is_finished` | playing → finished | `play/games.js` |
| Submission | `submissions.is_complete`, `is_skipped` | in progress, complete, skipped | `POST /users/:id/submissions` |
| Company | `companies.status` enum | enabled, disabled | Company settings, admins and managers |
| API request (frontend) | `REQUEST_*` in `frontend/src/lib/request.jsx` | initial → loading → success or failure | `useRemoteData` and `useFetchedData` |
| Rate limit window | `private.rate_limits` | Counting within the window, or blocked until it resets | `helpers/rate-limit.js` |

## Adding or changing a machine

1. Add or edit the module in `backend/app/states/` and export it from
   `index.js`.
2. In handlers, read the current state with `stateOf(row)` and move it with
   `next(state, event)`. Don't compare timestamps by hand.
3. If the frontend shows the state, add a reader to
   `frontend/src/lib/states.js`, then extend the parity test.
4. Run `npm test` in `backend/`. The tests check every allowed and refused
   transition, and that the columns written really land in the target state.
5. Update this file.
