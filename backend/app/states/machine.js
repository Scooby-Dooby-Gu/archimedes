// A tiny helper for the app's lifecycles. Each lifecycle is stored as plain
// columns (usually nullable timestamps); a machine names its states, says how
// to read the current state from a row, and lists the events allowed in each
// state. No library: just data, so it's easy to read, test and document.
//
//   const m = defineMachine({ name, states, initial, stateOf, transitions });
//   m.stateOf(row)            -> 'requested'
//   m.can('requested', 'resolve') -> true
//   m.next('requested', 'resolve') -> 'resolved' (throws InvalidTransition)

export class InvalidTransition extends Error {
  constructor(machine, state, event) {
    super(`Can't ${event} when ${machine} is ${state}`);
    this.status = 409;
    this.machine = machine;
    this.state = state;
    this.event = event;
  }
}

export function defineMachine({ name, states, initial, stateOf, transitions = {} }) {
  for (const [state, events] of Object.entries(transitions)) {
    if (!states.includes(state)) throw new Error(`${name}: unknown state ${state}`);
    for (const target of Object.values(events)) {
      if (!states.includes(target)) throw new Error(`${name}: unknown target ${target}`);
    }
  }
  const machine = {
    name,
    states,
    initial,
    transitions,
    stateOf,
    events: (state) => Object.keys(transitions[state] || {}),
    can: (state, event) => Boolean(transitions[state] && transitions[state][event]),
    next(state, event) {
      const target = transitions[state] && transitions[state][event];
      if (!target) throw new InvalidTransition(name, state, event);
      return target;
    },
  };
  return Object.freeze(machine);
}
