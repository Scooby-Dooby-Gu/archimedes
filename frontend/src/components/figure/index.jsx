import { cloneElement, toChildArray } from 'preact';
import { useRef, useState, useMemo, useEffect } from 'preact/hooks';
import Icon from '/components/icon/index.jsx';
import Youtube, { parseYoutubeVideoID } from '../youtube';
import style from './style.module.scss';

import { dragAction, pinchAction, createUseGesture } from '/lib/use-gesture.jsx'
import { animated, useSpring, config } from 'react-spring';


const useGesture = createUseGesture([dragAction, pinchAction])
export default function Figure({children, className = '', ...props}) {
  var youtubeId

  // hack: replace thumbnail with youtube video
  const link = children.find((c) => c.type == 'a');
  if (link && link.props.href) {
    youtubeId = parseYoutubeVideoID(link.props.href);
    if (youtubeId) {
      // swap thumbnail with youtube embed
      children = children.map((c) => {
        if (c.props && c.props.class && c.props.class.includes('card-content')) {
          const clone = cloneElement(c);
          clone.props.children = toChildArray(clone.props.children).map((g) => {
            if (g.type == Figure && g.props.class && g.props.class.includes('image')) {
              return <Youtube src={link.props.href} />;
            } else {
              return g;
            }
          })
          return clone;
        }
        return c;
      })
    }
  }

  if (className.includes('image-zoom') || className.includes('image-fullscreen')) {
    children = <Figure.Zoomable {...props}>{children}</Figure.Zoomable>
  }

  return <Figure.Expandable className={className} youtubeId={youtubeId} {...props}>
    {children}
  </Figure.Expandable>

}

Figure.Expandable = ({children, className, open: defaultOpen, expandable, youtubeId, ...props}) => {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef();

  if (expandable || youtubeId) {
    var onClick = (e) => {
      if (expandable && (!open || e.target.closest('.card-title'))) {
        setOpen((o) => !o);
      } else if (youtubeId && e.target.closest('a')) {
        e.preventDefault();
        e.stopPropagation();
        const iframe = ref.current.querySelector('iframe');
        if (iframe  && iframe.player) {
          e.target.closest('a').style.display = 'none';
          iframe.player.playVideo();
        }
      }
    }
  }  
  return <figure ref={ref} onClick={onClick} className={`${style.figure} ${className}`} {...props} expandable={expandable} open={open}>{children}</figure>
}

Figure.Zoomable = ({children, className}) => {
  const ref = useRef();
  const [maximized, setMaximized] = useState(null);
  const [measurements, setMeasurements] = useState({});

  const [{x, width, scroll, opacity }, api] = useSpring(() => ({
    x: 0,
    opacity: 0,
    width: 0,
    scroll: 0,
    config: config.fast,
    restVelocity: 0.5
  }))

  const measure = () => {
    if (!ref.current) return;
    var updated = {};
    updated.img = ref.current.querySelector('img');
    updated.scrollbar = ref.current.parentNode.querySelector('.' + style.scrollbar);
    updated.innerWidth = ref.current.parentNode.offsetWidth;
    updated.ratio = updated.img.naturalWidth / updated.img.naturalHeight;
    updated.naturalWidth = updated.img.getAttribute('width') ? parseInt(updated.img.getAttribute('width')) : updated.img.naturalWidth || updated.img.offsetWidth;
    updated.naturalHeight = updated.naturalWidth / updated.ratio;
    updated.img.onload = updated.img.loaded ? null : measure;
    updated.expandedHeight = Math.min(window.innerHeight - 200, updated.naturalHeight, className.includes('image-zoom') ? 400 : 800);
    updated.expandedWidth = updated.ratio * updated.expandedHeight;
    updated.scrollWidth = (updated.expandedHeight - updated.innerWidth);
    updated.speed = Math.max(1.5, updated.scrollWidth / updated.innerWidth * 1.75);
    updated.bounds = {
      left: - (updated.expandedWidth - updated.innerWidth) / updated.speed,
      right: 0,
    }
    updated.scrollbar.style.width = updated.innerWidth / updated.expandedWidth * updated.innerWidth + 'px'
    api.set({width: updated.innerWidth});
    setMeasurements(updated);
  }

  useEffect(measure, []);

  useEffect(() => {
    if (!measurements.innerWidth) return;
    
    if (maximized) {
      //measurements.img.setAttribute('sizes', measurements.expandedWidth * 2 + 'px')
      ref.current.scrollIntoViewCustom({
        behavior: 'smooth',
        block: 'start',
        offsetTop: -100
      })
      
      api.start({width: measurements.expandedWidth,});
    } else {
      api.start({width: Math.min(measurements.innerWidth, measurements.naturalWidth), x: 0, scroll: 0, opacity: 0});
    }
  }, [maximized])


  // Set the drag hook and define component movement based on gesture data
  const bind = useGesture({
    onPinch: () => {
      if (!maximized) return setMaximized(new Date);
    },
    onDrag: ({ event, tap, down, offset: [x, y] }) => {
      console.log(x)
      if (tap && maximized) {
        if (new Date - maximized > 150)
          return setMaximized(false);
      } else if (!maximized) setMaximized(new Date);
      
      api.start({ 
        scroll: - (x / ((measurements.expandedWidth) / measurements.speed))  * (measurements.innerWidth ),
        opacity: 1 + (x / ((measurements.expandedWidth - measurements.innerWidth) / measurements.speed)),
        x: x * measurements.speed,
        immediate: down ? true : false })
    },
  },
  {
    eventOptions: {
      passive: false
    },
    drag: { 
      preventDefault: true,
      filterTaps: true,
      from: () => [ !measurements.speed ? 0 : x.get() / measurements.speed, 0], 
      axis: 'x', 
      rubberband: true,
      threshold: [0, 0],
      preventScroll: true,
      bounds: measurements.bounds
    },
    pinch: { scaleBounds: { min: 0.5, max: 2 }, rubberband: true },
    //pinch: { scaleBounds: { min: 0.5, max: 2 }, rubberband: true },
  });
  if (measurements.expandedWidth / measurements.innerWidth < 1.2) {
    return children;
  }

  return useMemo(() => <div class={`${maximized ? '' : style.minimized}  ${style.wrapper}`}>
    <div class={style.meta}>
      <Icon.SymbolsTapFill class={style.tap} />
      <p class={style.tip}>{maximized ? 'Swipe horizontally' : 'Tap to enlarge'}</p>
    </div>
    <animated.div class={style.fade} style={{opacity: opacity}}></animated.div>
    <animated.div class={style.scrollbar} style={{x: scroll}}></animated.div>
    <animated.div {...bind()} class={`${style.canvas}`} ref={ref} style={{ x, width,  touchAction: 'pan-y'  }}>
      {children}
    </animated.div>
  </div>, [maximized]);
}