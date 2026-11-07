
import '/style/index.scss';

import 'preact/compat';
import { options } from 'preact';
import hydrate from 'preact-iso/hydrate';
import App from './components/app';

import '/lib/drag';
import '/lib/scroll';
import { clearLocalStorage } from '/lib/data';
import '/lib/hacks';
import { route } from '/lib/router';
import { isOwnHost, isAppHost } from '/lib/hosts';


//import swURL from 'sw:./sw.jsx';
//navigator.serviceWorker.register(swURL);

window.route = (url) => { 
  route(url)
  console.error('route', url);
  //history.pushState(null, '', url);
}

if (!window.attachedListeners) {

  document.body.parentNode.classList.add(import.meta.env.NODE_ENV);
  track('create', import.meta.env.GOOGLE_TRACKING_CODE, 'auto');

  const config = { attributes: true, childList: true, subtree: true };

  // Callback function to execute when mutations are observed
  const callback = function(mutationList, observer) {
    const mutation = mutationList[0]
    const type = mutation.addedNodes[0] ? 'added' : mutation.removedNodes[0] ? 'removed' : mutation.attributeName; 
    const target = (mutation.addedNodes[0] || mutation.removedNodes[0])
    const context = mutation.target;
    if ((target || context) instanceof SVGElement) {
      return;
    }
    if (mutationList.every((m) => m.attributeName === 'style'))
      return;
    if (mutationList.every((m) => m.attributeName === 'style' && (m.target.classList.contains('column') || m.target.classList.contains('slide') || m.target instanceof SVGElement || m.target.classList.contains('apexcharts'))))
      return;
    if (mutationList.every((m) => m.attributeName === 'class' && m.target.tagName === 'HEADER'))
      return;
    const selector = (el) => {
      if (!el) return '';
      if (el.nodeType == 3) return 'text';
      if (!el.tagName) return '';
      var s = el.tagName.toLowerCase();
      if (el.id) s += '#' + el.id;
      s += Array.prototype.slice.call(el.classList, 0, 2).map((c) => '.' + c).join('.');
      return s;
    }
    var selectorString = selector(context).substring(0, 35);
    console.log(...console.row('rgb(244, 81, 30)', 'mutate', type, selectorString, selector(target), mutationList))
  };

  // Create an observer instance linked to the callback function
  const observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(document.body, config);

  var timeout;
  document.addEventListener('blur', (e) => timeout = setTimeout(() => window.scrollBy(0,0), 100), true);
  document.addEventListener('focus', (e) => clearTimeout (timeout), true);

  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      document.body.parentNode.style.height = window.innerHeight + 'px'
      setTimeout(() => {
        document.body.parentNode.style.height = ''
      }, 100)
    }, 500)
  })
  
  document.addEventListener('mousedown', (e) => {
    const link = e.target.closest('a');
    if (link && !link.getAttribute('href')) {
      e.preventDefault()
      e.stopPropagation()
    } else if (link && isAppHost(link.hostname) && /^https?:/.test(link.getAttribute('href')) && link.pathname.indexOf('lesson') > -1) {
      route(link.pathname + '?from=' + encodeURIComponent(location.pathname))
      e.preventDefault()
      e.stopPropagation()
    } else if (link && link.hostname && !isOwnHost(link.hostname) && !link.getAttribute('bypass')) {
      link.classList.add('loading');
      track('send', 'event', 'Outgoing', link.hostname.toLowerCase().replace('www.', ''), link.pathname).then(() => {
        const a = document.createElement('a');
        a.href = link.href;
        a.setAttribute('bypass', true);
        //a.setAttribute('target', '_blank');
        document.body.appendChild(a);
        a.click();
      })
      setTimeout(() => {
        link.classList.remove('loading');
      }, 1200)
      e.preventDefault()
      e.stopPropagation()
    }
  }, true);

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && !link.getAttribute('href')) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const box = (() => {
      if (e.target.closest('figcaption') && e.target.closest('figure.details-box'))
        return e.target.closest('.details-box');
  
      if (e.target.closest('[route*="lesson"] .question') && (e.target.closest('.question').getAttribute('open') == null || e.detail === true))
        return e.target.closest('.question');
    })();
  
    if (box) {
      const content = box.querySelector('.details-box-content, [class*="questionForm"]');
      if (box.getAttribute('open') == null || e.detail === true) {
        const notch = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
        requestAnimationFrame(() => box.scrollIntoViewCustom({
          behavior: 'smooth', 
          offsetTop: - (box.classList.contains('question') ? 65 : 70) - notch,
          block: 'start'}))

        if (box.getAttribute('open') == null) {
          box.setAttribute('open', 'open')
          if (content) {
            content.style.maxHeight = '0';
            requestAnimationFrame(() => {
              content.style.maxHeight = content.scrollHeight + 'px';
              setTimeout(() => {
                content.style.overflow = 'visible';
                content.style.maxHeight = '';
              }, 500)
            })
          }
        }
      } else {
        box.removeAttribute('open')
        if (content) {
          content.style.overflow = 'hidden';
          content.style.maxHeight = '0px';
        }
      }
    }
  
  })

  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) dispatch('reloadIfOutdated')
    if (!document.hidden && localStorage.wrapper && localStorage.user) {
      dispatch('fetchSubmissions')
      dispatch('fetchCourses')
      dispatch('fetchAmbitions')
    }
  });
  setTimeout(() => {
    dispatch('reloadIfOutdated')
  }, 10)
}
window.attachedListeners = true;

// clear up cache on redeployments
if (typeof localStorage != 'undefined' && import.meta.env.SOURCE_VERSION && import.meta.env.SOURCE_VERSION !== localStorage.SOURCE_VERSION) {
  clearLocalStorage();
  localStorage.SOURCE_VERSION = import.meta.env.SOURCE_VERSION;
} 
if (location.search.includes('?version')) {
  alert(import.meta.env.SOURCE_VERSION)
}

//if (import.meta.env.NODE_ENV !== 'qa') {
  var tick;
  const raf = requestAnimationFrame;
  options.debounceRendering =  (callback) => {
    cancelAnimationFrame(tick)
    tick = requestAnimationFrame(() => {
      console.log(...console.row('rgb(251, 140, 0)', 'render'));
      callback()
    })
  }
//}

export default App;

hydrate(<App />);