// Unit tests for the lifecycles in app/states/. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  defineMachine, InvalidTransition,
  account, accountState, isActive,
  passwordReset, RESET_LINK_TTL_MS, PASSWORD_RESET_MESSAGES,
  assistance, ASSISTANCE_COLUMNS,
} from '../app/states/index.js';

const HOUR = 60 * 60 * 1000;

test('defineMachine rejects transitions to unknown states', () => {
  assert.throws(() => defineMachine({ name: 'x', states: ['a'], transitions: { a: { go: 'b' } } }), /unknown target b/);
  assert.throws(() => defineMachine({ name: 'x', states: ['a'], transitions: { z: { go: 'a' } } }), /unknown state z/);
});

test('account: guest, unverified, active', () => {
  assert.equal(accountState(null), 'guest');
  assert.equal(accountState({ id: 1, verifiedAt: null }), 'unverified');
  assert.equal(accountState({ id: 1, verifiedAt: new Date() }), 'active');
  assert.equal(isActive({ verifiedAt: null }), false);
  assert.equal(isActive({ verifiedAt: '2026-01-01' }), true);
  assert.equal(account.next('unverified', 'verify'), 'active');
  assert.throws(() => account.next('active', 'verify'), InvalidTransition);
});

test('password reset link: missing, pending, used, expired', () => {
  const now = Date.now();
  assert.equal(passwordReset.stateOf(null), 'missing');
  assert.equal(passwordReset.stateOf({ createdAt: new Date(now - HOUR) }, now), 'pending');
  assert.equal(passwordReset.stateOf({ createdAt: new Date(now - RESET_LINK_TTL_MS - 1) }, now), 'expired');
  assert.equal(passwordReset.stateOf({ createdAt: new Date(now - HOUR), usedAt: new Date(now) }, now), 'used');
  // A used link stays "used" even after it would have expired.
  assert.equal(passwordReset.stateOf({ createdAt: new Date(now - 2 * RESET_LINK_TTL_MS), usedAt: new Date(now) }, now), 'used');
  for (const state of ['missing', 'used', 'expired']) assert.ok(PASSWORD_RESET_MESSAGES[state]);
  assert.equal(passwordReset.next('pending', 'use'), 'used');
  assert.throws(() => passwordReset.next('used', 'use'), InvalidTransition);
});

test('assistance: reading state from the two timestamps', () => {
  assert.equal(assistance.stateOf({}), 'none');
  assert.equal(assistance.stateOf({ assistanceRequestedAt: new Date() }), 'requested');
  assert.equal(assistance.stateOf({ assistanceRequestedAt: new Date(), assistanceProvidedAt: new Date() }), 'resolved');
});

test('assistance: every allowed move, and nothing else', () => {
  const allowed = {
    none: { request: 'requested' },
    requested: { resolve: 'resolved', cancel: 'none' },
    resolved: { reset: 'requested' },
  };
  const events = ['request', 'cancel', 'resolve', 'reset'];
  for (const state of assistance.states) {
    for (const event of events) {
      const target = allowed[state][event];
      if (target) assert.equal(assistance.next(state, event), target, `${state} --${event}-->`);
      else assert.throws(() => assistance.next(state, event), (e) => e instanceof InvalidTransition && e.status === 409, `${state} --${event}--> should be refused`);
    }
  }
});

test('assistance: the columns written land in the target state', () => {
  // Apply each target's column patch to a row in the source state and read it back.
  const rowFor = {
    none: {},
    requested: { assistanceRequestedAt: 'then' },
    resolved: { assistanceRequestedAt: 'then', assistanceProvidedAt: 'then' },
  };
  const camel = (c) => c.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase());
  for (const from of assistance.states) {
    for (const event of assistance.events(from)) {
      const to = assistance.next(from, event);
      const row = { ...rowFor[from] };
      for (const [column, value] of Object.entries(ASSISTANCE_COLUMNS[to])) row[camel(column)] = value === null ? null : 'now';
      assert.equal(assistance.stateOf(row), to, `${from} --${event}--> ${to}`);
    }
  }
});

// The frontend reads the same states (frontend/src/lib/states.js). They're in
// separate deploys, so they can't share a file; this keeps them in step.
const frontendStates = fileURLToPath(new URL('../../frontend/src/lib/states.js', import.meta.url));
test('frontend state readers agree with the backend', { skip: !fs.existsSync(frontendStates) && 'frontend not checked out' }, async () => {
  const fe = await import(pathToFileURL(frontendStates).href);
  const users = [null, { verifiedAt: null }, { verifiedAt: '2026-01-01' }];
  for (const user of users) assert.equal(fe.accountState(user), accountState(user));
  const discussions = [{}, { assistanceRequestedAt: 'x' }, { assistanceRequestedAt: 'x', assistanceProvidedAt: 'y' }, { assistanceProvidedAt: 'y' }];
  for (const d of discussions) assert.equal(fe.assistanceState(d), assistance.stateOf(d));
  assert.equal(fe.videoState({ publishedAt: null }), 'upcoming');
  assert.equal(fe.videoState({ publishedAt: '2026-01-01' }), 'published');
});
