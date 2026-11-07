import { useStore, useRef, useEffect, usePrecache } from '/lib/hooks/index.jsx'
import style from './style.module.scss';
import { animated } from 'react-spring';
import Icon from '../icon';
import { useMemo, useState } from 'preact/hooks';

export default function Page({children, navigation = {}, ...props}) {
  const maxWidth = useStore('app.maxWidth');
  const animations = useStore('app.animations');
  const route = useStore('location.route');
  

  const {
    scrollSelector, scrollPosition, scrollOffset = 0, scrollDependency, scrollBehavior, scrollDelay = 10,
    headerClass, headerTheme = 'white', headerType, headerHidden, headerFaded,
    pageTheme = 'white',
    requests,
    errors,
    parentTitle = 'Back', parentLink, parentCache, parentHandler, parentAlwaysShow,
    titleNode, manageLink, title, manageCache, manageHandler,
    actionNode, actionLink, actionTitle, actionCache, actionHandler, actionRequest,
    checkAchievements
  } = navigation;

  const headerRef = useRef();
  const contentRef = useRef();

  // scroll element into view
  useEffect(() => {
    var delay = setTimeout(() => {
      if (contentRef.current && scrollSelector !== false) {
        const target = contentRef.current.querySelector(String(scrollSelector)) || contentRef.current.querySelector(`*`);
        if (window.innerWidth >= 784 || (scrollSelector && location.pathname.match(/lesson|goals/))) {
          requestAnimationFrame(() => {
            target.scrollIntoViewCustom({
              block: scrollPosition || 'center',
              behavior: scrollBehavior || (animations === false ? undefined : 'smooth'),
              offsetTop: scrollOffset || 0,
              inline: 'nearest'
            });
          })
        }
      }
    }, scrollDelay);
    return () => clearTimeout(delay);
  }, [scrollSelector, scrollDependency/*, location.pathname */])
  
  const [isLast, setIsLast] = useState(false);
  
  useEffect(() => {
    if (contentRef.current) {
      const parentNode = contentRef.current.closest('[route]');
      if (parentNode.getAttribute('route') === route && !parentNode.classList.contains('hiding') && typeof title === 'string') {
        document.documentElement.style.background = window.getComputedStyle(contentRef.current.querySelector('.page'))['background-color'];
        dispatch('setTitle', title);
        setIsLast(true);
        return;
      }
    }
    setIsLast(false);
  }, [title, route]);  


  // handle faux-collapsible sticky header
  useEffect(() => {
    var lastScrollTop = 0;
    var offsetHeight, scrollHeight, app;
    var lastMeasurement = 0;
    const listener = () => {
      if ((new Date - lastMeasurement) > 1000) {
        offsetHeight = contentRef.current.offsetHeight;
        scrollHeight = contentRef.current.scrollHeight;
        app = document.querySelector('#app');
        lastMeasurement = new Date;
      }
      

      var scrollTop = contentRef.current.scrollTop;
      //requestAnimationFrame(() => {
        if (maxWidth <= 784) {
          if (app) {

            if (scrollTop > lastScrollTop && scrollTop > 30 &&  scrollTop + offsetHeight < scrollHeight - 70 && offsetHeight + 200 < scrollHeight) {
              if (!app.classList.contains('footerHidden')) app.classList.add('footerHidden');
            } else {
              if (app.classList.contains('footerHidden')) app.classList.remove('footerHidden');
            }
            if (scrollTop > lastScrollTop && scrollTop > (headerType == 'notch' ? 300 : 40) && scrollTop + offsetHeight < scrollHeight - 70  && offsetHeight + 200 < scrollHeight) {
              if (!app.classList.contains('headerHidden')) app.classList.add('headerHidden');
            } else {
              if (app.classList.contains('headerHidden')) app.classList.remove('headerHidden');
            }
          }
        }
        lastScrollTop = scrollTop;
        if (headerRef.current && headerType == 'notch') {
          if (scrollTop > 230) {
            if (!headerRef.current.classList.contains('integrated')) 
              headerRef.current.classList.add('integrated');
          } else {
            if (headerRef.current.classList.contains('integrated')) 
              headerRef.current.classList.remove('integrated');
          }
          const offsetY = - Math.min(110, scrollTop / 2);
          const back = headerRef.current.querySelector('[class*="nav"] [class*="back"]')
          if (back)
            back.style.transform = `translateY(${offsetY}px)`
          const action = headerRef.current.querySelector('[class*="nav"] [class*="action"]')
          if (action)
            action.style.transform = `translateY(${offsetY}px)`
        
          const offsetYBadge = - Math.min(234, scrollTop);
          const titleElement = headerRef.current.querySelector('[class*="nav"] [class*="badge"]')
          if (titleElement)
            titleElement.style.transform = `translateY(${offsetYBadge}px)`
        }
        
      //});
    }
    listener();
    //if (headerExtra) {
      const contentElement = contentRef.current;
      contentElement.addEventListener('scroll', listener, {passive: true});
      return () => contentElement.removeEventListener('scroll', listener, {passive: true});
    //}
  }, [maxWidth])

  usePrecache((cache) => {
    if (parentLink && parentCache && !parentCache.isPlaceholder) {
      cache[parentLink.replace(/\/edit/, '')] = parentCache;
    }
    if (manageLink && manageCache && !manageCache.isPlaceholder) {
      cache[manageLink.replace(/\/edit/, '')] = manageCache;
    }
    if (actionLink && actionCache && !actionCache.isPlaceholder) {
      cache[actionLink.replace(/\/edit/, '')] = actionCache;
    }
  }, [parentCache, actionCache, manageCache, parentLink, manageLink, actionLink])


  const showBack = parentAlwaysShow || (parentLink && location.pathname.replace(/\/edit|\/new/, '') == parentLink)
  
  const actionNodeUsed =  (actionRequest && actionRequest.loading)  ? <Icon.Spinner /> : actionNode;

  const hasHeader = !props.hidden && !headerHidden;

  const allRequests = (requests || []).concat(actionRequest || []);
  
  const allErrors = allRequests
    .map((request) => request.error)
    .concat(errors || [])
    .filter(Boolean)
    .map((error) => ((error.message || error.error || error).toString()))

  useEffect(() => {
    if (allErrors.length) {
      allErrors.map((error) => track('send', 'event', 'Error', error))
    }
  }, allErrors)
  return [
    <div ref={contentRef} allowScroll={true} class={`${style.content} ${hasHeader ? style.has_header : null} theme-${pageTheme}`}>
      {hasHeader && <header ref={headerRef} hidden={headerFaded} class={`${style.header}  ${headerType ? style[headerType] : 'cover'} ${headerClass} cover theme-${headerTheme || 'white'}`}>
        {navigation.nav}
        
        {!navigation.nav && <div class={style.nav}>
          <div class={style.left}>
            {(parentLink || parentHandler) && <a className={`${style.back} back-button ${showBack ? 'required' : null}`} href={parentLink} onClick={parentHandler} index="parent">
              <Icon name={isLast && location.search.match(/from=/) ? 'Up' : 'ChevronLeft'} />
              {(maxWidth < 1144 || (isLast && location.search.match(/from=/) || headerType) || route === 'courses') && <span>{ parentTitle || 'Back' }</span>}
            </a>}
          </div>
          <div class={`${style.title} ellipsis`}>
            {(manageLink || manageHandler) && <a href={manageLink} onClick={manageHandler} index="manage">{titleNode || <h1>{title}</h1>}</a>}
            {!(manageLink || manageHandler) && (titleNode || <h1>{title}</h1>)}
          </div>
          <div class={style.right}>
            { actionNodeUsed }
            { !actionNodeUsed && actionTitle && <a className={style.action} href={actionLink} onClick={actionHandler} index="action">
              <span>{ actionTitle }</span>
            </a>}
          </div>
        </div>}

        <div class={style.after_nav}>
          {navigation.afterNav}
        </div>
        
      </header>}
      <div class={style.wrapper}>
        {navigator.onLine !== false && allErrors.map((error) => <p class={`error ${style.error}`}>{error}</p>)}
        <section {...props} class={`page ${props.class} ${props.id} ${style.page}`}>
          {navigation.before}
          {/*{layout === 'minimal' && navigation.title && <h1 class={style.title}>{navigation.title}</h1> }*/}
          {children}
          {navigation.after}
        </section>
      </div>
    </div>
  ]
}