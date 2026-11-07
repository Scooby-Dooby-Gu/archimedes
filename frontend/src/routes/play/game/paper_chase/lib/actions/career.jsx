
import update from '/lib/immutability';

// patch or prevent actions 
export const middleware = {
}

export const appenders = {
  work: (left, right) => {
    if (left.type === 'work') {
      return [ null, right]
    }
    return [left, right]
  },
}

export const actions = {
}
