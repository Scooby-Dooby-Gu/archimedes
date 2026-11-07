import Choices from '../data/choices';
import { useMemo } from '/lib/hooks/index.jsx';
import update from '/lib/immutability';
import narrative from '../data/narrative'

const defaults = {
  prepare: (decision) => decision,
  react: (decision) => decision,
  finalize: (decision, { choice }) => choice && choice.actions || [],
  isOutstanding: () => false,
  isApplicable: () => false,
  isRepeatable: () => false,
  isChainable: () => false,
  isChangable: () => true,
  interpolate,
}

export default function Decisions({ world: { state }, data: { session: { actions, log }}, params: { dialog }}) {

  const available = useMemo(() => 
    Object.values(Choices)

      // provide default methods and propagate title/description from first choice
      .map((decision) => {
        const choice = Object.values(decision.parameters)[0];
        return {
          ...defaults,
          title: choice && choice.title,
          description: choice && choice.description,
          ...decision,
        }
      })

      // generate a unique name for repeatable decisions
      .map((decision) => {
        return dialog && dialog.open && decision.isRepeatable(state) ? update(decision, {
          name: (name) => name + '-' + dialog.uid
        }) : decision;
      })

      // find related actions
      .map((decision) => ({
        choice: decision,
        actions: actions.filter((action) => action.decision === decision.name),
      }))

      // filter out decisions that are not applicable and don't have actions
      .filter((decision) => 
        decision.actions.length || decision.choice.isApplicable(state, log.concat(actions), log))

      // interpolate decision, maintaining the link to original
      .map(({choice, actions}) => {
        return ({
          actions,
          original: choice,
          choice: interpolate(choice.prepare(choice, state, {}), state),
        });
      })
  , [actions, state, dialog.uid]);

  // Decisions that can be changed, outstanding first are called `presented`
  const presented = useMemo(() => {
    return available
      .slice()
      .reverse()
      .sort((a, b) => isDecisionOutstanding(b, state) - isDecisionOutstanding(a, state))
      .filter((decision) => !decision.actions.length || decision.choice.isChangable())
  }, [available])
  
  const outstanding = useMemo(() => 
    available.filter((decision) => isDecisionOutstanding(decision, state)),
  [available, state.year]);



  const narration = narrative[state.turn];

  return {
    narration: interpolate(narration, state),
    available,
    presented,
    outstanding
  }
}

function isDecisionOutstanding(decision, state) {
  return decision.choice.isOutstanding(state) && !decision.actions.length;
}


function interpolate(object, state) {
  if (Array.isArray(object)) {
    return object.map((item) => interpolate(item, state))
  } else if (object != null && typeof object == 'object') {
    const copy = {};
    for (var property in object) {
      if (typeof object[property] === 'function' && !defaults[property]) {
        copy[property] = interpolate(object[property](state), state)
      } else {
        copy[property] = interpolate(object[property], state);
      }
    }
    return copy;
  } else {
    return object;
  }
}