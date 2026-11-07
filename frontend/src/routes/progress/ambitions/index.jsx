import { useCallback, useFetchedData, useMemo, useStore, useState } from "/lib/hooks";
import { Grid, Button, Icon, Page } from '/components/index.jsx';
import { getSlug, matchSlug } from "/lib/slugs";
import style from './style.module.scss'
import { findSubmission } from "/lib/data";
import { useRef, useEffect } from "preact/hooks";
import { useTransition, useSpring, config, animated, useSpringRef } from 'react-spring';
import useSorting from "../../../components/grid/sortable";


export default function Ambitions({ambitionId}) {
  const canManage       = useStore('auth.canManage');
  const role            = useStore('auth.user.role');
  const ambitions       = useStore('data.ambitions');
  const submissions     = useStore('data.submissions');
  const ambitionsError  = useStore('requests.ambitions.error');

  const [visibility, setVisibility] = useState(canManage);
  const [chosenAmbition, setChosenAmbition] = useState();
  const [isShowingQuestion, showQuestion] = useState(false);

  const listTransitionRef = useSpringRef()
  const [, liquid] = useSpring(() => ({
    config: { mass: 4, tension: 5, friction: 4.3, velocity: 0.1 },
    onChange: (e) => {
      if (ref.form) {
        const difference = ref.targetTop - (ref.dialogTop + e.value.y) + 50;
        if (difference > 0 && !ref.floating) {
          ref.floating = true;
          floatee.start({y: ref.floateeTop} )
        }
        ref.form.style.transform = `translate3d(0,${e.value.y}px,0)`
        if (ref.phase == phases.transitionAway) {
          ref.form.querySelector('.' + style.form).style.transform = `translateY(${- (e.value.y - ref.liquidTop)}px)`
        }
      }
    },
    from: {
      y: 0
    }
  }))
  const [, bounce] = useSpring(() => ({
    config: { tension: 10, velocity: -.1, friction: 2, bounce: true, restVelocity: .075 },
    onChange: (e) => {
      if (ref.ball) {
        if (ref.phase == phases.launchBall) {
          ref.ball.style.opacity = Math.min(1, - (e.value.y - 20) / 30)
        } else if (ref.phase == phases.launchBall || ref.phase == phases.letBallFall){
          ref.line.style.height = Math.min(58, 78 + e.value.y) + 'px'
          ref.ball.style.opacity = 1;
        }
        ref.ball.style.transform = `translateX(-0.3px) translateY(${e.value.y}px)`
        if (ref.target) {
          const threshold = 16;
          const diff = Math.min(threshold, ref.ballTargetTop - e.value.y);
          ref.target.style.transform = '';
          ref.buttonTop.style.transform = `translateY(${threshold - diff}px)`;
          ref.buttonFront.style.transform = `scale(${1 + (threshold - diff) / 16 / 8})`;
          ref.buttonFront.style.filter = `brightness(${(1 + (threshold - diff) / 16 / 4) * 100}%)`;
          ref.buttonBack.style.transform = `scale(${1 + (threshold - diff) / 16 / 8})`;
          ref.buttonBack.style.filter = `brightness(${(1 + (threshold - diff) / 16 / 4) * 100}%)`;
        }
      }
    },
    from: {
      y: 20,
    }
  }), [])
  const [, floatee] = useSpring(() => ({
    config: { mass: 2, tension: 5, friction: 2.3 },
    onChange: (e) => {
      ref.current.style.transform = `translateY(${e.value.y}px)`
    },
    from: {
      y: 0
    }
  }), [])

  useEffect(() => {
    new Image().src = new URL('../../../assets/atlas/decorations/pipe_left.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/atlas/decorations/pipe_right.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/atlas/decorations/pipe_tile.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/1.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/2.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/3.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/4.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/mask.png', import.meta.url).href;
  }, [])

  const onAnswer = (value) => {
    setTimeout(() => {
      dispatch('sendSubmission', {
        submission: {
          type: 'ambitionQuestion',
          ambitionId: chosenAmbition.id,
          ref: chosenAmbition.id,
          data: value,
          isComplete: true
        }
      });
    }, 1000)

    nextPhase(phases.transitionAway, ref);
    setTimeout(() => {
      route(`/ambitions/${getSlug(chosenAmbition)}`)
    }, 500)
  }

  const navigation = useMemo(() => ({
    actionTitle: canManage && <Icon.Add />,
    actionLink: canManage && '/ambitions/new',
    title: 'Ambitions',
    headerType: 'colorful',
    headerTheme: 'black',
    pageTheme: 'black',
    headerHidden: !canManage,
    manageHandler: () => setVisibility((v) => !v),
    titleNode: [visibility ? <Icon.Up /> : <Icon.Down />, 'Ambitions'],
    errors: [ambitionsError]
  }), [canManage, ambitionsError, visibility]);

  const [, moveGoalRequest, moveGoal] = useFetchedData('/', {
    method: 'post',
    immediate: false,
    onSuccess: () => {
      dispatch({type: 'fetchAmbitions'});
    }
  });
  const onSort = useCallback((url, index) => {
    moveGoal({
      order: index
    }, url);
  }, []);


  
  const displayedAmbitions = useMemo(() => {
    if (ambitions.isPlaceholder) return [];
    const starting = ambitions.filter((ambition) => !ambition.previousAmbitionId && (ambition.type == 'initial' || visibility));
    const groups = starting.map((ambition) => {
      return [ambition, ambitions.filter((a) => (a.type !== 'hidden' || visibility) && a.previousAmbitionId == ambition.id && ((role != 'user' && role != 'demo') || findSubmission(submissions, 'ambition', ambition.id) || visibility))];
    })
    return groups.flat(2)
  }, [ambitions, visibility, submissions]);
  const listTransition = useTransition(
    displayedAmbitions.map((ambition, index) => ({ambition, index})), {
    ref: listTransitionRef,
    key: ({ambition}) => ambition.id,
    config: {mass: 1, tension: 90, friction: 60, restVelocity: 0.2},
    enter: ({transform: 'translateY(0px)', opacity: 1}),
    //update: ({transform: 'translateY(0px)', opacity: 1}),
    from: ({transform: 'translateY(50px)', opacity: 0}),
    trail: 1250,
    expires: true
  });
  useEffect(() => {
    ref.roll = bounce;
    ref.listTransitionRef = listTransitionRef;
    ref.liquid = liquid
    ref.timeouts = [];
    nextPhase(phases.launchBall, ref);

    var current = ref.current;

    return () => {
      ref.timeouts.map(clearTimeout);
      ref.roll.stop();
      document.querySelector('#app').classList.remove('headerHiddenForced');
      document.querySelector('#app').classList.remove('footerHiddenForced');
      document.querySelector('#app').classList.remove('scrollbarHiddenForced');
      current.classList.remove(style.questioning)
      current.classList.remove(style.focused)
    }
  }, [])

  useEffect(() => {
    if (ref.started && !ambitions.isPlaceholder)
      ref.listTransitionRef.start()
  }, [displayedAmbitions])

  const ref = useRef();
  useEffect(() => {
    if (!chosenAmbition) return;
    const submission = findSubmission(submissions, 'ambitionQuestion', chosenAmbition.id, true)
    if (submission || !chosenAmbition.question || !chosenAmbition.question.title) {
      return route(`/ambitions/${getSlug(chosenAmbition)}`)
    }
    showQuestion(true);
  }, [chosenAmbition]);

  useEffect(() => {
    const ball = ref.current.querySelector('#ball');
    const line = ref.current.querySelector('#line');
    const hole = ref.current.querySelector('#hole');
    ref.ball = ball
    ref.line = line
    ref.hole = hole

    if (chosenAmbition) {
      const form = ref.current.parentNode.querySelector(`#question-form`);
      const target = ref.current.querySelector(`#ambition-${chosenAmbition.id}`);
      ref.target = target;
      ref.buttonTop = target.querySelector('.top')
      ref.buttonFront = target.querySelector('.front')
      ref.buttonBack = target.querySelector('.back')
      ref.form = form;
    }

    if (!isShowingQuestion) return;
    ref.windowHeight = window.innerHeight;
    ref.targetTop = ref.target.offsetTop + (ref.target.querySelector('.tagline') ? 35 : 0);
    ref.dialogTop = ref.form.offsetTop;
    ref.ballTop = ref.ball.parentNode.offsetTop;
    ref.ballTargetTop = ref.targetTop - ref.ballTop - 8
    ref.liquidTop =  - ref.dialogTop  - 4 + 30 + 33  
    ref.floateeTop = - ref.targetTop + 20

    nextPhase(phases.dropBall, ref);

  }, [isShowingQuestion]);


  const Question = useMemo(() => {
    if (isShowingQuestion)
      return <Ambitions.Question question={chosenAmbition.question} onComplete={onAnswer} delay={6000} />
  }, [isShowingQuestion]);

  useSorting(ref, onSort);

  return <Page id="ambitions" navigation={navigation} class={`${style.page}`}>
    <div class={style.wrapper} ref={ref}>
      <div class={style.hole}>
        <div class={style.line} id="line"></div>
        <Icon.DecorationsBlackHole id="hole" class={style.hole} />
        <Icon.DecorationsBall id="ball" class={style.ball} />
      </div>
      <h1 class={style.header}>I want to...</h1>
      <ul class={style.ambitions}>
        {listTransition((values, {ambition, index}) => {  
          const prev = displayedAmbitions[index - 1];
          const next = displayedAmbitions[index + 1];
          const isComplete = findSubmission(submissions, 'ambition', ambition.id);
          return <animated.li draggable={canManage && !isShowingQuestion} style={values} id={`ambition-${ambition.id}`} class={`${style.ambition} ${chosenAmbition && chosenAmbition.id == ambition.id && style.chosen} ${isComplete && style.complete} theme-${ambition.color} ${next && next.previousAmbitionId == ambition.id && style.dependee} ${matchSlug(ambition, ambitionId) && 'selected'}`}>
            <span class={'handle'} href={`/ambitions/${ambition.id}/move`}></span>
            <a href={`/ambitions/${getSlug(ambition)}`} onClick={(e) => {setChosenAmbition(ambition); e.preventDefault(); e.stopPropagation();}} class={style.link}>
              {visibility && !ambition.previousAmbitionId  && (!prev || prev.type !== ambition.type) && !ambition.isPlaceholder && <h2 class="tagline">{ambition.type}</h2>}
              <aside>
                {isComplete && <Icon.DecorationsCheckmark class={style.checkmark} />}
                <Ambitions.ButtonHole class={style.icon} id={`ambition-${ambition.id}-button`} />
              </aside>
              <h2 class={style.title}>{ambition.name}</h2>
              <p class={style.tagline}>{ambition.tagline}</p>
            </a>
          </animated.li>
        })}
      </ul>
    </div>
    {Question}
  </Page>
}
function nextPhase(phase, ref) {
  if (phase != ref.phase) {
    console.log(...console.row('rgb(156, 39, 176)', 'motion', phase.displayName || phase.name))
    ref.phase = phase
    return ref.phase(ref);
  }
}


