import { useFetchedData } from './request';
import { useEffect, useCallback, useState  } from './preact';
import { loadScript } from "./request"
window.LoadOauthResponse = (json) => {
  console.log('Not ready??', json)
  return 123;
}
export function useSignin(data) {
  const setUser = useCallback((user) => {
    
    if (location.pathname.match(/signin|signup|invites|^\/$/))
      var url = '/?welcome';
    else
      var url = location.pathname + '?welcome';
    dispatch({type: 'login', user: user, redirect: url})
  }, [])
  const [onGoogleSignin, googleSigninRequest] = useGoogleAuth({
    onSuccess: setUser,
    data: data
  })
  const [onAppleSignin, appleSigninRequest] = useAppleSignin({
    onSuccess: setUser,
    data: data
  })
  return [setUser, onGoogleSignin, googleSigninRequest, onAppleSignin, appleSigninRequest];
}

export function useAppleSignin({onSuccess, onFailure, data}) {
  const [appleSigninRequest, setAppleSigninRequest] = useState(initialGoogleSignin);

  const [externalSigninData, externalSigninRequest, externalSignin] = useFetchedData(`/signin/external`, {
    method: 'post',
    observeRequest: true,
    onSuccess: (data) => {
      setAppleSigninRequest({loaded: true, success: true, error: null});
      onSuccess(data.user);
    },
    immediate: false
  })


  function parseJwt (token) {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
  };
  const onAppleSignin = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setAppleSigninRequest({loading: true, success: false, error: null});

    await loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js");

    await new Promise((a) => setTimeout(a, 100))

    if (!window.appleConfigured) {
      window.appleConfigured = 1;
      AppleID.auth.init({
          clientId : /*import.meta.env.APPLE_CLIENT_ID || */'com.production.archimedes',
          scope : 'name email',
          redirectURI : location.origin + '/signin/apple',
          //state : '[STATE]',
          //nonce : '[NONCE]',
          usePopup : true //or false defaults to false
      });
    }
    try {
      const response = await AppleID.auth.signIn()
      const parsed = parseJwt(response.authorization.id_token)
      const user = {
        external: {
          source: 'apple',
          token: parsed.sub,
          ...parsed
        }
      }
      if (response.user) {
        user.name = response.user.name.firstName + ' ' + response.user.name.lastName
        user.email = response.user.email || parsed.email;
      } else if (parsed.email) {
        user.email = parsed.email
        user.name = 'Unknown Apple User'
      }/* else {
        while (!user.email || !user.email.match(/@/))  {
          user.email = prompt('You have email hidden. Please enter your email address');
          if (!user.name)
            user.name = 'Unknown Apple User'
        }
      } */
      externalSignin({ user, ...data });
    } catch(e) {
      setAppleSigninRequest({
        loading: false,
        success: false,
        error: e.error === 'popup_closed_by_user' ? 'Apple signin was canceled' : 
        e.error === 'popup_blocked_by_browser' ? 'Apple signin popup was blocked by the browser' : 
        `Could not sign in with apple: ${e.error || e.message || e}`
      });
    }
    
  }, [])

  return [onAppleSignin, appleSigninRequest];
}

