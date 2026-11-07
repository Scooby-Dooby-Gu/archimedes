
import update from '/lib/immutability';

// patch or prevent actions 
export const middleware = {
  moveOut: (action) => {
    return update(action, {
      expenses: { $set: 24000 }
    })
  }
}

// combine multiple actions into one
export const appenders = {
  sellHouse: (left, right) => {
    if (left.id === right.id) {
      if (left.type === 'buyHouse') {
        return [ null, null ];
      } else {
        return [ null, right]
      }
    }
    return [left, right]
  },

  moveIn: (left, right, {previous}) => {
    if (left.type === 'moveIn') { 
      return [ null, right ]
    }
    if (left.type === 'moveOut') {
      if (left.id === right.id && previous.residence && previous.residence.id == right.id) {
        return []
      }
      return [ null, right ]
    }
    return [left, right]
  },

  moveOut: (left, right, {residence}) => {
    if (left.type === 'moveOut') {
      return [ null, right ]
    }
    if (left.type === 'moveIn') {
      if (left.id === right.id && (!residence || residence.id !== left.id)) {
        return []
      }
      return [ null, right ]
    }
    return [left, right]
  },

  renovate: (left, right) => {
    if (left.type === 'renovate' && left.id === right.id) {
      return [{
        ...left,
        amount: left.amount + right.amount
      }]
    }
    return [left, right];
  }
}

export const actions = {
  // generate moveOut event when selling current residence
  sellHouse: (action, { residence }) => {
    if (residence && residence.id === action.id) {
      return { type: 'moveOut', expenses: 24000 }
    }
  },

  buyHouse: (action, { residence }) => {
    if (!residence) {
      return { type: 'moveIn', id: action.id, context: action.name, decision: action.decision, option: action.option }
    }
  },
  
}