const phases = {
  launchBall: (ref)  =>{
    ref.timeouts.push(setTimeout(() => {
      ref.started = true
      ref.listTransitionRef.start()
    }, 200))
 
    ref.roll.set({y: 20})
    // go up quickly
    ref.roll.start({y: -75, delay: 100, config: { friction: 15, tension: 40 }, 
      // go down slowly
      onChange: (e, c) => {
        if (ref.phase == phases.launchBall && e.value.y < -72) {
          nextPhase(phases.letBallFall, ref)
        }
      }
    })
  },

  letBallFall: (ref)  =>{
    ref.roll.start({y: 0, delay: 200, config: { friction: 5.35, tension: 2.58, velocity: -1 }, onChange: (e) => {
      if (ref.phase == phases.letBallFall && e.value.y > -20) {
        nextPhase(phases.restBall, ref)
      }
    }})
  },

  restBall: (ref) => {
    ref.roll.start({y: 0, config: { friction: 3.6, tension: 43.6 }});
  },

  dropBall: (ref) => {
    // reset layering
    ref.listTransitionRef.pause()
    ref.timeouts.push(setTimeout(() => {
      ref.target.style.opacity = 1;
      ref.target.style.transform = '';
    }, 100))
    document.querySelector('#app').classList.add('footerHiddenForced');
    document.querySelector('#app').classList.add('headerHiddenForced');
    document.querySelector('#app').classList.add('scrollbarHiddenForced');

    ref.hole.style.opacity = 0;
    ref.hole.style.transform = 'scale(1.5)';
    ref.line.style.opacity = 0;
    ref.target.scrollIntoViewCustom({
      block: 'end',
      behavior: 'smooth',
      offsetTop: 40,
      inline: 'nearest'
    });
    
    ref.roll.start({
      delay: 200,
      y: ref.ballTargetTop, 
      config: { mass: 2, tension: 7, velocity: 0, friction: 3, bounce: true, restVelocity: .075  },
      onRest: () => {
        ref.current.classList.add(style.questioning)
        ref.target.classList.add(style.chosen)
        ref.timeouts.push(setTimeout(() => {
          ref.current.classList.add(style.focused)
        }, 800))
        ref.current.parentNode.scrollIntoViewCustom({
          block: 'start',
          behavior: 'smooth',
          offsetTop: 0,
          inline: 'nearest'
        });
  
        ref.form.classList.add(ref.target.className.match(/theme-[a-z]+/)[0])
        nextPhase(phases.fillLiquid, ref);
      }
    })
  },

  fillLiquid: (ref) => {
    ref.liquid.start({ y: ref.liquidTop })
    ref.listTransitionRef.stop()
  },

  transitionAway: (ref) => {
    ref.liquid.start({y: ref.liquidTop - 200, config: config.molasses})
    ref.current.classList.add(style.answered);
  }
}


