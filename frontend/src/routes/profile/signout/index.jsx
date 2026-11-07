 import { useEffect } from '/lib/hooks/index.jsx';


export default function() {
  useEffect(() => {
    try {
      webkit.messageHandlers.logoutUserWithGoogle.postMessage("");
    } catch(e) {

    }

    var wrapper = localStorage.wrapper;
    localStorage.clear();
    if (wrapper)
      localStorage.wrapper = wrapper;
    
    
    location.href = '/';
  }, [])
}