import update from '/lib/immutability'
import { fetchFromAPIWithCallbacks, REQUEST_INITIAL } from '/lib/request';

export const initialState = {
  user: REQUEST_INITIAL,
  courses: REQUEST_INITIAL,
  ambitions: REQUEST_INITIAL,
  submissions: REQUEST_INITIAL,
  achievements : REQUEST_INITIAL,
  gameSession: REQUEST_INITIAL,
}


export const reducer = (state, action) => {
  switch (action.type) {
    // list of started courses, lessons and user submissions
    case 'setSubmissionsRequest':
      return update(state, {
        submissions: { $setIfNotEqual: action.request }
      });
      
    case 'setAmbitionsRequest':
      return update(state, {
        ambitions: { $setIfNotEqual: action.request }
      })

    case 'setCoursesRequest':
      return update(state, {
        course: { $setIfNotEqual: action.request }
      });

    case 'setAchievementsRequest':
      return update(state, {
        achievements: { $setIfNotEqual: action.request }
      });

    case 'setGameSessionRequest':
      return update(state, {
        gameSession: { $setIfNotEqual: action.request }
      });

    case 'setUserRequest':
      return update(state, {
        user: { $setIfNotEqual: action.request }
      });

    default:
      return state;
  }
};

export const middleware = async (state, action, dispatch) => {
  switch (action.type) {
    case 'fetchSubmissions': {
      var user = JSON.parse(localStorage.user);
      fetchFromAPIWithCallbacks(`/users/${user.id}/submissions`, undefined, 
        (request) => dispatch({type: 'setSubmissionsRequest', request}),
        ({data}) =>  dispatch({type: 'setSubmissions', ...data}))
      break;
    }

    case 'fetchAchievements': {
      fetchFromAPIWithCallbacks(`/achievements`, undefined, 
        (request) => dispatch({type: 'setAchievementsRequest', request}),
        ({data}) =>  dispatch({type: 'setAchievements', ...data}))
      break;
    }
    
    case 'fetchAmbitions': {
      fetchFromAPIWithCallbacks(`/ambitions`, undefined, 
        (request) => dispatch({type: 'setAmbitionsRequest', request}),
        ({data}) =>  dispatch({type: 'setAmbitions', ...data}))
      break;
    }

    case 'fetchCourses': {
      fetchFromAPIWithCallbacks(`/courses`, undefined, 
        (request) => dispatch({type: 'setCoursesRequest', request}),
        ({data}) =>  dispatch({type: 'setCourses', ...data}))
      break;
    }

    case 'fetchGameSession': {
      var user = JSON.parse(localStorage.user);
      var gameId = action.data || 'paper-chase';
      var companyParam = state.auth.company ? '&companyId=' + state.auth.company.id : '';
      fetchFromAPIWithCallbacks(`/games/${gameId}/sessions/${user.id}?v=3${companyParam}`, undefined, 
        (request) => dispatch({type: 'setGameSessionRequest', request}),
        ({data}) => dispatch({type: 'setGameSession', ...data}), 
        action.initial == true)
      break;
    }

    case 'fetchUser': {
      var user = JSON.parse(localStorage.user);
      fetchFromAPIWithCallbacks(`/users/${user.id}`, undefined, 
        (request) => dispatch({type: 'setUserRequest', request}),
        ({data}) =>  dispatch({type: 'setUser', ...data}))
      break;
    }
  }
  return action;
}