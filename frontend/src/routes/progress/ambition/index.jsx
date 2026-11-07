import { useEffect, useRef, useState, useCallback, useFetchedData, useMemo, useStore } from "/lib/hooks";
import { Icon, Page, Button } from '/components/index.jsx';
import { NotFound } from "/lib/exceptions";
import { Placeholder } from "/lib/request";
import { getSlug, matchSlug } from "/lib/slugs";
import { findSubmission } from "/lib/data";
import style from "./style.module.scss";
import { useTransition, config, animated, useSpring } from "@react-spring/web";
import Ambitions from "../ambitions";
import useSorting from "../../../components/grid/sortable";


export default function Ambition({ambitionId, goalId, success}) {
  const ambitions         = useStore('data.ambitions');
  const ambitionsLoading  = useStore('requests.ambitions.loading');
  const ambitionsError    = useStore('requests.ambitions.error');
  const submissions       = useStore('data.submissions');
  const canManage         = useStore('auth.canManage');
  const role              = useStore('auth.user.role');
  const ambition          = ambitions.find((a) => matchSlug(a, ambitionId)) 
                          || ((ambitionsLoading || success === 'ambition') && Placeholder())
                          || (() => { throw new NotFound('Ambition not found') })();

  const [chosenGoal, setChosenGoal] = useState();

  const navigation = useMemo(() => ({
    scrollSelector: '#goal-' + goalId,
    pageTheme: ambition.color,
    headerTheme: ambition.color,
    headerType: 'colorful',
    parentLink: '/ambitions',
    parentTitle: 'Choose another',
    parentAlwaysShow: true,
    actionTitle: canManage && <Icon.Add />,
    actionLink: canManage && `/ambitions/${ambition.id}/assignments/new`,
    manageLink: `/ambitions/${ambition.id}/edit`,
    title: ambition.name,
    titleNode: [],
    errors: [ambitionsError]
  }), [canManage, ambition, ambitionsError, chosenGoal, goalId]);
  
  const isAmbitionComplete = findSubmission(submissions, 'ambition', ambition.id, true)
  
  const [, roll] = useSpring(() => ({
    config: { mass: 1, tension: 11, friction: 50 },
    onChange: (e, controller) => {
      if (e.value.y < 0) {
        var pt = ref.pipeLength + e.value.y;
        var index = Math.floor(pt);
        
        var cx = ref.points[index * 2]
        var cy = ref.points[index * 2 + 1]
        var nx = ref.points[index * 2 + 2]
        var ny = ref.points[index * 2 + 3];
        var progress = pt % 1;
        var x = cx + (nx - cx) * progress
        var y = cy + (ny - cy) * progress
        if (ref.phase == phases.zoomBallIn && x < ref.pipeWidth / 2) {
          nextPhase(phases.stopBall, ref);
          x = ref.pipeWidth / 2
        } 
        ref.lastX = x - ref.ballX;
        ref.lastY = y - ref.ballY;

        
        if (e.value.y > -45) {
          nextPhase(phases.dropBall, ref)
        }
      } else {
        if (ref.maxY == null)
          ref.maxY = ref.lastY;
        ref.lastY = ref.maxY + e.value.y;

        if (ref.phase == phases.resumeBall) {
          nextPhase(phases.dropBall, ref)
        } else if (ref.phase == phases.dropBall && controller.springs.y.velocity > 0 && controller.springs.y.velocity < 0.15) {
          nextPhase(phases.bounceBall, ref)
        } else if ((ref.phase == phases.bounceBall) && Math.abs(controller.springs.y.velocity) < 0.03) {
          nextPhase(phases.bounceBallUp, ref)
        } else if ((ref.phase == phases.bounceBallUp) && Math.abs(controller.springs.y.velocity) < 0.03) {
          nextPhase(phases.suckBallIn, ref)
        } else if (ref.phase == phases.suckBallIn && Math.abs(e.value.y - ref.targetTop) < 30) {
          nextPhase(phases.consumeBall, ref)
        }
        
        phases.bounceBall(ref);
        
      }
      ref.ball.style.transform = `translateX(${ref.lastX}px) translateY(${ref.lastY}px)`
    },
    from: {
      y: 0
    }
  }))

  useEffect(() => {
    document.querySelector('#app').classList.remove('headerHiddenForced');
    document.querySelector('#app').classList.remove('footerHiddenForced');
    document.querySelector('#app').classList.remove('scrollbarHiddenForced');
    return () => {
      document.querySelector('#app').classList.remove('headerHiddenForced');
      document.querySelector('#app').classList.remove('footerHiddenForced');
      document.querySelector('#app').classList.remove('scrollbarHiddenForced');
    }
  }, [])

  const [, moveAssignmentRequest, moveAssignment] = useFetchedData('/', {
    method: 'post',
    immediate: false,
    onSuccess: () => {
      dispatch({type: 'fetchAmbitions'});
    }
  });

  const transition = useTransition(ambition.assignments.map((assignment, index) => ({assignment, index, selected: matchSlug(assignment.goal, goalId)})), {
    key: ({assignment}) => assignment.id,
    config: {mass: 1, tension: 180, friction: 60},
    enter: ({selected}) => selected ? ({transform: 'scale(1.15) translateY(0px) translateX(19px)', opacity: 1}) : ({transform: 'scale(1) translateY(0px) translateX(0px)', opacity: 1}),
    update: ({selected}) => selected ? ({transform: 'scale(1.15) translateY(0px) translateX(19px)', opacity: 1}) : ({transform: 'scale(1) translateY(0px) translateX(0px)', opacity: 1}),
    from: ({transform: 'scale(1) translateY(4px) translateX(50px)', opacity: 0}),
    delay: 200,
    trail: 150
  });


  useEffect(() => {
    if (!chosenGoal) return;
    ref.hole = ref.current.querySelector('#hole ');
    ref.ball = ref.current.querySelector('#ball');
    ref.ball.style.transform = '';
    ref.ball.classList.remove(style.consumed)
    ref.current.classList.remove(style.answered);
    ref.current.classList.remove(style.focused);
    ref.current.classList.remove(style.questioning);

    ref.pipe = ref.current.querySelector('.' + style.pipe);
    
    ref.ballX = ref.ball.parentNode.offsetLeft + 2;
    ref.ballY = ref.ball.parentNode.offsetTop - 3;

    ref.pipeTop = ref.pipe.offsetTop;
    ref.offsetY = 23 + Math.max(0, Math.floor((ref.pipeTop - ref.ball.parentNode.offsetTop))) //40 / scale;
    ref.pipeWidth = ref.pipe.offsetWidth;
    ref.pipeHeight = ref.pipe.offsetHeight;
    ref.pipeBottom = ref.pipeTop + ref.pipeHeight;
    ref.points = Ambition.Pipe.getPoints(ref.pipeWidth, ref.offsetY, ref.pipeTop, ref.pipeHeight);
    ref.pipeLength = ref.points.length / 2 - 1

    ref.callback = () => {
      document.querySelector('#app').classList.remove('headerHiddenForced');
      document.querySelector('#app').classList.remove('footerHiddenForced');
      document.querySelector('#app').classList.remove('scrollbarHiddenForced');
      route(`/ambitions/${ambitionId}/goals/${getSlug(chosenGoal)}`)
      setTimeout(() => setChosenGoal(), 500)
    }

    const submission = findSubmission(submissions, 'question', chosenGoal.id, true)
    const completion = findSubmission(submissions, 'goal', chosenGoal.id, true)
    if (completion || submission || !chosenGoal.question || !chosenGoal.question.title) {
      return ref.callback()
    }
    
    ref.target = ref.current.querySelector('#goal-' + chosenGoal.id);
    if (ref.targetHole)
      ref.targetHole.classList.remove(style.closed);
    ref.targetHole = ref.target.querySelector('.' + style.hole);
    ref.targetHoleOpening = ref.targetHole.querySelector('.' + style.opening);
    ref.roll = roll;
    ref.rollSpring = roll.current[0].springs.y;
    
    nextPhase(phases.launchBall, ref);
    var timeout = setTimeout(() => {
      nextPhase(phases.zoomBallIn, ref);
    }, 200)
    return () => {
      if (ref.current) {
        ref.current.classList.remove(style.answered);
        ref.current.classList.remove(style.questioning);
        ref.hole.style.opacity = '';
        ref.hole.style.transform = '';
      }
      ref.finished = null;
      clearTimeout(timeout);
      ref.maxY = null;
      ref.roll.stop()
    }
    
  }, [chosenGoal])

  const  onAnswer = (value) => {
    setTimeout(() => {
      dispatch('sendSubmission', {
        submission: {
          type: 'question',
          goalId: chosenGoal.id,
          ref: chosenGoal.id,
          data: value,
          isComplete: true
        }
      });
    }, 2000)

    if (ref.phase == phases.stopBall || ref.phase == phases.launchBall || ref.phase == phases.zoomBallIn)
      nextPhase(phases.resumeBall, ref);
    else
      ref.callback()
  }
  const ref = useRef();

  useEffect(() => {
    if (!goalId)
      setChosenGoal();
  }, [goalId])

  const Question = useMemo(() => {
    return chosenGoal && <Ambitions.Question hideLiquid={true} class={style.question} question={chosenGoal.question} onComplete={onAnswer} />
  }, [chosenGoal])

  const onSort = useCallback((href, index) => {
    moveAssignment({
      order: index
    }, href);
  }, []);

  useSorting(ref, onSort);

  const contingentAmbition = ambitions.find((a) => a.previousAmbitionId == ambition.id);

  const isGoalComplete = (goal) => {
    return findSubmission(submissions, 'goal', goal.id, true) 
        || success == 'goal-submission/' + goal.id;
  }

  useEffect(() => {
    const forward = ref.current.querySelector('.' + style.forward);
    if (!forward) return;

    const timeout = setTimeout(() => {
      forward.classList.add(style.visible)
    }, ambition.assignments.length * 150 + 200 + 150);

    return () => {
      forward.classList.remove(style.visible)
      clearTimeout(timeout);
    }
  }, [])

  const indicateIncorrectElement = (el, target) => {
    target.classList.add(style.right);
    el.classList.add(style.wrong);
    setTimeout(() => {
      target.classList.remove(style.right);
      el.classList.remove(style.wrong);
    }, 2000)
  }

  const unlockedIndex = null;

  const onNextAmbition = (e) => {
    if (!isAmbitionComplete) {
      indicateIncorrectElement(e.target.closest('.button'), ref.current.querySelector('.' + style.last + '.' + style.goal))

      e.preventDefault()
      e.stopPropagation();
    }
  } 

  const content = useMemo(() => <>
    <div class={style.wrapper} ref={ref}>
      <header class={`${style.ambition} ${isAmbitionComplete && style.complete}`}>
        <a href={canManage ? `/ambitions/${ambition.id}/edit` : ''}>
          <aside><div class={style.icon}>
            <Icon.DecorationsBall id="ball" class={style.ball} />
            <Ambitions.ButtonHole id="hole"  />
          </div></aside>
          <h1 class={style.title}>{ambition.name}</h1>
          {isAmbitionComplete && <p class={style.tagline}>Complete!</p>}
          {!isAmbitionComplete && <p class={style.tagline}>{ambition.description}</p>}
        </a>
        <Ambition.Pipe />
      </header>
      
      <ul class={style.goals}>
        {transition((values, {assignment, index}) => {
          const prev = ambition.assignments[index - 1];
          const next = ambition.assignments[index + 1];
          const isCompleting = success == 'goal-submission/' + assignment.goal.id;
          const isComplete = isGoalComplete(assignment.goal);
          const isRecommended = unlockedIndex == index;
          const isAllowed = !prev || isGoalComplete(prev.goal) || (unlockedIndex >= index) || !next;
          const isNext = success == 'goal-submission/' + assignment.goal.id
          const isLast = !next && isAllowed && contingentAmbition;
          const isCurrent = (unlockedIndex != null ? isRecommended : isAllowed && next) && !isComplete
          const onClick = (e) => {
            if (isAllowed || isComplete) {
              setChosenGoal(assignment.goal);
            } else {
              indicateIncorrectElement(e.target.closest('li'), ref.current.querySelector('.' + style.current))
            }
            e.preventDefault();
            e.stopPropagation();
          }
          /*
          if (isCompleting) {
            setTimeout(() => {
              if (!ref.current) return;
              var el = ref.current.querySelector('#goal-' + assignment.goal.id);
              el.classList.remove(style.completing);
            }, 10)
          } */
          return <animated.li draggable={canManage && !chosenGoal} style={values} id={'goal-' + assignment.goal.id} 
            class={`${style.goal} 
            ${!isAllowed && style.disabled} 
            ${isCurrent && style.current} 
            ${isRecommended && style.recommended}
            ${isNext && style.next}
            ${matchSlug(assignment.goal, goalId) && style.selected} 
            ${isCompleting && style.completing}
            ${isComplete && style.complete}
            ${isLast && style.last}`}>
            <span class={'handle'} href={`/ambitions/${ambition.id}/goals/${assignment.goal.id}/move`}></span>
            <a  onClick={onClick}  href={`/ambitions/${getSlug(ambition)}/goals/${getSlug(assignment.goal)}`} class={style.link}>
              {(isComplete || isCompleting) && <Icon name={'DecorationsCheckmark'} class={`${style.icon} ${style.hole} ${style.checkmark}`} />}
              {(!isComplete || isCompleting) && <Ambition.Hole />}
              <h3 class={style.title}>{assignment.goal.name}</h3>
              <p class={style.tagline}>{assignment.goal.tagline || 'Here goes tagline'}</p>
            </a>
          </animated.li>
        })}
      </ul>

      {contingentAmbition && <div class={`${style.forward} ${isAmbitionComplete && style.unlocked}`}>
        {ForkLeft}
        <Button.Link 
          href={`/ambitions/${getSlug(contingentAmbition)}`}
          icon={isAmbitionComplete ? 'ChevronRight' : 'Lock'} 
          onClick={onNextAmbition}
          class="transparent round icon-right">{contingentAmbition.name}</Button.Link>
      </div>}

    </div>
    {Question}
  </>, [ambition, chosenGoal, submissions, success, goalId])

  return <Page id="ambition" navigation={navigation} class={`${style.page}`}>
    {content}
  </Page>
}

