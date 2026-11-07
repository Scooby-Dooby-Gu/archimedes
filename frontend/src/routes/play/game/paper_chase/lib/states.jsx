import nextState from './generators';

export function generate(currentState, turn, log, data) {
  const states = [];
  while (currentState.turn < turn) {
    currentState = nextState(currentState, log, data)
  }
  return currentState
}

export function next(state, log, data) {
  return nextState(state, log, data)
}

export function clean(state) {
  return {
    age: state.age,
    year: state.year,
    birthYear: state.birthYear,
    startingYear: state.startingYear,
    turn: state.turn,
    seed: state.seed,
  }
}

export function initialize(data) {
  return {
    name: 'Player',
    turn: -5,
    age: 13,
    birthYear: 1972,
    startingYear: 1990,
    cash: 0,
    salary: 0,
    expenses: 0,
    stocks: [],
    loans: [],
    loanHistory: [],
    scores: {},
    challenges: {},
    activeChallenges: {},
    ...data,
    seed: data && data.seed || 10000,
  }
}