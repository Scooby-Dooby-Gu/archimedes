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

// Sign in with Apple JS. The raw ID token goes to the backend, which verifies
// Apple's signature, issuer and audience before trusting the email in it.
const appleErrorMessage = (e) =>
  !e ? 'Could not sign in with Apple' :
  e.error === 'popup_closed_by_user' ? 'Apple sign-in was canceled' :
  e.error === 'popup_blocked_by_browser' ? 'Apple sign-in popup was blocked by the browser' :
  `Could not sign in with Apple: ${e.error || e.message || e}`;

export function useAppleSignin({onSuccess, data}) {
  const [appleSigninRequest, setAppleSigninRequest] = useState(initialGoogleSignin);
  const dataRef = useRef(data);
  dataRef.current = data;

  const onAppleError = useCallback((e) => {
    setAppleSigninRequest((r) => ({...r, loading: false, success: false, error: appleErrorMessage(e)}));
  }, [])

  const [externalSigninData, externalSigninRequest, externalSignin] = useFetchedData(`/signin/external`, {
    method: 'post',
    observeRequest: true,
    onSuccess: (response) => {
      setAppleSigninRequest((r) => ({...r, loading: false, loaded: true, success: true, error: null}));
      onSuccess(response.user);
    },
    onFailure: onAppleError,
    immediate: false
  })

  // Load and configure the library up front so the popup can open straight
  // from the click (browsers block popups opened after an await).
  useEffect(() => {
    const clientId = import.meta.env.APPLE_CLIENT_ID;
    if (!clientId || clientId === 'undefined') {
      return; // not configured: the button stays disabled
    }
    let cancelled = false;
    loadScript("https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js").then(() => {
      if (cancelled) return;
      if (!window.AppleID || !AppleID.auth) {
        return onAppleError(new Error('Could not load Sign in with Apple'));
      }
      if (!window.appleConfigured) {
        window.appleConfigured = 1;
        AppleID.auth.init({
          clientId,
          scope: 'name email',
          redirectURI: location.origin + '/signin/apple',
          usePopup: true
        });
      }
      setAppleSigninRequest((r) => ({...r, ready: true}));
    });
    return () => { cancelled = true; };
  }, [])

  const onAppleSignin = useCallback(async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!window.appleConfigured) return;
    setAppleSigninRequest((r) => ({...r, loading: true, success: false, error: null}));
    try {
      const response = await AppleID.auth.signIn()
      const user = {
        external: {
          source: 'apple',
          idToken: response.authorization.id_token
        }
      }
      // Apple only shares the name on the very first sign-in.
      const name = response.user && response.user.name;
      if (name && (name.firstName || name.lastName)) {
        user.name = [name.firstName, name.lastName].filter(Boolean).join(' ');
      }
      externalSignin({ user, ...dataRef.current });
    } catch(e) {
      onAppleError(e);
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