function nextPhase(phase, ref) {
  if (phase != ref.phase) {
    console.log(...console.row('rgb(156, 39, 176)', 'motion', phase.displayName || phase.name))
  }
  ref.phase = phase
  return ref.phase(ref);
}

const ForkLeft = <svg class={style.forkLeft} viewBox="0 0 682 256" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-miterlimit="10">
  <path d="M66.102 196.572s-55.605 1.008-55.605-46.52" fill="none" stroke="var(--theme-primary)" stroke-width="2" stroke-dasharray="1,9"/>
</svg>

const phases = {
  launchBall(ref) {
    // hide hole
    ref.hole.style.opacity = 0;
    ref.hole.style.transform = 'scale(1.5)';
  
    // get the ball rolling
    ref.targetTop = ref.target.offsetTop - ref.pipe.offsetTop - ref.pipe.offsetHeight + 15;
    ref.roll.set({ y: - ref.pipeLength})
    ref.roll.start({y: 150,  config: { mass: 2, tension: 3, friction: 10 }, delay: 100})
    ref.pipe.scrollIntoViewCustom({
      block: 'start',
      behavior: 'smooth',
      offsetTop: -80,
      inline: 'nearest'
    });
  },

  zoomBallIn(ref) {
    ref.current.style.transformOrigin = '50% ' + (ref.pipeBottom + 40) + 'px'
    ref.current.classList.add(style.questioning);
    ref.timeout = setTimeout(() => {
      ref.current.classList.add(style.focused);
    }, 800)
    document.querySelector('#app').classList.add('headerHiddenForced');
    document.querySelector('#app').classList.add('footerHiddenForced');
    document.querySelector('#app').classList.add('scrollbarHiddenForced');
  },

  stopBall(ref) {
    ref.roll.pause();
  },

  resumeBall(ref) {
    ref.current.classList.add(style.answered); 
    ref.current.classList.remove(style.questioning);
    ref.current.classList.remove(style.focused);

      
    ref.roll.resume()
    
  },

  dropBall(ref) {
    // fall quicker after pipe
    ref.roll.start({
      y: ref.targetTop, 
      config: { 
        mass: 1 + Math.min(3, Math.max(0, ref.targetTop - ref.pipeBottom ) / 100), 
        tension: 12, 
        friction: ref.targetTop - ref.pipeBottom < 200 ? 2 : 4, 
        bounce: true
    }})
    for (var p = ref.target; p = p.previousElementSibling;) {
      p.classList.add(style.previous)
    }
  },

  suckBallIn(ref) {
    ref.roll.start({
      y: ref.targetTop + 100, 
      delay: 100, 
      config: { 
        mass: 3, 
        tension: 16, 
        friction: 4, 
        bounce: false
    }})
  },


  bounceBall(ref) {
    const currentY = ref.rollSpring.animation.values[0]._value;
    const diff = Math.abs(currentY - ref.targetTop);
    ref.targetHoleOpening.style.transform = `scale(${1 + (15 - Math.min(15, diff)) / 15 / 2} )`
    ref.targetHole.style.transform = `scale(${1 + (20 - Math.min(20, diff)) / 20 / 8} )`
    ref.targetHole.style.filter = `brightness(${(1 + (30 - Math.min(30, diff)) / 30 / 4) * 100}%)`;
  },

  bounceBallUp(ref) {},

  consumeBall(ref) {
    ref.targetHole.classList.add(style.open);

    setTimeout(() => {
      ref.ball.classList.add(style.consumed)
    }, 200)
    
    setTimeout(() => {
      for (var p = ref.target; p = p.previousElementSibling;) {
        p.classList.remove(style.previous)
      }
      ref.targetHole.classList.add(style.closed);
      
      ref.callback()
    }, 500);
  }
}
export function arc(x, y, start, end, radius, pointsInArc)
{
    pointsInArc = pointsInArc || 5
    const points = []
    let angle = start
    const interval = (end - start) / pointsInArc
    for (let count = 0; count < pointsInArc; count++)
    {
        points.push(x + radius * Math.cos(angle), y + radius * Math.sin(angle))
        angle += interval
    }
    return points
}

