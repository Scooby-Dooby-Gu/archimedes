import update from '/lib/immutability'
import { clearLocalStorage } from '/lib/data';
import { fetchFromAPI, fetchFromAPIWithResponse } from '/lib/request';


export const initialState = {
  user: null,
  company: null,
  canManage: false,
}


export function getBrowserIdentifier() {
  if (localStorage.wrapper)
    return localStorage.wrapper;

  if ( /Android|webOS|iPhone|iPad|Mac|Macintosh|iPod|BlackBerry|IEMobile|Opera Mini|Mobi/)
    return 'mobile';

  return 'desktop';
}


export const reducer = (state, action) => {
  switch (action.type) {
    case 'setPermissions':
      const user = state.user;
      const company = state.company;
      return update(state, {
        canManage: {
          $set: user.role === 'admin' || 
                user.role === 'moderator' || 
                //user.role === 'writer' || 
                (company && company.managerIds.includes(user.id))
        }
      });

    case 'setCompany':
      localStorage.setItem('company', JSON.stringify(action.company));
      return update(state, {
        company: {
          $set: action.company
        },
      });

    case 'login':
      if (!action.user) {
        throw new Error('Login action received empty user')
      }
      localStorage.removeItem('company');
      if (localStorage.user != JSON.stringify(action.user)) {
        localStorage.setItem('user', JSON.stringify(action.user));

        const oldUser = localStorage.user && JSON.parse(localStorage.user);
        if (oldUser) {
          if (!oldUser.verifiedAt && action.user.verifiedAt) {
            track('send', 'event', 'Verification', getBrowserIdentifier())
          }
        }
        if (!oldUser || oldUser.id != action.user.id) {
          track('send', 'event', 'Login', getBrowserIdentifier())
        }
      }
      parent.postMessage(action.user.apiKey, '*')

      // Admittedly this delay is a hack
      if (action.redirect)
        setTimeout(() => route(action.redirect), 100)

      return update(state, {
        user: {
          $set: action.user
        }
      });

    case 'logout':
      localStorage.removeItem('user');
      localStorage.removeItem('company');
      if (localStorage.user != JSON.stringify(action.user)) {
        track('send', 'event', 'Logout', getBrowserIdentifier())
      }
      clearLocalStorage()
      if (action.redirect)
        route(action.redirect)
      return update(state, {
        user: { $set: null }
      });
      
    default:
      return state;
  }
};

export const middleware = async (state, action) => {
  return action;
}

export const observers = {
  app: {
    initialized: (value, old, state) => {
      try {
        var userData = JSON.parse(localStorage.user);
      } catch(e) {
        window.x = e;
      }

      if (userData) {
        dispatch({type: 'login', user: userData})
      }
      
      // check if we've been given api_key in query string to re-auth the user
      var apiKey = (location.search && location.search.match(/api_key=([^&]+)/) || [])[1];
      if (apiKey && userData && userData.user && userData.user.apiKey !== apiKey) {
        userData = null
        
        clearLocalStorage();
      }

      if (apiKey && (!userData || userData.apiKey != apiKey)) {
        localStorage.removeItem('user');
        localStorage.removeItem('company');
        fetchFromAPIWithResponse(`/users/me?api_key=${apiKey}`).then(({data}) => {
          localStorage.introduced = true;
          dispatch({type: 'login', user: data.user, redirect: (location.pathname + location.search).replace(/api_key=[^&]+/, '').replace(/\?$/g, '')});
        })
      }

      if (localStorage.company) {
        try {
          var companyData = JSON.parse(localStorage.company);
        } catch(e) { }
        if (companyData && userData/* && userData.role !== 'admin' */) {
          dispatch('setCompany', companyData)
        }
      }
    }
  },
  data: { 
    // Pick workspace for everybody but admins
    // also used as a way to update current scope info
    user: async (user, old, state) => {
      const workspaces = user.isPlaceholder ? [] : [].concat(user.company || []).concat(user.workspaces || []);
      const currentWorkspace = state.auth.company && workspaces.find((c) => c.id == state.auth.company.id);
      // update current workspace
      if (currentWorkspace) {
        await dispatch('setCompany', currentWorkspace)
      // force users into some workspace
      } else if (user.role != 'admin') {
        await dispatch('setCompany', workspaces[0] || null)
      }
    }
  },
  auth: { 
    company: async (company, old) => {
      await dispatch('setPermissions')
    },
    user: async (user, old) => {
      if (user)
        track('set', 'userId', user.email || user.id);
      await dispatch('setPermissions')
    }
  },
}