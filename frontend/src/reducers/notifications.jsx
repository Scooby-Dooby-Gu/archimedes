
import update from '/lib/immutability'


export const initialState = {
  token: localStorage.notificationToken,
  status: localStorage.notificationStatus || "undetermined",
  error: null
}

export const reducer = (state, action) => {
  switch (action.type) {
    case 'setNotificationStatus':
      return update(state, {
        status: () => action.notificationStatus,
        token: (old) => action.notificationStatus === 'authorized' ? old : null 
      })

    case 'setNotificationToken':
      return update(state, {
        token: () => action.notificationToken
      })

    case 'setNotificationError':
      return update(state, {
        error: () => action.notificationError
      });

    default:
      return state;
  }
}
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getPermissionType(permission) {
  if (permission === 'granted') {
    return 'authorized';
  } else if (permission === 'denied') {
    return 'denied';
  }
  return 'undetermined';
}
  

var lastTry = null;
export const middleware = async (state, action) => {
  switch (action.type) {

    // Prompt user to accept permission
    case 'requestNotificationPermission':
      // cool down attempts by 10 seconds to avoid double subscriptions
      if (lastTry && new Date() - lastTry < 10 * 1000) {
        return false;
      }
      lastTry = new Date;

      if (typeof webkit != 'undefined' && webkit.messageHandlers && webkit.messageHandlers.registerForNotifications) {
        webkit.messageHandlers.registerForNotifications.postMessage("");
      } else if (typeof Notification != 'undefined' && Notification.permission) {
        const status = getPermissionType(await Notification.requestPermission());
        if (!state.notifications.token && status === 'authorized') {
          dispatch('requestNotificationToken');
        }
        if (status !== state.notifications.status) {
          dispatch('setNotificationStatus', getPermissionType(Notification.permission))
        }
      }
      break;

    // Prompt user to accept permissions, or if we know they are denied, tell them how to do it
    case 'requestNotificationPermissionIfPossible':
      if (state.notifications.status == "denied") {
        route('/enable_notifications?origin=' + encodeURIComponent(location.pathname) )
      } else {
        dispatch('requestNotificationPermission')
      }
      break;
    
    case 'requestNotificationToken':
      var sw = await navigator.serviceWorker.getRegistration()
      if (sw) {
        await navigator.serviceWorker.ready; 
        var token = await sw.pushManager.getSubscription()
        if (!token) {
          var subscription = await sw.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(import.meta.env.VAPID_PUBLIC_KEY)
          })
          if (subscription) {
            token = JSON.stringify(subscription.toJSON());
          }
          dispatch('setNotificationToken', token || null);
        }
      }
      break;      
      
    // Recieve current notification status
    case 'requestNotificationStatus':
      if (typeof webkit != 'undefined' && webkit.messageHandlers && webkit.messageHandlers.requestNotificationStatus) {
        webkit.messageHandlers.requestNotificationStatus.postMessage("");
      } else if (typeof Notification != 'undefined' && Notification.requestPermission) {
        dispatch('setNotificationStatus', getPermissionType(Notification.permission))
      }
      break;

    case 'setNotificationToken':
      // return back from "Enable notifications"
      if (location.pathname == '/enable_notifications') {
        const from = (location.search && location.search.match(/from=([^&]+)/) || [])[1];
        if (from) {
          route(decodeURIComponent(from))
        } 
      }

      if (state.auth.user && action.notificationToken) {
        // save the token
        fetchFromAPI(`/users/${state.auth.user.id}/devices`, {
          method: 'post',
          data: {
            device: {
              token: action.notificationToken,
              platform: localStorage.wrapper === 'ios' ? 'ios' 
                        : localStorage.wrapper ? 'android' : 'web'
            }
          }
        })
      }
      break;

    // This in case IOS wrapper provided values before app was loaded
    case 'ingressNotificationValues':
      if (window.notificationToken) {
        dispatch('setNotificationToken', window.notificationToken)
      }
      if (window.notificationStatusError) {
        dispatch('setNotificationError', window.notificationStatusError)
      }
      if (window.notificationStatus) {
        dispatch('setNotificationStatus', window.notificationStatus)
      }
      break;
  }

  return action;
}

export const observers = {
  auth: { 
    user: async (user, old) => {
      if (old) {
        delete localStorage.notificationToken
        delete localStorage.notificationStatus
        await dispatch('setNotificationToken', null);
        await dispatch('setNotificationStatus', 'undetermined');
      }
    }
  },
  notifications: {
    token: async (value) => {
      if (value) {
        localStorage.notificationToken = value;
      } else {
        delete localStorage.notificationToken
      }
    },
    
    status: async (value, old, state) => {
      localStorage.notificationStatus = value;
      if (value === 'authorized' && !state.notifications.token) {
        await dispatch('requestNotificationPermission')
      }
    }
  }
}


export function isNotificationSupported() {
  if (localStorage.wrapper === 'ios') {
    return true;
  }
  if (import.meta.env.NODE_ENV === 'qa') {
    return true;
  }
  return navigator.serviceWorker && navigator.serviceWorker.controller;
}