import { defineMachine } from './machine.js';

// A password reset link (password_reset_requests row).
//
//   pending --use--> used
//   pending --(24 hours pass)--> expired
//
// Only a pending link can set a password. Unknown tokens read as 'missing'.
export const RESET_LINK_TTL_MS = 24 * 60 * 60 * 1000;

export const passwordReset = defineMachine({
  name: 'password reset link',
  states: ['missing', 'pending', 'used', 'expired'],
  initial: 'pending',
  stateOf: (request, now = Date.now()) => {
    if (!request) return 'missing';
    if (request.usedAt) return 'used';
    if (new Date(request.createdAt).getTime() < now - RESET_LINK_TTL_MS) return 'expired';
    return 'pending';
  },
  transitions: {
    pending: { use: 'used', expire: 'expired' },
  },
});

// What to tell the person for each state that can't be used.
export const PASSWORD_RESET_MESSAGES = {
  missing: 'Password request was not found',
  used: 'This password reset link was already used. Please submit another.',
  expired: 'Password reset request is expired. Please submit another.',
};
