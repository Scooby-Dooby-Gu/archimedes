import update from '/lib/immutability'
import {Placeholder, fetchFromAPIWithResponse } from '/lib/request';

import isEqual from 'fast-deep-equal';
import { generateGlossary } from '../lib/data';

export const initialState = {
  user: Placeholder([]),
  glossary: {},
  courses: Placeholder([]),
  ambitions: Placeholder([]),
  submissions: Placeholder([]),
  achievements: [],
  gameCompetition: {},
  gameSession: {
    actions: [],
    log: [],
    timestamps: []
  },
}


export const reducer = (state, action) => {
  switch (action.type) {
    // list of started courses, lessons and user submissions
    case 'setSubmissions':
      return update(state, {
        submissions: { $setIfNotEqual: action.submissions }
      });
      
    case 'setAmbitions':
      return update(state, {
        ambitions: { $setIfNotEqual: action.ambitions }
      })
      
    // current list of courses and lessons
    case 'setCourses':
      const changed = !isEqual(state.courses, action.courses)
      const newGlossary = changed ? generateGlossary(action.courses) : state.glossary;
      return update(state, {
        courses: (data) => changed ? action.courses : data,
        glossary: { $setIfNotEqual: newGlossary }
      });

    // list of possible achievements
    case 'setAchievements':
      return update(state, {
        achievements: { $setIfNotEqual: action.achievements }
      });
      
    // paper chase session
    case 'setGameSession':
      return update(state, {
        gameCompetition: (data) => action.competition && !isEqual(data, action.competition) ? action.competition : data,
        gameSession: (data) => !isEqual(data, action.session) ? action.session : data,
      })

    // paper chase session
    case 'resetGameSession':
      return update(state, {
        gameCompetition: () => initialState.gameCompetition,
        gameSession: () => initialState.gameSession,
      })
      
    // HACK: set data without re-render
    // used to avoid double render during redirect
    case 'setGameSessionWithoutUpdate':
      if (action.competition && !isEqual(state.gameCompetition, action.competition))
        state.gameCompetition = action.competition;
      if (action.session && !isEqual(state.gameSession, action.session))
        state.gameSession = action.session;
      return state;
      
    // user profile
    case 'setUser':
      return update(state, {
        user: { $setIfNotEqual: action.user }
      });

    default:
      return state;
  }
};

export const middleware = async (state, action, dispatch) => {
  switch (action.type) {
    case 'sendSubmission': {
      var user = JSON.parse(localStorage.user);
      return fetchFromAPIWithResponse(`/users/${user.id}/submissions`, {
        method: 'post',
        data: {
          submission: action.submission
        }
      }).then((data) => {
        dispatch('fetchUser')
        dispatch('fetchSubmissions')
        return action;
      })

    }

    case 'fetchEverything':
      dispatch('fetchSubmissions')
      dispatch('fetchCourses')
      dispatch('fetchAmbitions')
      dispatch('fetchUser')
      dispatch('fetchAchievements')
      dispatch('fetchGameSession', {initial: true})
      break;
  }
  return action;
}