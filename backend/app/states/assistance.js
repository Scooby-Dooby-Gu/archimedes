import { defineMachine } from './machine.js';

// Expert assistance on a forum discussion. Stored as
// discussions.assistance_requested_at and discussions.assistance_provided_at.
//
//   none --request--> requested --resolve--> resolved
//                     requested --cancel---> none
//                                 resolved --reset--> requested
//
// PUT .../discussions/:id/assistance with {state: <event>} fires an event.
// ("state" is the old name of the field; the values are events.)
export const assistance = defineMachine({
  name: 'assistance',
  states: ['none', 'requested', 'resolved'],
  initial: 'none',
  stateOf: (discussion) =>
    discussion.assistanceProvidedAt ? 'resolved' : discussion.assistanceRequestedAt ? 'requested' : 'none',
  transitions: {
    none: { request: 'requested' },
    requested: { resolve: 'resolved', cancel: 'none' },
    resolved: { reset: 'requested' },
  },
});

// The columns to write when entering each state.
export const ASSISTANCE_COLUMNS = {
  none: { assistance_requested_at: null, assistance_provided_at: null },
  requested: { assistance_requested_at: 'NOW()', assistance_provided_at: null },
  resolved: { assistance_provided_at: 'NOW()' },
};
