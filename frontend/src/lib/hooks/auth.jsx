import { useFetchedData } from './request';
import { useEffect, useCallback, useState, useRef } from './preact';
import { loadScript } from "./request"
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
    onFailure: (e) => {
      setAppleSigninRequest({loading: false, success: false, error: (e && e.message) || 'Could not sign in with Apple'});
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

// Google sign-in via Google Identity Services (accounts.google.com/gsi/client),
// which replaced the shut-down gapi.auth2 library. We use the authorization
// code popup flow: Google hands the browser a one-time code, and the backend
// exchanges it with Google for a verified ID token. The browser never gets to
// decide which account it is.
const googleErrorMessage = (e) =>
  !e ? 'Could not sign in with Google' :
  e.type === 'popup_closed' || e.error === 'access_denied' ? 'Google sign-in was canceled' :
  e.type === 'popup_failed_to_open' ? 'Google sign-in popup was blocked by the browser' :
  `Could not sign in with Google: ${e.error_description || e.error || e.message || e.type || e}`;

export function useGoogleAuth({onSuccess, data}) {
  const [googleSigninRequest, setGoogleSigninRequest] = useState(initialGoogleSignin);
  const codeClient = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const onGoogleError = useCallback((e) => {
    setGoogleSigninRequest((r) => ({...r, loading: false, success: false, error: googleErrorMessage(e)}))
  }, [])

  const [externalSigninData, externalSigninRequest, externalSignin] = useFetchedData(`/signin/external`, {
    method: 'post',
    observeRequest: true,
    onSuccess: (response) => {
      setGoogleSigninRequest((r) => ({...r, loading: false, loaded: true, success: true, error: null}));
      onSuccess(response.user);
    },
    onFailure: onGoogleError,
    immediate: false
  })

  // Load the library right away so the popup can open synchronously on click
  // (browsers block popups that open after an await).
  useEffect(() => {
    const clientId = import.meta.env.GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'undefined' || clientId === 'local-placeholder') {
      return; // not configured: the button stays disabled
    }
    let cancelled = false;
    loadScript('https://accounts.google.com/gsi/client').then(() => {
      if (cancelled) return;
      if (!window.google || !google.accounts || !google.accounts.oauth2) {
        return onGoogleError(new Error('Could not load Google sign-in'));
      }
      codeClient.current = google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: (response) => {
          if (response.error || !response.code) {
            return onGoogleError(response);
          }
          externalSignin({
            user: { external: { source: 'google', code: response.code } },
            ...dataRef.current
          });
        },
        error_callback: onGoogleError,
      });
      setGoogleSigninRequest((r) => ({...r, ready: true}));
    });
    return () => { cancelled = true; };
  }, [])

  const onGoogleAuthRequest = useCallback((e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!codeClient.current) return;
    setGoogleSigninRequest((r) => ({...r, loading: true, success: false, error: null}));
    codeClient.current.requestCode();
  }, [])

  return [onGoogleAuthRequest, googleSigninRequest]
}
