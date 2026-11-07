import update from '/lib/immutability'

export const getBreakpointSettings = () => {
  const width = typeof window === 'undefined' ? 600 : window.innerWidth;
  if (width < 600) {
    return ({breakpoint: 'phone', maxWidth: 600});
  } else if (width < 784) {
    return ({breakpoint: 'tablet-portrait', maxWidth: 784});
  } else if (width < 1144) {
    return ({breakpoint: 'tablet-landscape', maxWidth: 1144});
  } else if (width < 1440) {
    return ({breakpoint: 'desktop', maxWidth: 1440});
  } else {
    return ({breakpoint: 'big-desktop', maxWidth: Infinity});
  }
}

export const setMotionSettings = () => {
  return {
    animations: !(import.meta.env.NODE_ENV === 'qa' || window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }
}


export const initialState = {
  forcedRenderCount: 0,
  initialized: false,
  layout: localStorage.user ? 'default' : 'minimal',
  openDiscussions: true,//location.search.indexOf('open') > -1,
  open: location.search.indexOf('open') > -1 || import.meta.env.NODE_ENV != 'qa',
  onboarded: localStorage.onboarded == 'true' ? true : false,

  unlocks: {
    courses: false,
    game: false,
    videos: false,
  },

  ...(getBreakpointSettings()),
  ...(setMotionSettings())
}

  
export const reducer = (state, action) => {
  switch (action.type) {
    case 'initialize':
      return update(state, {
        initialized: { $set: true }
      });


    case 'setBreakpointAutomatically':
      return update(state, {
        $merge: getBreakpointSettings()
      });

    case 'setMotionSettingsAutomatically':
      return update(state, {
        $merge: getBreakpointSettings()
      });

      case 'setLayout':
        return update(state, {
          layout: {
            $set: action.layout
          }
        })

    case 'setUnlocks':
      return update(state, {
        unlocks: {
          $set: action.unlocks
        }
      })

    case 'setOnboarded':
      localStorage.onboarded = action.onboarded;
      return update(state, {
        onboarded: {
          $set: action.onboarded
        }
      })
  

    case 'setPage':
      return update(state, {
        $merge: {
          actionTitle: null,
          actionLink: null,
          actionType: null,
          actionCache: null,
          actionHandler: null,
          manageTitle: null,
          manageLink: null,
          manageType: null,
          manageCache: null,
          manageHandler: null,
          title: null,
          parentTitle: null,
          parentLink: null,
          parentType: null,
          parentCache: null,
          parentHandler: null,
          ...action,
        }
      })

      case 'setBreakpoint':
        return update(state, {
          $merge: action
        })

      case 'forceRender':
        return update(state, {
          forcedRenderCount: (c) => c + 1
        })
      
    default:
      return state;
  }
};

export const middleware = async (state, action) => {
  switch (action.type) {
    case 'reloadIfOutdated':
      const re = /<script type="module" [^>]*src="[^"]*\/assets\/(index\..*?\.js)"><\/script>/
      const bundle = String(document.body.parentNode.innerHTML.match(re) && document.body.parentNode.innerHTML.match(re)[1]);
      try {
        const response = await fetch('/', {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        const innerHTML = await response.text();
        const bundleNew = String(innerHTML.match(re) && innerHTML.match(re)[1]);
        if (bundleNew && bundle && bundle !== bundleNew) {
          console.log(...console.row('#BDBDBD', 'bundle', 'outdated', '', bundleNew))
          if (!location.pathname.match(/\/(new|edit)/i)) {
            fetch(location.href, {
              headers: {
                'Cache-Control': 'no-cache'
              }
            }).then(() => {
              location.href = location.href;
            })
          }
        } else {
          console.log(...console.row('#BDBDBD', 'bundle', 'up to date', '', bundle))
        }
      } catch(e) {
        console.log(...console.row('#BDBDBD', 'bundle', 'offline'))
      }
      break;
  }
  return action;
}

export const observers = {
  app: {
    initialized: (value, old, state) => {
      observers.app.onboarded(state.app.onboarded);
    },
    onboarded: (value) => {
      document.querySelector('#app').classList.toggle('onboarding', !value)
    }
  },

  data: {
    user: (value, old, state) => {
      dispatch('setUnlocks', {
        videos: value.achievements.some((a) => a.definition.slug == 'unlock_videos'),
        game: value.achievements.some((a) => a.definition.slug == 'unlock_game'),
        courses: value.achievements.some((a) => a.definition.slug == 'unlock_courses'),
      });
    },
    submissions: (value, old, state) => {
      if (value.find(({type}) => type == 'lesson' || type == 'video' || type == 'link' || value == 'goal')) {
        dispatch('setOnboarded', true);
      }
    }
  },

  location: {
    route: (value, old, state) => {
      if (value == 'lesson' || value == 'goal_lesson' || value == 'video') {
        dispatch('setOnboarded', true);
      }
    }
  }
}

window.addEventListener('beforeunload', (e) => { e.preventDefault() })