Ambitions.Liquid = ({children, className}) => {
  const ref = useRef();
  useEffect(() => {
    if (!ref.frames) ref.frames = [];
    var times = 0;
    ref.interval = setInterval(() => {
      while (true) {
        var frame = Math.floor(Math.random() * 4);
        if (!ref.frames.includes(frame)) {
          const el = ref.current.querySelector(`[frame="${frame + 1}"]`);
          ref.frames.push(frame);
          el.classList.add(style.current);
          el.style.transform = `scaleX(${Math.random() * 0.3 + 1.1}) scaleY(${Math.random() * 0.3 + 1})`
          break;
        }
      }
      if (ref.frames.length > 1) {
        var old = ref.frames.shift();
        const oldEl = ref.current.querySelector(`[frame="${old + 1}"]`)
        oldEl.classList.remove(style.current);
      }
    }, 2000)
    return () => {
      clearInterval(ref.interval);
    }
  }, [])

  return <div class={`${style.liquid} ${className}`} ref={ref}>
    <div class={`${style.mask}`}></div>
    <div class={`${style.frame}`} frame={1}></div>
    <div class={`${style.frame}`} frame={2}></div>
    <div class={`${style.frame}`} frame={3}></div>
    <div class={`${style.frame}`} frame={4}></div>
    {children}
  </div>
}

