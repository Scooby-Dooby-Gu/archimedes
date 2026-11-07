import { useDebouncedMemo, useFetchedData, useCallback, useEffect, useFormData, useMemo, useStore } from "/lib/hooks";
import { Grid, Icon, Page } from '/components/index.jsx';
import { getLessonById, findSubmission, findSubmissionForTask } from "/lib/data";
import { NotFound } from "/lib/exceptions";
import { Placeholder } from "/lib/request";
import * as formatters from '/lib/formatters';
import { getSlug, matchSlug } from "/lib/slugs";
import { Button, Form, Img, LocalizedDate } from "/components/index.jsx";
import { markHTML } from "/lib/mark";
import { useRef, useState } from "preact/hooks";
import style from './style.module.scss';
import Ambition from "../ambition";
import Ambitions from "../ambitions";
import { useSpring, useTransition, animated } from "react-spring";
import useSorting from "../../../components/grid/sortable";
import { parseYoutubeVideoID, useYoutube } from "../../../components/youtube";



export default function Goal({ambitionId, goalId, taskId, success, fromLesson}) {
  const canManage         = useStore('auth.canManage');
  const user              = useStore('auth.user');
  const ambitions         = useStore('data.ambitions');
  const submissions       = useStore('data.submissions');
  const ambitionsLoading  = useStore('requests.ambitions.loading');
  const ambitionsError    = useStore('requests.ambitions.error');
  const unlocks           = useStore('app.unlocks');

  const youtubeParent             = useRef();
  const youtube = useYoutube(youtubeParent, {
    onReady: () => {
      youtube.current.classList.add(style.ready);
    },
    onStart: () => {
      youtube.current.classList.remove(style.paused)
      youtube.current.classList.add(style.playing);
      document.querySelector('#app').classList.add('footerHiddenForced');
      document.querySelector('#app').classList.add('headerHiddenForced');
      
    },
    onStop: () => {
      document.querySelector('#app').classList.remove('footerHiddenForced');
      document.querySelector('#app').classList.remove('headerHiddenForced');
      youtube.current.classList.add(style.paused)
    }
  });
  

  const ambition          = ambitions.find((a) => matchSlug(a, ambitionId)) 
                        || ((ambitionsLoading || success == 'ambition' || success == 'goal') && Placeholder())
                        || (() => { throw new NotFound('Ambition not found') })();
  const assignment      = ambition.assignments.find((a) => matchSlug(a.goal, goalId))
                        || ((ambitionsLoading || success == 'ambition' || success == 'goal') && Placeholder())
                        || (() => { throw new NotFound('Goal not found') })();
  const { goal }        = assignment;

  const nextAssignment = ambition.assignments.find((a) => a.order > assignment.order);
  const requiredTasks = goal.tasks.filter((t) => t.visibility == 'suggested');
  const uncompleteTasks = requiredTasks.filter((t) => !findSubmissionForTask(submissions, t, true))
  const isGoalReady = uncompleteTasks.length == 0;
  const isGoalComplete = findSubmission(submissions, 'goal', goal.id, true);

  const [completing, setCompleting] = useState(false);

  const isExam = !nextAssignment;
  const isLocked = isExam && !isGoalReady;

  const [, moveTaskRequest, moveTask] = useFetchedData('/', {
    method: 'post',
    immediate: false,
    onSuccess: () => {
      dispatch({type: 'fetchAmbitions'});
    }
  });
  const onSort = useCallback(canManage ? (url, index) => {
    moveTask({
      order: index
    }, url);
  } : null, []);

  useEffect(() => {
    const youtubeTask = goal.tasks.find((t) => t.type == 'youtube')
    if (youtubeTask) {
      youtube.load();
    }
  }, [goal.tasks])


  
  const onTaskClick = function(task, submission, url = task.url, target) {
    if (task.type != 'lesson' && task.type != 'video') {
      const taskElement = target.closest('.' + style.task);
      taskElement.classList.add('loading');
      setTimeout(() => {
        taskElement.classList.remove('loading');
      }, 3000);
    }
    const callback = () => {
      if (task.type == 'youtube') {
        youtube.load(task.url, { autoplay: 1, playsinline: 1});
        // Add the element to the DOM
      } else if (url.includes('//') && !url.includes(location.origin)) {
        var link = document.createElement('a');
        // Add the element to the DOM
        document.body.appendChild(link);
        link.href = url;
        link.click();
        requestAnimationFrame(() => link.remove())
      } else {
        route('/ambitions/' + getSlug(ambition) + '/goals/' + getSlug(goal) + task.url)
      }
    }
    const promise = dispatch('sendSubmission', {
      submission: submission || {
        type: task.type,
        ref: task.lessonId || task.videoId || task.url,
        videoId: task.videoId,
        lessonId: task.lessonId,
        isComplete: task.type != 'lesson' ? true : undefined
      }
    });
    if (task.url.includes('//') && task.type != 'youtube' && !task.url.includes(location.origin)) {
      promise.then(callback)
    } else {
      callback()
    } 

    
  }

  const [, roll] = useSpring(() => ({
    config: { mass: 1, tension: 8, friction: 2.8, restVelocity: 0.1, bounce: true},
    onChange: (e, controller) => {
      if (!ref.ball) return;
      if (e.value.y < 0) {
        var pt = ref.pipeLength + e.value.y;
        var index = Math.floor(pt);
        
        var cx = ref.points[index * 2]
        var cy = ref.points[index * 2 + 1]
        var nx = ref.points[index * 2 + 2]
        var ny = ref.points[index * 2 + 3];
        var progress = pt % 1;
        var x = cx + (nx - cx) * progress - ref.ballX
        var y = cy + (ny - cy) * progress - ref.ballY - ref.notchY
        ref.lastX = x ;
        ref.lastY = y;

        if (ref.phase == phases.showBall) {
          const threshold = 20;
          const diff = Math.min(20, Math.min(threshold, - e.value.y));
          ref.holeTop.style.transform = `translateY(${threshold - diff}px)`;
          ref.holeFront.style.transform = `scale(${1 + (threshold - diff) / 16 / 16})`;
          ref.holeBack.style.transform = `scale(${1 + (threshold - diff) / 16 / 16})`;
          ref.holeFront.style.filter = `brightness(${(1 + (diff - threshold) / 16 / 4) * 100}%)`;
          ref.holeBack.style.filter = `brightness(${(1 + (diff - threshold) / 16 / 4) * 100}%)`;
        }
        /*
        if (e.value.y > -45) {
          nextPhase(phases.dropBall, ref)
        } */
      } else {
          
        var y = e.value.y;
        var x = 0;
        if (!ref.frame) ref.frame = 0
        x += Math.cos(y / 10) * 5 * ref.frame / 5;

        if (ref.rocky && ref.frame < 5) {
          ref.frame++;
        } else if (ref.frame > 0) {
          ref.frame--;
        }

        if (ref.phase == phases.launchBall) {
          ref.content.scrollTop = y - 100;
        }
      }
      ref.ball.style.transform = `translateX(${x}px) translateY(${y}px)`
    },
    from: {
      y: 0
    }
  }))

  const [, liquid] = useSpring(() => ({
    config: { mass: 1, tension: 5, friction: 2.3 },
    onChange: (e) => {
      if (ref.dialog) {
        /*
        const difference = ref.targetTop - (ref.dialogTop + e.value.y) + 50;
        if (difference > 0 && !ref.floating) {
          ref.floating = true;
          floatee.start({y: ref.floateeTop} )
        } */
        ref.dialog.style.transform = `translateY(${e.value.y}px)`
      }
    },
    from: {
      y: 0
    }
  }))


  const onConfirm = (e) => {
    dispatch('sendSubmission', {
      submission: {
        type: 'goal',
        goalId: goal.id,
        ref: goal.id,
        isSkipped: !isGoalReady,
        isComplete: true
      }
    }).then(() => {
      route(`/ambitions/${ambitionId}/?success=goal-submission/` + goal.id);
    })

    const isGoalComplete = (g) => {
      return g.id == goal.id || findSubmission(submissions, 'goal', g.id, true);
    }
    const lastAmbitionAssignment = ambition.assignments[ambition.assignments.length - 1];
    const isAmbitionComplete = isGoalComplete(lastAmbitionAssignment.goal)
    if (isAmbitionComplete) {
      dispatch('sendSubmission', {
        submission: {
          type: 'ambition',
          ambitionId: ambition.id,
          ref: ambition.id,
          isSkipped: !ambition.assignments.every((a) => isGoalComplete(a.goal)),
          isComplete: true
        }
      });
    }
  }

  const originLesson = fromLesson || (success && success.split('lesson-submission/')[1]) || null;
  const navigation = useMemo(() => ({
    title: goal.name,
    titleNode: [],
    headerType: 'dark',
    headerTheme: ambition.color,
    pageTheme: ambition.color,
    scrollSelector: originLesson ? `[id="task/lesson/${originLesson}"]` : undefined,
    scrollPosition: 'start' ,
    scrollBehavior: originLesson ? 'instant' : undefined,
    scrollDelay: 50,
    parentLink: completing ? null : `/ambitions/${ambitionId}`,
    parentTitle: completing ? 'No, I am not done yet' : ambition.name,
    parentHandler: completing ? () => setCompleting(false) : null,
    manageLink: `/ambitions/${ambitionId}/assignments/${assignment.id}/edit`,
    actionTitle: canManage && <Icon.Add />,
    actionLink: `/ambitions/${ambitionId}/goals/${goal.id}/tasks/new`,
    errors: [ambitionsError]
  }), [originLesson, goal, ambition, assignment, canManage, ambitionsError, completing]);


  useEffect(() => {
    new Image().src = new URL('../../../assets/images/liquid/1.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/2.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/3.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/4.png', import.meta.url).href;
    new Image().src = new URL('../../../assets/images/liquid/mask.png', import.meta.url).href;
  }, [])


  const ref = useRef();

  useEffect(() => {
    if (isGoalComplete) return;
    ref.liquid = liquid;
    ref.hole = ref.current.querySelector('.' + style.hole)
    ref.holeFront = ref.hole.querySelector('.front')
    ref.holeBack = ref.hole.querySelector('.back')
    ref.holeTop = ref.hole.querySelector('.top')
    ref.ball = ref.current.querySelector('#ball')
    ref.ballX = ref.ball.parentNode.offsetLeft - 1;
    ref.ballY = ref.ball.parentNode.offsetTop + 93;
    ref.pipe = ref.current.closest('[route]').querySelector('#pipe')
    ref.box = ref.current.querySelector('.' + style.completion);
    ref.dialog = ref.box.querySelector('.' + style.dialog);
    ref.button = ref.box.querySelector('.' + style.button);
    ref.afterword = ref.box.querySelector('.' + style.afterword);
    ref.confirmation = ref.box.querySelector('.' + style.confirmation);
    ref.roll = roll;
    ref.content = ref.current.closest('[class*="content"]');
    ref.box.classList.remove(style.engaged);
    ref.box.classList.remove(style.expanded);

    ref.offsetY = Math.max(0, Math.floor((ref.pipe.offsetTop - ref.ball.parentNode.offsetTop))) //40 / scale;
    ref.pipeWidth = ref.pipe.offsetWidth;
    ref.pipeHeight = ref.pipe.offsetHeight -24;
    ref.pipeTop = ref.pipe.offsetTop + ref.pipe.offsetParent.offsetTop + 40;
    ref.pipeBottom = ref.pipeTop + ref.pipeHeight;
    ref.points = Ambition.Pipe.getPoints(ref.pipeWidth, ref.pipeTop, ref.pipeTop, ref.pipeHeight);
    ref.pipeLength = ref.points.length / 2 - 1

    nextPhase(phases.showBall, ref);
    requestAnimationFrame(() => {
      ref.notchY = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
    })
    return () => {
      ref.holeBack.style.transform = '';
      ref.holeFront.style.transform = '';
      ref.holeTop.style.transform = '';
      ref.holeFront.style.filter = '';
      ref.holeBack.style.filter = '';
    }
  }, [goalId])

  function getOffsetTop(element) {
    var top = 0;
    for (var p = element; p && p != ref.current; p = p.offsetParent || p.parentElement) {
      top += p.offsetTop || 0;
    }
    return top;
  }

  useEffect(() => {
    return () => {
      document.querySelector('#app').classList.remove('scrollbarHiddenForced');
      document.querySelector('#app').classList.remove('headerHiddenForced');
      document.querySelector('#app').classList.remove('footerHiddenForced');
    }
  }, []);

  useEffect(() => {
    if (!completing) return;
    ref.tasks = ref.current.querySelectorAll('.' + style.task);
    ref.regions = []
    ref.buttonTop = getOffsetTop(ref.button);
    ref.ballTop = getOffsetTop(ref.ball)// + ref.ball.parentNode.offsetParent.offsetTop
    ref.setCompleting = setCompleting;

    for (var region of ref.tasks) {
      ref.regions.push({
        element: region, 
        offsetTop: getOffsetTop(region.querySelector('.' + style.icon)), 
        offsetHeight: region.offsetHeight, 
        isComplete: region.classList.contains(style.complete),
        isSupplementary: region.classList.contains(style.supplementary)
      })
    }
    nextPhase(phases.launchBall, ref);

    var current = ref.current;
    return () => {
      var regions = ref.regions;
      setTimeout(() => {
        for (var region of regions) {
          region.element.classList.remove(style.accepted);
          region.element.classList.remove(style.rejected);
          region.element.classList.remove(style.skipped);
        }
      }, 10)
      ref.ball.classList.remove(style.appeared);
      current.classList.remove(style.ready);
      current.classList.remove(style.questioning);
      current.classList.remove(style.focused);
      ref.box.classList.remove(style.expanded);
      ref.box.classList.remove(style.displayed);
      ref.ball.classList.remove(style.appeared);
      ref.hole.classList.remove(style.open)
      ref.liquid.set({y: 0});
      ref.roll.set({y: 0});
      nextPhase(phases.showBall, ref);
    }
  }, [completing])


  const ambitionsSubmissions = submissions
    .filter((s) => s.type == 'ambition')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const goalIndex = ambition.assignments.map((a, index) => {
    return a.goal.id == goal.id && index;
  }).filter((a) => a !== false)[0];

  useSorting(ref, onSort);

  const isConsideredComplete = (task) => {
    const isCompleting = success == 'lesson-submission/' + task.lessonId;
    return isCompleting || findSubmissionForTask(submissions, task, true);
  }

  const renderedTasks = useMemo(() => {
    return goal.tasks.map((task, index) => {
      const prev = goal.tasks[index - 1];
      const isCompleting = success == 'lesson-submission/' + task.lessonId;
      const isComplete = isConsideredComplete(task);
      const slug = (task.url.match(/\/(?:lessons|videos)\/([^/]+)/) || [,0])[1]
      const isSelected = slug && slug == taskId;
      const bonusMaterials = (!prev || prev.visibility !== task.visibility) && task.visibility != 'suggested' &&  !task.isPlaceholder;

      return [

        index == 4 && goalIndex == 0 && <li class={`${style.task} ${style.reward} ${unlocks.game && style.unlocked}`}>
        <div class={style.icon}>
          <Icon name="Games" class={style.mini} />
        </div>
        <a href="/games/paper-chase/" disabled={!unlocks.game}>
          <h2 class={style.title}>Reward: Paper Chase </h2>
          <p class={style.tagline}>{unlocks.game ? 'Unlocked!' : 'Complete 3 lessons'}</p>
          <p class={style.tagline}>Practice for the real-world. Play the game to experience a lifetime of investing.</p>
          {unlocks.game && <Button.Span class={`${style.button} icon-right round transparent`} icon="ChevronRight">Play Paper Chase</Button.Span>}
        </a>
        </li>,

        bonusMaterials && goalIndex == 1 && <li class={`${style.task} ${style.reward} ${unlocks.videos && style.unlocked}`}>
          <div class={style.icon}>
            <Icon name="Video" class={style.mini} />
          </div>
          <a href="/videos" disabled={!unlocks.videos}>
            <h2 class={style.title}>Reward: Investing Experts</h2>
            <p class={style.tagline}>{unlocks.videos ? 'Unlocked!' : 'Complete 2 goals'}</p>
            <p class={style.tagline}>Learn from top industry experts! Watch videos covering topics and questions provided by folks like you</p>
            {unlocks.videos && <Button.Span class={`${style.button} icon-right round transparent`} icon="ChevronRight">Watch videos</Button.Span>}
          </a>
        </li>,

        bonusMaterials && goalIndex == 2 && <li class={`${style.task} ${style.reward} ${unlocks.videos && style.unlocked}`}>
        <div class={style.icon}>
          <Icon name="Love" class={style.mini} />
        </div>
        <a href={`/users/${user.id}/friends/new?from=${location.pathname}`}>
          <h2 class={style.title}>Sharing is empowering</h2>
          <p class={style.tagline}>Knowledge is power. Your friends can join you on this journey to uncover their life's goals by learning to make investing a bigger part of their lives. Invite them now!</p>
          <Button.Span class={`${style.button} icon-right round transparent`} icon="ChevronRight">Invite friends</Button.Span>
        </a>
        </li>,

        bonusMaterials && goalIndex == ambition.assignments.length - 1 && <li class={`${style.task} ${style.reward} ${unlocks.courses && style.unlocked}`}>
        <div class={style.icon}>
          <Icon name="Explore" class={style.mini} />
        </div>
        <a href="/courses" disabled={!unlocks.courses}>
          <h2 class={style.title}>Reward: Free roam</h2>
          <p class={style.tagline}>{unlocks.courses ? 'Unlocked!' : 'Complete last goal'}</p>
          <p class={style.tagline}>Journey as a free-spirited learner. Explore through the lessons however you want.</p>
          {unlocks.courses && <Button.Span class={`${style.button} icon-right round transparent`} icon="ChevronRight">Explore courses</Button.Span>}
        </a>
        </li>,

        bonusMaterials && <h2 class={`${style.bonus} tagline`}>{ForkLeft} {ForkRight} {'Bonus materials'}</h2>,
        
        <li draggable={canManage && !completing} id={`task-${task.id}`} 
          class={`${style.task} 
          ${isComplete && style.complete} 
          ${isCompleting && style.completing} 
          ${isSelected && style.selected} 
          ${task.visibility != 'suggested' && style.supplementary}`}>
          
          <span class={'handle'} href={`/ambitions/${ambition.id}/goals/${goal.id}/tasks/${task.id}/move`} id={`task/${task.type}/${task.lessonId || task.videoId}`}></span>
          <div class={`${style.content} ${task.promoCta && style.withPromo}`}>
            <a class={style.link} href={'#'} onClick={(e) => {  e.preventDefault(); e.stopPropagation(); onTaskClick(task, undefined, undefined, e.target);}}>
              <div class={style.icon}>
                {(!isComplete || isCompleting) && !task.isPlaceholder && <Icon name={task.type} class={style.mini} />}
                {(isComplete || isCompleting) && <Icon name={'DecorationsCheckmark'} class={`${style.icon} ${style.plate} ${style.checkmark}`} />}
                {(!isComplete || isCompleting) && <Ambition.Hole class={style.plate} />}
              </div>
              <h2 class={style.title}>
                {prev && originLesson && prev.lessonId == originLesson && isConsideredComplete(prev) && !isConsideredComplete(task) && <span class={style.next}><em>Next: </em></span>}
                {task.name}
              </h2>
              <p class={style.tagline}>{task.description}</p>
            </a>
            {task.promoCta && !task.isPlaceholder && <div class={`${style.promo} ${!task.promoImage && style.simplified}`}>
              <Img src={task.promoImage} srcset={task.promoImageSizes} />
              <Button.Link icon="ChevronRight" class="icon-right round transparent" href={task.promoUrl} onClick={(e) => { onTaskClick(task, {
                type: 'promo',
                ref: task.id,
                taskId: task.id
              }, task.promoUrl, e.target); e.preventDefault(); e.stopPropagation();}}>{task.promoCta}</Button.Link>
            </div>}

            {canManage &&<a class={style.edit} href={`/ambitions/${ambition.id}/goals/${goal.id}/tasks/${task.id}/edit`}>Edit task</a>}
            
          </div>
        </li>
      ]
    }).flat(2).filter(Boolean)
  }, [goal, submissions, completing, taskId, unlocks]);

  
  const transition = useTransition(renderedTasks.map((task, index) => ({task, index})), {
    key: ({index}) => index,
    config: {mass: 1, tension: 120, friction: 25, precision: .005},
    enter: ({selected}) => selected ? ({transform: 'translateX(0px) scale(1) translateY(20px)', opacity: 1}) : ({transform: 'translateX(0px) scale(1) translateX(0px)', opacity: 1}),
    from: ({transform: 'translateX(100px) scale(1.5) translateY(150px)', opacity: 0}),
    delay: originLesson ? 0 :  1500,
    trail: originLesson ? 0 :  350,
    immediate: !!originLesson
  });


  const content = useMemo(() => <>
    <div class={style.path} ref={ref}>
      <section class={style.content}>
        <Ambition.Pipe class={style.pipe} />
        <div class={`${style.goal} ${isGoalComplete && style.complete}`}>
          {goal.image && <Img src={goal.image} srcset={goal.imageSies} class="cover" />}
          <a href={`/ambitions/${ambitionId}/goals/${getSlug(assignment.goal)}`} class={style.link}>
            <div class={style.hole}>
              <Icon.DecorationsBall  class={`${style.ball}`} id="ball" />
              <Ambitions.ButtonHole id="hole"  class={`${style.icon} ${style.open}`}  />
            </div>
            <a class={style.link} href={canManage ? `/ambitions/${ambitionId}/assignments/${assignment.id}/edit` : ''}><h3 class={style.title}>{assignment.goal.name}</h3></a>
            {isGoalComplete && <p class={style.tagline}>Complete!</p>}
            {!isGoalComplete && <p class={style.tagline}>{formatters.markdown(assignment.goal.description)}</p>}
          </a>
        </div>
        <div class={style.youtube} ref={youtubeParent}></div>
        <ul class={style.tasks}>
          {transition((values, {task, index}) => {
            return <animated.li style={values} {...task.props} />
          })}
        </ul>
      </section>
      {!isGoalComplete && <section class={style.completion}>
        <Button onClick={() => setCompleting(true)} disabled={isLocked} icon={isLocked ? 'Lock' : null} class={`round transparent themed wide ${style.button}`}>
          {isLocked ? `${uncompleteTasks.length} tests left to complete` : 'Mark goal completed'}
        </Button>
        <div class={style.dialog}>
          {completing && <Ambitions.Liquid class={style.liquid} />}
          <div class={`${style.afterword}`}>
            <div class={` content article chapter`}>
             {goal.afterwordHtml ? formatters.html(markHTML(goal.afterwordHtml, {}, [])) : 'Are your ready to move on?'}
            </div>
            <Button class={`${style.confirmation} round transparent themed wide ${style.button}`} onClick={onConfirm}>{goal.cta || 'I am ready to move on'}</Button>
          </div>
        </div>
      </section>}
    </div>
  </>, [renderedTasks])
  return <Page id="goal" navigation={navigation} class={`${style.page} theme-${ambition.color}`}>
    {content}
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
  showBall(ref) {
    ref.roll.set({ y: - ref.pipeLength - 20})
    setTimeout(() => {
      ref.roll.start({y:0})
      setTimeout(() => {

        ref.ball.classList.add(style.appeared);
      }, 150)
    }, 500)
    /*setTimeout(() => {
      ref.ball.classList.remove(style.appeared);
      setTimeout(() => {
        ref.roll.start({y: 0})
        setTimeout(() => {
          ref.ball.classList.add(style.appeared);
        }, 300)
        ref.hole.classList.remove(style.open)
      }, 500)
    }, 200)*/
  },

  async launchBall(ref) {
    document.querySelector('#app').classList.add('footerHiddenForced');
    document.querySelector('#app').classList.add('headerHiddenForced');

    ref.ball.parentNode.scrollIntoViewCustom({
      behavior: 'smooth',
      block: 'start',
      offsetTop: -150,
    })
    
    ref.current.classList.add(style.completing);
    ref.hole.classList.add(style.hidden);
  
    ref.roll.start({
      config: { restVelocity: 0.01 },
      to: async (next) => {
        var lastRegion = { isComplete: false }
        ref.current.classList.add(style.ready);
        
        for (let region of ref.regions) {
          await next({
            y: region.offsetTop - ref.ballTop - 5,
            delay: ref.regions[0] == region ? 800 : 0, 

            config: { 
              mass: 1, 
              bounce: false,
              tension: lastRegion.isComplete ? 23 : 8, 
              friction: lastRegion.isComplete ? 7 : 5, 
              velocity: 0, 
              precision: 2,
              restVelocity: 0.5},
            onStart: () => {
              ref.rocky = !lastRegion.isComplete
            },
            onChange: (e) => {
              if (Math.abs(e.value.y - (region.offsetTop - ref.ballTop )) < 30) {
                if (!region.isComplete && !region.isSupplementary && !region.element.classList.contains(style.rejected)) {
                  region.element.classList.add(style.rejected);
                }
                if (!region.isComplete && region.isSupplementary && !region.element.classList.contains(style.skipped)) {
                  region.element.classList.add(style.skipped);
                }
                if (region.isComplete && !region.element.classList.contains(style.accepted)) {
                  region.element.classList.add(style.accepted);
                }
              }
            },
          });
          lastRegion = region;
        }
        await next({y: ref.buttonTop  - ref.ballTop, config: {
          bounce: false,
        }, onRest: () => {
          nextPhase(phases.expandBox, ref);

        }})
        ref.rocky = false;
      },
    })
    document.querySelector('#app').classList.add('scrollbarHiddenForced');
  },

  expandBox(ref) {
    ref.liquidTop = -window.innerHeight + 56 + 170;
    ref.liquid.start({y: ref.liquidTop})
    
    ref.roll.start({
      config: { 
        tension: 3, 
        friction: 3.1, 
        velocity: 0, 
        restVelocity: 0.05, 
        precision: .1,
        bounce: false, }, 
      delay: 200,
      y: ref.buttonTop  - ref.ballTop + ref.liquidTop + ref.confirmation.offsetTop + ref.afterword.offsetTop + 2,
      onRest:() => {
        nextPhase(phases.showDialog, ref);
      }
    })
    ref.current.classList.add(style.questioning);
    ref.current.classList.remove(style.completing);
    ref.box.classList.add(style.expanded);
  },

  showDialog(ref) {
    ref.current.classList.add(style.focused);
    ref.box.classList.add(style.displayed);
    setTimeout(() => {
      document.querySelector('#app').classList.remove('headerHiddenForced');
      document.querySelector('#app').classList.remove('headerHidden');
    }, 2000)
  }
}

const ForkLeft = <svg class={style.forkLeft} viewBox="0 0 682 256" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-miterlimit="10">
<path d="M66.102 196.572s-55.605 1.008-55.605-46.52" fill="none" stroke="var(--theme-primary)" stroke-width="2" stroke-dasharray="1,9"/>
</svg>

const ForkRight = <svg class={style.forkRight}  viewBox="0 0 682 256" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" stroke-miterlimit="10">
<path d="M670.64 244.96c0-47.459-44.046-48.217-44.046-48.217" fill="none" stroke="var(--theme-primary)" stroke-width="2" stroke-dasharray="1,8" />
</svg>