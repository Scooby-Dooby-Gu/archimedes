import { useMemo, useState, useRef, useEffect } from 'preact/hooks';
import style from '../style.module.scss';
import Icon from '/components/icon';
import { useTransition, animated, config } from 'react-spring'
import { dragAction, createUseGesture } from '@use-gesture/react';
import { shuffle } from '../../../lib/math';



const useGesture = createUseGesture([dragAction])


var answerHeight = 47 + 10;

export default function Ranking({options, answer, interaction, onChange, onInteract}) {
  const [order, setOrder] = useState(() => shuffle(options, undefined, true));

  const [changed, setChanged] = useState(0);

  const elementRef = useRef();
  const measurements = useRef({
    bounds: {},
    height: 0,
    order: order
  });

  useMemo(() => {
    measurements.current.order = order;
  }, [order])

  const getStyle = (item, state) => {
    const index = measurements.current.order.indexOf(item);
    return {
      opacity: 1,
      scale: 1,
      y: index * answerHeight,
      x: 0,
      rotateX: '0deg', 
      zIndex: 1,
      backgroundColor: '#26442E', 
      checklistOpacity: state == 'correct' ? 1 : 0,
      borderColor:  state == 'correct' ? '#3EB44A' : state == 'incorrect' ? '#B4533E' : '#D0FCFF', 
      borderStyle: state == 'pushed' ? 'dotted' : 'solid',
      immediate: (key) => key == 'zIndex' || key == 'y' && interaction == 'initial' ? true : false,
      config: (key) => {
        return key == 'borderColor' ? config.stiff : 
        key == 'rotateX' ? config.slow : 
        key == 'y' ? {tension: 120, friction: 12} : config.slow
      },
    }
  }

  const transition = useTransition(interaction != 'initial' ? order : [], {
    trail: interaction == 'ready' ? 150 :
           interaction == 'failure' ? 200 : 0,
    delay: interaction == 'ready' ? 700 : 0,
    enter: getStyle,
    from: (item) => {
      const index = order.indexOf(item);
      return {
        backgroundColor: '#26442E',
        color: '#D0FCFF',
        opacity: 0,
        scale: .9,
        checklistOpacity: 0,
        y: index * answerHeight,
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

  useEffect(() => {
    if (interaction == 'success') {
      var strs = answer.map((v) => String(v))
      setOrder((items) => items.slice().sort((a, b) => {
        return strs.indexOf(String(a.index)) - strs.indexOf(String(b.index));
      }));
    }
  }, [answer])

  useEffect(() => {
    if (interaction == 'retry')  {
      setChanged(0);
      setOrder(shuffle(order, undefined, true));
      setTimeout(() => {
        setOrder(shuffle(order, undefined, true));
      }, 400)
      setTimeout(() => {
        setOrder(shuffle(order, undefined, true));
      }, 800)
    }
  }, [interaction]);

  useEffect(() => {
    reposition();
  }, [order]);
  useEffect(() => {
    if (interaction == 'failure' || interaction == 'success')
      reposition();
  }, [interaction]);

  useMemo(() => {
    measurements.current.height = options.length * answerHeight;
    measurements.current.bounds = { top: 0, bottom: measurements.current.height - answerHeight }

    measurements.current.apis = {};
    transition((styles, item, context, index) => measurements.current.apis[context.key] = { api: context.ctrl, item: item });

  }, [options, interaction]);

  const reposition = (state) => {
    for (var key in measurements.current.apis) {
      const { api, item } = measurements.current.apis[key];
      const index = measurements.current.order.indexOf(item);
      //api.stop(['y', 'zIndex']);
      const currentIndex = order.indexOf(item);

      api.start(getStyle(item, 
        state == 'inreacting' 
          ? 'pushed' : 
        interaction == 'success' || interaction == 'failure' ?
          currentIndex == item.index 
            ? 'correct' : 'incorrect'
          : 'default'))
    }
  }

  const bind = useGesture({
    onDrag: ({ args: [transition], event, tap, down, offset: [x, y] }) => {
      const targetIndex = Math.floor(( y) + answerHeight * 0.5) / answerHeight;
      const newIndex = Math.max(0, Math.min(options.length - 1, targetIndex));
      const oldIndex = measurements.current.order.indexOf(transition.item);
      measurements.current.order.splice(oldIndex, 1);
      if (oldIndex > newIndex) {
        measurements.current.order.splice(newIndex - 1, 0, transition.item);
      } else {
        measurements.current.order.splice(newIndex, 0, transition.item);
      }
      reposition('interacting');
      transition.ctrl.stop(['y', 'zIndex']);
      transition.ctrl.start({
        immediate: (key) => key == 'zIndex' || key == 'y' ? true : false,
        y: y, 
        config: {tension: 400, friction: 50}, 
        backgroundColor: '#182B1D', 
        zIndex: 10, 
        borderStyle: 'solid'})
    },
    onDragEnd: () => {
      setOrder(measurements.current.order.slice())
      onChange(measurements.current.order.map((i) => String(i.index)))
    },
    onDragStart: () => {
      onInteract();
      if (interaction == 'failure') {
        setOrder(shuffle(order, undefined, true));
      }
      console.log('dragstart')
    }
  },
  {
    drag: { 
      preventDefault: true,
      filterTaps: false,
      axis: 'y', 
      rubberband: true,
      from:( { args: [ { item } ], event }) => {
        const oldIndex = measurements.current.order.indexOf(item);
        return [0, oldIndex * answerHeight];
      },
      //threshold: [0, 1],
      //preventScroll: true,
      bounds: measurements.current.bounds
    },
  });


  useEffect(() => {
    elementRef.current.style.height = measurements.current.height + 'px';
  }, []);

  return <ul class={`options ${style.options} answers ${style.answers}`} ref={elementRef}>
    {transition((styles, item, transition) =>{
      return <animated.li  {...bind(transition)} style={{...styles, touchAction: 'none'}} order={item.index} class={`answer ${style.answer} handle`} key={item.index}>
        <label class="row space-between">
          {item.name}
          <Icon.SymbolsDrag />
          <animated.div class={style.checkmarkWrapper} style={{opacity: styles.checklistOpacity}}>
            <Icon.Checkmark /> 
          </animated.div>
        </label>
      </animated.li>
    })}
  </ul>
}