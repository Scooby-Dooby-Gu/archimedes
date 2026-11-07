import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { useTransition, config, animated } from 'react-spring';
import style from '../style.module.scss';
import Icon from '/components/icon';
import { dragAction, createUseGesture } from '@use-gesture/react';

const useGesture = createUseGesture([dragAction])

export default function Blanks({options, interaction, onInteract, onChange, answer, title}) {
  const elementRef = useRef()
  const measurements = useRef({})

  const bits = title.split(/_+/g);
  const blankCount = (title.match(/_+/g) || []).length;
  const [matches, setMatches] = useState(() => answer || []);


  const getStyle = (item, state) => {
    return {
      opacity: interaction == 'success' && !matches.includes(item.name) ? 0 : 1,
      scale: 1,
      y: 0,
      x: 0,
      rotateX: '0deg', 
      zIndex: 1,
      backgroundColor: state == 'incorrect' ? '#26442E' : matches.includes(item.name) ? '#182B1D' : '#26442E', 
      borderColor:  state == 'incorrect' ? '#B4533E' : matches.includes(item.name) ? '#182B1D' : '#D0FCFF', 
      borderStyle:  state == 'incorrect' ? 'dotted' : matches.includes(item.name) ? 'solid' : 'dotted',
      immediate: (key) => key == 'zIndex' || interaction == 'initial' ? true : false,
      config: (key) => {
        return key == 'borderColor' ? config.stiff : 
        key == 'rotateX' ? config.slow : 
        key == 'y' ? {tension: 120, friction: 12} : config.slow
      },
    }
  }
  

  function reposition() {
    measurements.current.apis = {};
    transition((styles, item, context, index) => measurements.current.apis[context.key] = { api: context.ctrl, item: item });
    
    
    measurements.current.items = Array.prototype.map.call(
      elementRef.current.querySelectorAll('.' + style.item), 
      (item, index) => {
      return {
        element: item,
        width: item.offsetWidth,
        height: item.offsetHeight,
        item: options.find((i) => i.index == item.getAttribute('index')),
        index: item.getAttribute('index'),
        api: measurements.current.apis[item.getAttribute('index')].api
      }
    })

    measurements.current.blanks = Array.prototype.map.call(
      elementRef.current.querySelectorAll('.' + style.blank),
      (blank, index) => ({
        element: blank,
        index,
      })
    )

    // reflow 
    measurements.current.blanks.forEach((blank, index) => {
      const item = measurements.current.items.find((item) => item.item.name == matches[index]);
      if (item) {
        blank.element.classList.remove('empty')
        blank.element.style.width = item.width + 'px'
      } else {
        blank.element.classList.add('empty');
        blank.element.style.width = '';
      }
    })

    measurements.current.blanks = Array.prototype.map.call(
      elementRef.current.querySelectorAll('.' + style.blank),
      (blank, index) => ({
        element: blank,
        index,
        y: blank.offsetTop,
        x: blank.offsetLeft,
        width: blank.offsetWidth,
        height: blank.offsetHeight
      })
    )

    const header = elementRef.current.querySelector('h2');
    measurements.current.header = {
      header,
      top: header.offsetTop,
      height: header.offsetHeight,
      width: header.offsetWidth
    }

    measurements.current.blanks = Array.prototype.map.call(
      elementRef.current.querySelectorAll('.' + style.blank),
      (blank, index) => ({
        element: blank,
        index,
        y: blank.offsetTop,
        x: blank.offsetLeft,
        width: blank.offsetWidth,
        height: blank.offsetHeight
      })
    )

    measurements.current.area = elementRef.current.querySelector('ul');



    var x = 0;
    var y = measurements.current.header.top + measurements.current.header.height + 24;
    var itemOffsetX = 10;
    var lastItemHeight = 0;

    const unused = measurements.current.items.filter((item) => {
      const index = matches.indexOf(item.item.name);
      if (index != -1) {
        const blank = measurements.current.blanks[index];
        item.x = blank.x;
        item.y = blank.y;
        item.slot = blank;
        return false;
      } else {
        item.slot = null;
      }
      return true;
    });

    unused.forEach((item, index) => {
      if (x != 0 && x + item.width > measurements.current.header.width) {
        y += lastItemHeight + 10;
        x = 0;
      }
      item.x = x;
      item.y = y;
      lastItemHeight = item.height;
      x += item.width + itemOffsetX;
    })
      
    measurements.current.height = y ;
    
    measurements.current.items.forEach((item) => {
      item.api.start({
        ...(getStyle(item.item, interaction == 'failure' ? 
        matches.includes(item.item.name) ?
          (matches.indexOf(item.item.name) == item.item.index ? 'correct' : 'incorrect') 
        : undefined
        : undefined)),
        x: item.x,
        y: item.y,
      })
    })

    measurements.current.bounds = {
      left: 10,
      top: 0,
      right: measurements.current.header.width - 10,
      bottom: measurements.current.height
    }
    
    measurements.current.area.style.height = interaction == 'success' ? '0px' : measurements.current.height - measurements.current.header.height + 'px';
  }
  
  const transition = useTransition(interaction != 'initial' ? options : [], {
    trail: interaction == 'ready' ? 150 :
           interaction == 'failure' ? 200 : 0,
    delay: interaction == 'ready' ? 700 : 0,
    enter: getStyle,
    from: (item) => {
      return {
        backgroundColor: '#26442E',
        color: '#D0FCFF',
        opacity: 0,
        scale: .9,
        checklistOpacity: 0,
        y: 0,
        rotateX: '-90deg',
        top: 0,
        position: 'absolute', 
        zIndex: 1,
        borderStyle: 'solid',
        backfaceVisibility: 'hidden',
        webkitBackfaceVisibility: 'hidden',
      
      };
    },
    key: (item) => item.index
  });

  const bind = useGesture({
    onDrag: ({ args: [transition], event, tap, down, offset: [x, y] }) => {
      const dragged = measurements.current.items.find((i) => transition.item.index == i.index);
      const target = measurements.current.blanks.map((blank) => ({
        blank,
        distance: Math.sqrt(
          Math.pow((blank.x + blank.width / 2) - (x + dragged.width / 2), 2) + 
          Math.pow((blank.y + blank.height / 2)  - (y + dragged.height / 2), 2))
      })).sort((a, b) => a.distance - b.distance)[0]


      var targetArea = target.distance < 75 ? target.blank : null;
      if (targetArea != measurements.current.targetArea) {
        if (measurements.current.targetArea) {
          measurements.current.targetArea.element.classList.remove('target');
        }
        if (targetArea) {
          targetArea.element.classList.add('target');
        }
        measurements.current.targetArea = targetArea;
      }

      transition.ctrl.stop(['y', 'zIndex']);
      transition.ctrl.start({
        immediate: (key) => key == 'zIndex' || key == 'y' || key == 'x' ? true : false,
        y: y, 
        x: x,
        config: {tension: 400, friction: 50}, 
        backgroundColor: '#182B1D', 
        borderColor: '#182B1D',
        zIndex: 10, 
        borderStyle: 'solid'})
    },
    onDragEnd: ({ args: [transition] }) => {
      var dragged = measurements.current.items.find((i) => transition.item.index == i.index);
      setMatches((m) => {
        const copy = m.slice()
        var index = copy.indexOf(dragged.item.name);
        if (index > -1) copy[index] = null;
        if (measurements.current.targetArea) {
          measurements.current.targetArea.element.classList.remove('target');
          copy[measurements.current.targetArea.index] = dragged.item.name;
        }
        onChange(copy);
        return copy;
      })
    },
    onDragStart: () => {
      onInteract();
      if (interaction == 'failure') {
        setMatches([])
      }
    }
  },
  {
    drag: { 
      preventDefault: true,
      filterTaps: false,
      //axis: 'y', 
      rubberband: true,
      from:( { args: [ { item } ], event }) => {
        //const oldIndex = measurements.current.order.indexOf(item);
        const el = measurements.current.items.find((i) => item.index == i.index);
        return [el.x, el.y];
      },
      //threshold: [0, 1],
      //preventScroll: true,
      bounds: ({ args: [ { item }] }) => {
        const el = measurements.current.items.find((i) => item.index == i.index);
        return {
          ...measurements.current.bounds,
          right: measurements.current.bounds.right - el.width
        }
      }
    },
  });



  useEffect(() => {
    if (interaction == 'retry')  {
      setMatches([])
    }
  }, [interaction]);

  useEffect(() => {
    reposition(true);
  }, [interaction, matches]);

  return <div ref={elementRef}>
    <h2 class={`${style.title} question-title`}>
      {bits.reduce((a, bit, index) => {
        return a.concat(index > 0 && <span class={style.blank} index={Math.floor(index - 1)}>
        </span>, bit)
      }, [])}
    </h2>
    
    <div class={`group ${style.group}`}>
      <ul class={`${style.items}`}>
        {transition((styles, item, transition) =>
          <animated.li {...bind(transition)} style={{...styles, touchAction: 'none'}} class={`${style.item}`} index={item.index}>
            {item.name}
          </animated.li>
        )}
      </ul>
    </div>
    
  </div>
}