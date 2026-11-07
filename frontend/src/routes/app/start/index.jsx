import { Page } from '/components/index.jsx';
import { useRef, useStore } from "/lib/hooks";

export default function Start() {
  const { auth: { user } } = useStore();
  const ref = useRef();
  
  // avoid double redirection
  if (ref.redirected) return;
  ref.redirected = true;

  if (user && location.pathname === "/invite") {
    route(`/users/${user.id}/friends/new`)
  } else if ((!user || (user.role != 'admin' && user.role != 'manager' && user.role != 'writer')) && !localStorage.wrapper && (import.meta.env.NODE_ENV === 'staging' || import.meta.env.NODE_ENV === 'production')) {
    route('/get_app')
  } else {
    route('/ambitions')
  }
}