Ambition.Pipe = ({className}) => {
  return <div class={`${style.pipe} ${className}`} id="pipe">
    <div class={style.background}></div>
  </div>;
}

Ambition.Pipe.getPoints = (width, offsetY, top, height) => {

  
  const points = []
  var radius1 = 25;
  var radius2 = 35;

  var x = width;
  for (var y = -10; y < offsetY; y++) {
    points.push(x, y);
  }
  points.push(...arc(x - radius1, y ,  0, Math.PI / 2, radius1, 50));
  x = points[points.length - 2];
  y = points[points.length - 1];
  for (; x > radius2; x-- ) {
    points.push(x, y);
  }
  points.push(...arc(x, y + radius2,  - Math.PI / 2, - Math.PI, radius2, 50));
  x = points[points.length - 2];
  y = points[points.length - 1];
  for (; y < top + height - 25; y++) {
    points.push(x, y);
  }
  return points;
}

Ambition.Hole = ({className}) => {
  return <svg viewBox="0 0 91 90" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-miterlimit="10" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linecap:round;stroke-miterlimit:10;"  class={`${style.icon} ${style.hole} ${className}`}>
    <g opacity=".5" transform="matrix(1.01111 0 0 1 -5321.48 -2583)">
      <path d="M5270.511 2629.304c.047 11.333 16.627 20.501 37.038 20.477 20.407-.028 36.916-9.231 36.879-20.564-.046-11.334-16.631-20.502-37.038-20.477-20.41.028-36.916 9.23-36.879 20.564" fill="var(--theme-primary)" fill-rule="nonzero"/>
      <ellipse cx="8.968" cy=".01" rx="4.925" ry="8.975" fill="none" stroke="var(--theme-primary)" stroke-width="3.01" transform="matrix(.00482 4.16667 4.12088 -.00487 5307.386 2591.9)"/>
    </g>
    <path d="M31.316 51.87c.017 4.134 6.132 7.478 13.654 7.47 7.525-.013 13.605-3.37 13.596-7.498-.017-4.134-6.133-7.477-13.659-7.47-7.52.013-13.604 3.37-13.59 7.499" fill="var(--theme-background)" fill-rule="nonzero" class={style.opening}/>
    <path d="M0-4.941C.01-2.221-3.996-.012-8.949-.006-13.901 0-17.925-2.2-17.936-4.92" fill="none" stroke="var(--theme-primary)" stroke-width="1.4" transform="matrix(4.16666 0 0 4.16667 82.327 66.802)"/>
  </svg>
}