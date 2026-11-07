import * as auth from './auth.jsx';
import * as app from './app.jsx';
import * as data from './data.jsx';
import * as requests from './requests.jsx';
import * as location from './location.jsx';
import * as notifications from './notifications.jsx';
import update from '/lib/immutability'

export const reducer = (state, action) => {
  const nextState = update(state, {
    $merge: {
      app: app.reducer(state.app, action),
      auth: auth.reducer(state.auth, action),
      data: data.reducer(state.data, action),
      requests: requests.reducer(state.requests, action),
      location: location.reducer(state.location, action, state),
      notifications: notifications.reducer(state.notifications, action),
    }
  })
  if (state !== nextState) {
    console.log(...console.row('#43a047', 'action', action.type, '', console.labelObject(action, 'Action'), console.labelObject(state, 'Before'), console.labelObject(nextState, 'After')))
  } else {
    console.log(...console.row('#666', 'action', action.type, '', console.labelObject(action, 'Action'), console.labelObject(state, 'Before'), console.labelObject(nextState, 'After')))
  }
  return nextState;
}

const modules = [auth, app, data, requests, notifications, location];
export const middleware = async (state, action, dispatch) => {
  return modules.reduce((promise, module) => {
    return promise.then((previousAction) => previousAction && module.middleware(state, previousAction, dispatch))
  }, Promise.resolve(action))
}

export const observers = (state, oldState) => {
  return modules.forEach((module) => {
    for (var moduleName in module.observers) {
      for (var key in module.observers[moduleName]) {
        const old = oldState[moduleName][key]
        const value = state[moduleName][key]
        if (old !== value) {
          const prop = moduleName + '.' + key;
          console.log(...console.row('#8943a0', 'notify', prop, moduleName, console.labelObject(old, 'Before'), console.labelObject(value, 'After')))
          module.observers[moduleName][key](value, old, state)
        }
      }
    }
  })
}



export const initialState = {
  auth: auth.initialState,
  app: app.initialState,
  data: data.initialState,
  requests: requests.initialState,
  location: location.initialState,
  notifications: notifications.initialState,
};

console.log(...console.row('rgb(67, 160, 71)', 'redux ', 'initial', '', console.labelObject(initialState, 'State')))
  