import update from '/lib/immutability'


import qs from 'qs';
const { stringify: stringifyFormData, parse: parseQueryString }  = qs;

export const initialState = {
  path: '/',
  route: null,
  query: {},
  pathsRemembered: Object.keys(localStorage).reduce((paths, key) => {
    if (key.indexOf('remembered:') > -1) {
      paths[key.substring(11)] = localStorage[key];
    }
    return paths;
  }, {})
}

export const reducer = (state, action) => {
  switch (action.type) {
    case 'setUrl':
      const pathsRemembered = [
        '/games/paper-chase',
        //'/users/',// + user.id,
        '/courses',
        '/ambitions',
        //'/rankings',
        '/boards/3'
      ];


      var [pathname, query = ''] = action.url.split('?');
      if (pathname.includes('/ambitions')) {
        pathname = pathname.split(/\/(lessons|videos)/)[0]
      }
      return update(state, {
        $merge: {
          path: pathname,
          query: parseQueryString(query),
        },

        pathsRemembered: {
          $merge: pathsRemembered.reduce((changes, path) => {
            if (pathname.indexOf(path) == 0 && !pathname.match('\/(settings|edit|new)')) {
              
              if (pathname.match(/\/finish/)) {
                changes[path] = null;
                delete localStorage['remembered:' + path]
              } else {
                changes[path] = pathname;
                localStorage['remembered:' + path] = pathname;
              }
            }
            return changes;
          }, {})
        }
      })

    case 'setRoute':

      return update(state, {
        $merge: {
          route: action.route,
        }
      })
      
    default:
      return state;
  }
};

export const middleware = async (state, action) => {
  switch (action.type) {

    case 'setTitle':
      document.title = action.title + ' | Archimedes';
      break;

    case 'setUrl':
      const success = (action.url.match(/success=([^&]+)/) || [])[1];
      if (success != null) {
        console.log(...console.row('rgb(67, 160, 71)', 'fetch ', 'success', success))

        dispatch({ type: 'fetchAchievements' });
        dispatch({ type: 'fetchUser' });
        switch (success) {
          case 'tag':
            dispatch({ type: 'fetchTags' });
            break;
          case 'lesson':
            dispatch({ type: 'fetchCourses' });
            break;
          case 'ambition': case 'goal':
            dispatch({ type: 'fetchAmbitions' });
            break;
          case 'course':
            dispatch({ type: 'fetchCourses' });
            break;
        }
      }
    break;
  } 
  return action;
}