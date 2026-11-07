import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import style from '../style.module.scss';
import { shuffle } from '../../../lib/math';
import { useTransition, animated, config } from 'react-spring'
import { dragAction, createUseGesture } from '@use-gesture/react';
import { Icon } from '/components'

const useGesture = createUseGesture([dragAction])


export default function Match({options, interaction, name, answer, onInteract, onChange}) {
  const measurements = useRef({});
  const elementRef = useRef()

  const [matches, setMatches] = useState(() => answer || options.map((c) => null));

  const groups = useMemo(() => {
    return options.reduce((array, item) => {
      if (array.includes(item.group))
        return array;
      return array.concat(item.group)
    }, [])
  }, [options]);

  const getStyle = (item, state) => {
    const el = measurements.current.items ? measurements.current.items.find((i) => item.index == i.index) : { x: 0, y : 0};
    return {
      opacity: 1,
      scale: 1,
      y: el.y,
      x: el.x,
      rotateX: '0deg', 
      zIndex: 1,
      backgroundColor: state == 'incorrect' ? '#26442E' : matches[el.index] ? '#182B1D' : '#26442E', 
      borderColor:  state == 'incorrect' ? '#B4533E' : matches[el.index] ? '#182B1D' : '#D0FCFF', 
      borderStyle:  state == 'incorrect' ? 'dotted' : matches[el.index] ? 'solid' : 'dotted',
      immediate: (key) => key == 'zIndex' || interaction == 'initial' ? true : false,
      config: (key) => {
        return key == 'borderColor' ? config.stiff : 
        key == 'rotateX' ? config.slow : 
        key == 'y' ? {tension: 120, friction: 12} : config.slow
      },
    }
  }
  
  const transition = useTransition(options, {
    trail: interaction == 'ready' ? 150 :
           interaction == 'failure' ? 200 : 0,
    delay: interaction == 'ready' ? 700 : 0,
    enter: getStyle,
    /*update: (item) => {
      return getStyle(item, interaction == 'failure' ? 
        matches[item.index] == item.group ? 'correct' : 'incorrect'
        : undefined)
    },*/
    from: (item) => {
      return {
        backgroundColor: '#26442E',
        color: '#D0FCFF',
        opacity: 0,
        scale: .9,
        y: 0,
        rotateX: '-90deg',
        top: 0,
        position: 'absolute', 
        zIndex: 1,
        borderStyle: 'solid',
        backfaceVisibility: 'hidden',
        webkitBackfaceVisibility: 'hidden'
      };
    },
    key: (item) => item.index
  });

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

    const areas = elementRef.current.querySelectorAll('.' + style.group + ', .' + style.items);
    measurements.current.areas = Array.prototype.map.call(areas, (area) => {
      return {
        element: area,
        y: area.offsetTop,
        x: area.offsetLeft,
        height: area.offsetHeight,
        width: area.offsetWidth,
        index: area.getAttribute('index'),
        items: measurements.current.items.filter((item) => {
          return matches[item.index] == area.getAttribute('index')
        })
      }
    });

    var x = 0;
    var y = measurements.current.areas[0].y;
    measurements.current.areas.forEach((area) => {
      var areaOffsetLeft = 10;
      var areaOffsetTop = 24;
      var areaOffsetBottom = 5;
      var itemOffsetX = 10;
      area.x = x;
      area.y = y;
      var lastItemHeight = 0;
      area.items.forEach((item, index) => {
        if (x != 0 && x + item.width > area.width) {
          y += lastItemHeight + 10;
          x = 0;
        }
        item.x = x + areaOffsetLeft;
        item.y = y + areaOffsetTop;
        lastItemHeight = item.height;
        x += item.width + itemOffsetX;
      })
      
      area.height = Math.max(area.index ? 80 : 0, (y - area.y) + lastItemHeight  + 6 + (area.index ? areaOffsetTop + areaOffsetBottom : 0));
      area.element.style.height = area.height + 'px';
      y = area.y + area.height + 5;
      x = 0;
    })

    measurements.current.items.forEach((item) => {
      item.api.start({
        ...(getStyle(item, interaction == 'failure' ? 
        matches[item.index] == item.item.group ? 'correct' : 'incorrect'
        : undefined)),
        x: item.x,
        y: item.y,
      })
    })

    measurements.current.bounds = {
      left: 10,
      top: measurements.current.areas[0].y,
      right: measurements.current.areas[0].width - 10,
      bottom: measurements.current.areas[measurements.current.areas.length - 1].y
          + measurements.current.areas[measurements.current.areas.length - 1].height
    }

  }


  const bind = useGesture({
    onDrag: ({ args: [transition], event, tap, down, offset: [x, y] }) => {
      var targetArea = measurements.current.areas.find((area) => {
        return area.y <= y && area.y + area.height >= y
      });
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
      if (measurements.current.targetArea) {
        setMatches((m) => {
          const copy = m.slice()
          copy[transition.item.index] = measurements.current.targetArea.index;
          onChange(copy);
          return copy;
        })
        measurements.current.targetArea.element.classList.remove('target');
      } else {
        reposition();
      }
    },
    onDragStart: () => {
      onInteract();
      if (interaction == 'failure') {
        setMatches(options.map((i) => null))
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
      setMatches(options.map((i) => null))
    }
  }, [interaction]);


  useEffect(() => {
      reposition(true);
  }, [interaction, matches]);

  

  return <div ref={elementRef}>
    {groups.map((group) => {
      const isEmpty = !matches.find((g) => g == group)
      return <fieldset index={group} class={`${style.group} ${isEmpty ? style.empty : style.filled}`} >
        <legend>{group}</legend>
        {isEmpty ? <Icon.SymbolsFinger /> : null}
      </fieldset>
    })}
    <ul class={`${style.items}`}>
      {transition((styles, item, transition) =>
        <animated.li {...bind(transition)} index={item.index} style={{...styles, touchAction: 'pan-x'}} class={`${style.item}`}>
          {item.name}
        </animated.li>
      )}
    </ul>
  </div>
}