const initialGoogleSignin = {loading: false, success: false, error: null, ready: false}
export function useGoogleAuth({onSuccess, data}) {
  const [googleAuthObject, setGoogleAuthObject] = useState()
  const [googleSigninRequest, setGoogleSigninRequest] = useState(initialGoogleSignin);


  const [externalSigninData, externalSigninRequest, externalSignin] = useFetchedData(`/signin/external`, {
    method: 'post',
    observeRequest: true,
    onSuccess: (data) => {
      setGoogleSigninRequest((r) => ({...r, loaded: true, success: true, error: null}));
      onSuccess(data.user);
    },
    immediate: false
  })
  
  // 1. load the library. We have to do it right away, 
  // so that popup may be open when user actually uses it
  useEffect(() => {
    window.onGoogleAuthLoad = () => {
      setGoogleAuthObject(window.gapiAuth2);
      setGoogleSigninRequest((r) => ({...r, ready: true}))
    }
    window.onGoogleAuthCancel = () => {
      setGoogleAuthObject(null)
      setGoogleSigninRequest((r) => ({...initialGoogleSignin, ready: r.ready}))
    }
    if (!document.querySelector('#google-platform-code')) {
      const script = document.createElement('script');
      script.id = 'google-platform-code';
      script.onload = () => {
        window.gapiAuth2 = true;
        // 2. Initialize auth2 constructor
        gapi.load('auth2', function(){
          gapi.client.init({
            client_id: import.meta.env.GOOGLE_CLIENT_ID,
            cookiepolicy: 'single_host_origin',
            scope: 'profile email',
            immediate: false
          }).then(function () {    
            window.onGoogleAuthLoad()
          }).catch(onGoogleError);
        });
      }
      script.onerror = () => {
        onGoogleError(new Error('Could not load Google auth library'));
      }
      script.src = 'https://apis.google.com/js/api:client.js';
      document.head.appendChild(script);
    } else {
      if (window.gapiAuth2) {
        window.onGoogleAuthLoad();
      }
    }
  }, [])

  const onGoogleError = useCallback((e) => {
    setGoogleAuthObject(null)
    setGoogleSigninRequest((r) => ({
      ...r,
      loading: false,
      success: false,
      error: 
        e.error === 'idpiframe_initialization_failed' ? 'Google requires third-party cookies to be enabled' :
        e.error === 'popup_closed_by_user' ? 'Google signin was canceled' : 
        e.error === 'popup_blocked_by_browser' ? 'Google signin popup was blocked by the browser' : 
        `Could not sign in with google: ${e.error || e.message || e}`
    }))
  }, [])
  
  const onGoogleAuthRequest = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setGoogleSigninRequest((r) => ({...r, loading: true, success: false, error: null}));

    try {
      // NOT IOS: 3. Open popup/auth the user
      if (localStorage.wrapper !== 'ios') {
        const googleUser = await gapi.auth2.getAuthInstance().signIn()
        var profile = googleUser.getBasicProfile();
        var id_token = googleUser.getAuthResponse().id_token;
        const user = {
          email: profile.getEmail(),
          avatar: profile.getImageUrl(),
          name: profile.getName(),
    
          external: {
            source: 'google',
            id: profile.getId(),
            token: googleUser.getAuthResponse().id_token,
            name: profile.getName(),
            avatar: profile.getImageUrl() && profile.getImageUrl().replace('s96-c', 's512-c'),
            email: profile.getEmail()
          }
        }
        return externalSignin({ user, ...data });
      } else {
        // IOS: 4. make ios retrieve the token, wait for it
        if (!window.LoadedOauthResponse)  {
          await new Promise((resolve) => {
            window.LoadOauthResponse = resolve;
            webkit.messageHandlers.authorizeUserWithGoogle.postMessage("");
          })
        }
        // IOS: 5. Retrieve user info by token
        if (window.LoadedOauthResponse) {
          gapi.client.setToken({
            access_token: window.LoadedOauthResponse
          })
          const result = await gapi.client.request({
            'path': 'https://www.googleapis.com/oauth2/v3/userinfo',
          })
          const json = JSON.parse(result.body)
          return externalSignin({
            user: {
              email: json.email,
              name: json.name,
              avatar: json.picture && json.picture.replace('s96-c', 's512-c'),
              //id: json.id,
              external: {
                email: json.email,
                name: json.name,
                avatar: json.picture,
                id: json.id,
                token: "none"
              }
            }, 
            ...data
          });
        } else {
          throw new Error('Could not fetch Google token. Please try again')
        }
      }
    } catch(e) {
      onGoogleError(e)
    }
  }, [])

  return [onGoogleAuthRequest, googleSigninRequest]
}
