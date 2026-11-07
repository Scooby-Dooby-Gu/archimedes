import * as Stocks from './stocks';
import * as Loans from './loans';
import * as Life from './life';
import * as Career from './career';
import * as Property from './property';
import * as News from './news';

const Modules = [Stocks, Loans, Life, Property, Career, News];
export function process(action, state) {
  const newAction = {
    ...action,
    year: state.year
  }
  return Modules.reduce((newAction, Module) => {
    if (newAction && Module.middleware[newAction.type]) {
      return Module.middleware[newAction.type](newAction, state)
    }
    return newAction
  }, newAction)
}

export function append(action, state, actions) {
  var newAction = action;
  const newActions = actions.slice().reverse().map((oldAction) => {
    const appender = Stocks.appenders[action.type] || Loans.appenders[action.type] || Property.appenders[action.type] || Career.appenders[action.type] || News.appenders[action.type];
    if (appender) {
      const replacement = appender(oldAction, action, state, actions);
      if (replacement) {
        const [oldActionReplacment, newActionReplacement] = replacement;
        if (newAction)
          newAction = newActionReplacement;
        return oldActionReplacment;
      }
    }
    return oldAction;
  }).filter((a) => a);
  if (newAction) {
    return newActions.concat(newAction);
  } else {
    return newActions;
  }
}

export function perform(action, state, actions) {
  return Modules.reduce((newActions, Module) => {
    if (Module.actions[action.type]) {
      // action can yield more actions
      return newActions.concat( Module.actions[action.type](action, state, actions) || [])
    }
    return newActions
  }, []);
}

// process and transform action itself (e.g. apply limits to avoid overspending)
// action can be turned to no-op as well
export function execute(action, state, actions) {
  // enrich action with metadata, check if it is no-op
  const enrichedAction = process(action, state, actions);
  if (!enrichedAction) {
    return actions;
  }

  // register action in the list (may combine with another action)
  const combinedActions = append(enrichedAction, state, actions);
  
  // if action yields more actions, recursively execute those too
  const yieldedActions = perform(enrichedAction, state, combinedActions)
  return yieldedActions.reduce((accumulatedActions, yieldedAction) => {
    return execute(yieldedAction, state, accumulatedActions);
  }, []).concat(combinedActions)

}

// iterate multiple actions if given an array
export function executeAll(actions, state, previousActions) {
  return (actions.push ? actions : [actions]).reduce((newActions, act) => {
    return execute(act, state, newActions);
  }, previousActions);
}