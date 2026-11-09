import { defineMachine } from './machine.js';

// A user account. Stored as private.users.verified_at (null until verified).
//
//   unverified --verify--> active
//
// "verify" happens when someone clicks the email link (POST /verifications/:token),
// signs in with Google/Apple, accepts an invite, sets a password from a reset
// link, or an admin approves them (PUT /users/:id/approve).
// Signed-out visitors have no account; `accountState(null)` is 'guest'.
export const account = defineMachine({
  name: 'account',
  states: ['unverified', 'active'],
  initial: 'unverified',
  stateOf: (user) => (user && user.verifiedAt ? 'active' : 'unverified'),
  transitions: {
    unverified: { verify: 'active' },
  },
});

export function accountState(user) {
  return user ? account.stateOf(user) : 'guest';
}

export const isActive = (user) => accountState(user) === 'active';
