import style from './style.module.scss';
import { useStore, usePrecache, useCallback, useEffect, useRef, useMemo, useState } from '/lib/hooks/';
import Router from '/lib/router';
import Achievement from '/components/achievement';
import { useTransition, animated, config } from 'react-spring'
import { cloneElement, memo } from 'preact/compat';

// do not render router element
// instead we inject it into column element
class RouterWithoutRendering extends Router {
  render(...args) {
    super.render(...args);
    return null//[];
  }
}

const columnNames = ['column-fullscreen', 'column-first', 'column-second', 'column-third'].reverse()
var columns = {};
var previousColumns = {};
// column with router, its children are routes
// hides column if no routes match
export default function Column ({children, ...props}) {
  const user       = useStore('auth.user');
  const maxWidth   = useStore('app.maxWidth');
  const animations = useStore('app.animations');

  const [{current, previous}, setContent] = useState({});
  const isVisible = useRef();


  const onChange = useCallback((router) => {
    var matchedRoute = router.current;
    if (columns.url !== router.url) {
      previousColumns = columns;
      columns = {}
      columns.url = router.url;
    }
    columns[props.id] = matchedRoute;
      
    if (matchedRoute) {
      matchedRoute.props.router = router;
    }
    if (matchedRoute || current) { 
      requestAnimationFrame(() => {
        setContent((content) => ({
          current:  matchedRoute,
          previous: content.current,
        }));
      })
    }
  }, [current, previous]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    var timeout
    const setter = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setWindowWidth(window.innerWidth)
      }, 200)
    };
    window.addEventListener('resize', setter);
    return () => {
      window.removeEventListener('resize', setter)
    }
  }, [])

  const isLast = useMemo(() => {
    if (current) {
      const lastName = columnNames.find((name) => columns[name] && (!columns[name].props.default || Object.values(columns).filter(Boolean).length == 2));
      const last = columns[lastName];
      if (last === current) {
        dispatch('setUrl', current.props.url)
        dispatch('setRoute', current.props.name)
        dispatch('setColumn', current.props.column)
        dispatch('setLayout', current.props.layout || 'default')
      }
      return last === current;
    }
    return false;
  }, [current, columns]);

  const order = /\/?(users)?(ambitions)?(games)?(videos)?(boards)?(rankings)?(courses)?/
  const left = current && current.props.router.previous && current.props.router.previous.match(order).slice(1).map((m, i) => m && i).filter((i) => i != null)[0]
  const right = current && current.props.router.url.match(order).slice(1).map((m, i) => m && i).filter((i) => i != null)[0]
  
  const direction = 
    current ? 
      // going from game to lesson: left to right
      current.props.from ? true :
      // lesson to game: right to left
      previous && previous.props.from ? false :
      left === right ?
        (current.props.router.previous || '').split('/').length 
        < (current.props.router.url || '').split('/').length 
      : maxWidth > 784 ? false : left < right
    : false

  const useTwoColumns = true//(current && content && content.props.twoColumns != null) || maxWidth <= 1440
  const content = columns['column-fullscreen'] && props.id !== 'column-fullscreen' || useTwoColumns && props.id === 'column-first' &&  columns['column-third'] ? null : current;
  const component = previous || current;
  const shouldMove = component && (component.props.name == 'ambitions'  || (component.props.name == 'ambition' && maxWidth <= 784) ) ? false : 
                  // dont move when toggline third column in two-column setup, unless also closing second
                  (useTwoColumns && props.id === 'column-third' && (previousColumns['column-second'] && columns['column-second'])) ? false : 
                  (useTwoColumns && props.id === 'column-first' && !isVisible.previous) ? true : 
                  // dont move minimal layout
                  !(component && component.props.layout === 'minimal') 
                  && ((!previous || !content ? maxWidth > 784 : content.props.name !== previous.props.name));

  const fromX = maxWidth > 784 ? `-100%` : (direction ? '100%' : '-100%');
  const toX   = maxWidth > 784 ? `-100%`  : (direction ? '-100%' : '100%');

  const is3d = props.id === 'column-third' && !useTwoColumns;
  const is1st = props.id === 'column-fullscreen' || props.id === 'column-first' || (props.id === 'column-second' && columns['column-third'] && useTwoColumns)
  const is2nd = !is1st && !is3d;
  
  const availableWidth = window.innerWidth - (!(component && (component.props.layout === 'minimal' || (component.props.visibility == 'public' && !user))) && maxWidth > 784 ? 64 : 0);
  const positionX = is1st ? '0px' : is2nd ? '360px' : '720px';
  const width = props.id === 'column-fullscreen' 
    ? availableWidth : 
    is3d ? availableWidth - 720 : 
    is2nd && (useTwoColumns && !columns['column-third'] || props.id === 'column-third') ? availableWidth - 360 : 360;
  
  const getKey = (c) => c && (c.props.depth ? c.props.url.split('?')[0].split('/').slice(0, parseInt(c.props.depth) + 1).join('/') : c.props.name) 
  
  isVisible.current = !!content;

  // when opening/closing third column, don't fade it away in two column setup
  const shouldFade = maxWidth > 784 ? (isVisible.previous && isVisible.current || props.id === 'column-third' && !columns['column-second'] && !columns['column-third']) : !shouldMove;
  const transition = useTransition(current && content ? [current] : [], {
    key: getKey,
    config: { tension: 100, friction: 15, mass: 0.7 },
    from: ({width: width + 'px', opacity: !shouldMove && shouldFade ? 0 : 1, transform: shouldMove ? `translate3d(calc(${fromX} + ${positionX}),0,0)` : `translate3d(calc(0% + ${positionX}),0,0)`}) ,
    enter: ({width: width + 'px', opacity: 1, transform: `translate3d(calc(0% + ${positionX}),0,0)`}),
    update: ({width: width + 'px',  opacity: 1, transform: `translate3d(calc(0% + ${positionX}),0,0)`}),
    leave: shouldMove
      ? { width: width + 'px',  opacity: shouldFade ? 0 : 1, transform: `translate3d(calc(${toX} + ${positionX}),0,0)` }
      : { delay: 500, width: width + 'px', opacity: shouldFade && (maxWidth >= 784 || !shouldMove) ? 0 : .99, transform: `translate3d(calc(0% + ${positionX}),0,0)`/*, delay: 300 */}
  })

  isVisible.previous = isVisible.current;

  
  const res = [
    <RouterWithoutRendering onChange={onChange}>
      {children}
    </RouterWithoutRendering>,
    
    animations === false 
      ? content && <MemoizedColumn isLast={isLast} layout={current.props.layout} route={current.props.name} style={{width: width, left: positionX}} {...props}>
        {cloneElement(current)}
      </MemoizedColumn> 
      : transition((values, item) => {
       return item && <MemoizedColumn isLast={isLast} layout={item.props.layout} isHiding={item !== current} style={values} route={item.props.name} {...props}>
        {item}
      </MemoizedColumn>
      })
  ]
  return res//, [current && current.props.url])
}

