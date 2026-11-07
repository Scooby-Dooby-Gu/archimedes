import { Page } from '/components/index.jsx';
import { useRef, useStore } from "/lib/hooks";

export default function Start() {
  const { auth: { user } } = useStore();
  const ref = useRef();
  
  // avoid double redirection
  if (ref.redirected) return;
  ref.redirected = true;

  // Everyone uses the web app now. (It used to send people who weren't
  // staff to /get_app to download the iOS/Android apps, which no longer exist.)
  if (user && location.pathname === "/invite") {
    route(`/users/${user.id}/friends/new`)
  } else {
    route('/ambitions')
  }
}