Ambitions.Question = ({ question, onComplete, className, delay, hideLiquid }) => {
  const onInput = (e) => {
    const value = e.target.value;
    setChosenIndex(e.target.getAttribute('index'));
    setTimeout(() => {
      onComplete(value)
    }, 500)
  }
  const questionTransition = useTransition([
    <div class={style.top}>
      {question.intro && <p class={style.intro}>{question.intro}</p>}
      {question.intro && <Icon.VignettesWave index="wave" />}
      <h2>{question.title}</h2>
    </div>
  ].filter(Boolean), {
    key: ({index}) => index,
    config: {mass: 1, tension: 90, friction: 60},
    enter: (item) => {
      if (item.props.index == 'wave') {
        return {transform: `translateY(0px) scale(1) rotateX(0deg)`, opacity: 1}
      } else {
        return {transform: `translateY(0px) scale(1) rotateY(0deg)`, opacity: 1}
      }
    },
    from: (item) => {
      if (item.props.index == 'wave') {
        return {transform: `translateY(50px) scale(2.7) rotateX(180deg)`, opacity: 0}
      } else {
        return {transform: `translateY(50px) scale(1.2) rotateY(5deg)`, opacity: 0}
      }
    },
    trail: 250,
    delay
  });

  const [chosenIndex, setChosenIndex] = useState();
  
  const listTransition = useTransition(question.options.map((option, index) => ({option, index})), {
    key: ({index}) => index,
    config: chosenIndex == null ? {mass: 1, tension: 90, friction: 60} : {mass: 1, tension: 60, friction: 60},
    update: (({index}) => {
      if (index == chosenIndex) {
        return ({transform: 'translateY(-20px) translateX(0) rotateZ(0deg) scale(2)', opacity: 1})
      } else {
        return ({transform: `translateY(${Math.random() * 40 + 20})  translateX(${Math.random() * - 40 - 70}px)  rotateZ(${Math.random() * 25 - 12.5}deg) scale(0.9)`, opacity: 0})
      }
    }),
    enter: ({transform: 'translateY(0px)  translateX(0px) rotateZ(0deg) scale(1)', opacity: 1}),
    from: () => ({transform: `translateY(100px)  translateX(0px) rotateZ(${Math.random() * 25 - 12.5}deg)  scale(1)`, opacity: 0}),
    trail: chosenIndex == null ? 250 : 50,
    delay: chosenIndex == null ? delay + 1000 : 0
  });
  

  return <form onInput={onInput} class={`${className} ${style.question}`} id={'question-form'}>
    {!hideLiquid && <Ambitions.Liquid />}
    <div class={style.form}>
      {questionTransition((values, item) => <animated.div style={values}>{item}</animated.div>)}
        <ul>
          {listTransition((values, {option, index}) => <>
            {index != 0 && <div class={style.flex}></div>}
            <animated.li style={values}>
              <label><input type="radio" index={index} name="submission[data]" value={option} /> {option}</label> 
            </animated.li>
          </>)}
        </ul>
    </div>
  </form>
}