Column.Content = ({isLast, children, isHiding, ...props}) => {
  useEffect(() => {
    if (isLast) {
      console.log('%c route  %c %O', 'background: rgb(84, 110, 122); color: #eaeaea; border-radius: 2px;', '', props)
      var timeout = setTimeout(() => {
        track('send', 'pageview', {
          'page': location.pathname,
          'title': document.title
        });
      }, 1000);
      return () => clearTimeout(timeout);
    } else {
      console.log('%c route  %c %O', 'background: rgba(84, 110, 122, 0.7); color: #eaeaea; border-radius: 2px;', '', props)
    }
  }, [location.pathname])


  return <animated.div {...props} class={`column ${props.layout} ${style.column} ${props.class} ${isLast ? 'last' : null} ${isHiding && 'hiding'}`}>
    {isLast && <Achievement  />}
    {children}
  </animated.div>
}

/* */
const MemoizedColumn = memo(Column.Content, (previousProps, nextProps) => {
  // dont re-render hiding component
  if (nextProps.isHiding) {
    return true;
  }
  if (!!previousProps != !!nextProps) return false;
  for (var property in previousProps) {
    if (nextProps[property] != previousProps[property]) return false;
  }
  for (var property in nextProps) {
    if (nextProps[property] != previousProps[property]) return false;
  }
  return true;
});