Ambitions.ButtonHole = ({className, id}) => {
  return <>
    <div class={`${style.buttonHole} ${className}`} id={id}>
      <div class={style.clip}>
        <svg class={`top`} width="100%" height="100%" viewBox="0 0 90 90" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-miterlimit:10;">
          <g transform="translate(-900.389 -2608.25)">
            <g clip-path={`url(#${id}-z)`}>
              <path d="M945.552 2649.74v11.65" fill="none" stroke="var(--theme-secondary)" stroke-width="9.8750079"/>
              <path d="M916.079 2640.942c.031 8.942 13.257 16.167 29.532 16.148 16.279-.016 29.445-7.277 29.41-16.219-.032-8.937-13.257-16.163-29.532-16.148-16.28.02-29.442 7.277-29.41 16.219" fill="var(--theme-primary)" fill-rule="nonzero"/>
            </g>
          </g>
        </svg>
      </div>
      <svg class={`front`} width="100%" height="100%" viewBox="0 0 90 90" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-miterlimit:10;">
        <g transform="translate(-900.389 -2608.25)">
          <g>
            <path d="M982.914 2658.165c.046 11.333-16.65 20.537-37.283 20.562-20.638.025-37.404-9.141-37.446-20.475" fill="none" stroke="var(--theme-primary)" stroke-width="12.541676699999998"/>
          </g>
        </g>
      </svg>
      <svg class={`back`} width="100%" height="100%" viewBox="0 0 90 90" version="1.1" xmlns="http://www.w3.org/2000/svg" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-miterlimit:10;">
        <g transform="translate(-900.389 -2608.25)">
          <g>
            <ellipse cx="8.967" cy=".01" rx="4.925" ry="8.975" fill="none" stroke="var(--theme-secondary)" stroke-width="3.01" transform="matrix(.00488 4.16667 4.16667 -.00488 945.464 2620.848)"/>
          </g>
        </g>
      </svg>
    </div>
  </>
}