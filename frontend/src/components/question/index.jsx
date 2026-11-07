import Choice from './choice/index.jsx';
import Ranking from './ranking/index.jsx';
import Match from './match/index.jsx';
import Blanks from './blanks/index.jsx';
import style from './style.module.scss';
import { useState } from '/lib/hooks/index.jsx';
import Button from '/components/button/index.jsx';
import { useRef, useMemo, useEffect } from '/lib/hooks/index.jsx';
import { useStore } from '/lib/state.jsx';

import { useSpring, animated, config, to } from 'react-spring';
import { useDebouncedMemo } from '../../lib/hooks/state.jsx';
import { shuffle } from '../../lib/math.jsx';

function getQuestionDescrption(type, options) {
  if (type == 'choice') {
    if (options.filter((opt) => opt.correct).length < 2) {
      return 'Select correct answer, then submit'
    } else {
      return 'Select correct answers, then submit'
    }
  } else if (type === 'match') {
    return 'Drag items into groups, then submit'
  } else if (type === 'blanks') {
    return 'Drag answers into blanks, then submit'
  } else {
    return 'Rearrange items, then submit'
  }
}
export default function Question({status, answer, onAnswer, showHeader, lesson, answerDelay = 1200, index, isInline, ...question}) {
  const { type, title, options  } = question;
  if (!options) return;

  const items = useMemo(() =>
    shuffle(options.map((opt, i) => ({...opt, index: i})), undefined, true)
  , [options]);

  if (type === 'choice') {
    var Widget = Choice;
  } else if (type === 'match') {
    var Widget = Match;
  } else if (type === 'blanks') {
    var Widget = Blanks;
  } else {
    var Widget = Ranking;
  }

  const [value, setValue] = useState(answer);
  const ref = useRef();

  const [interaction, setInteraction] = useState(status == 'correct' ? 'success' : 'initial');
  const [props, spring] = useSpring(() => ({
    opacity: 1,
    x: '0%',
    y: 0,
    rotateY: '0deg',
    rotateX: '0deg',
    scale: 1
  }))
  
  useEffect(() => {
    // previously correct, animate immediately
    if (interaction == 'success' ) {
      spring.set({scale: 1, y: 0, rotateY: '180deg', rotateX: '10deg'});
    // flip question around
    } else if (interaction == 'ready') {
      spring.start({ scale: .8});
      spring.start({rotateY: '180deg', rotateX: '10deg', delay: 100});
      spring.start({scale: 1, y: 0, rotateX: '10deg', delay: 250});
    }
  }, [interaction])

  const onInteract = () => {
    setInteraction('engaged');
  }

  const onChange = (value) => {
    setValue(value);
    //setInteraction('engaged');
  }

  const onActivate = () => {
    if (interaction != 'initial') return;
    setInteraction('ready')
    const notch = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
    
    ref.current.scrollIntoViewCustom({
      block: 'start',
      behavior: 'smooth',
      offsetTop: - 75 - notch,
    })
  }

  const onClick = (e) => {
    if (interaction == 'failure') {
      setInteraction('retry');
      e.preventDefault();
      e.stopPropagation();
    } else if (!isAnswerSubmittable(question, value)) {
      e.preventDefault();
      e.stopPropagation();
      e.target.closest('button').classList.add(style.shaking);
      setTimeout(() => {
        e.target.closest('button').classList.remove(style.shaking)
      }, 1200)
    } else {
      if (getQuestionCorrection(question, value)) {
        track('send', 'event', isInline ? 'Question/Inline' : 'Question/Quiz', 'Incorrect', question.title, index)
        setInteraction('failure');
      } else {
        setInteraction('success');
        onAnswer(value);
        track('send', 'event', isInline ? 'Question/Inline' : 'Question/Quiz', 'Correct', question.title, index)
      }
    }
  }

  const hasHint = doesQuestionHasHint(lesson, index)
  const baseUrl = location.pathname + location.search.replace(/[?&]hint=\d+|\&0\.\d+/g, '')
  const hintUrl = baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'hint=' + (index + 1)
  return useMemo(() => <div id={`lesson-question-${index}`} ref={ref} class={`${style.question} ${style[interaction]}`}>
    <div onClick={onActivate} class={`${style.questionForm} ${style[interaction]}`} key="form">
      <animated.div class={style.cover} style={{
        transform: to([props.y, props.rotateY, props.rotateX, props.scale], (y, r, rx, s)=> `translate(${y}px) rotateY(${r})  rotateX(${rx}) scale(${s})`)
      }}>Tap to answer question <br />{index + 1} of {lesson.questions.length} </animated.div>
      <animated.div class={style.content} style={{
        transform: to([props.y, props.rotateY, props.rotateX, props.scale], (y, r,  rx, s)=> `translate(${y}px) rotateY(180deg) rotateY(${r}) scale(${s})`)
      }} >
        <div class={style.wrapper}>
          <div class={`${style.widget} ${style[type]}`}>
            {showHeader !== false && title && type !== 'blanks' && <h2 class={title.length > 180 ? style.long : title.length > 120 ? style.medium : null}>{title}</h2>}
            <Widget index={index} answer={answer} options={items} interaction={interaction} title={title} onInteract={onInteract} onChange={onChange} />
          </div>
          <div>
            {hasHint && <a hidden={interaction != 'failure'} href={hintUrl + '&' + Math.random()} class={style.hint}>Need hint?</a>}
            <Button.Submit 
              icon={interaction == 'success' ? 'Checkmark' : interaction == 'failure' ? null : 'ChevronRight'} 
              class={`${style.button}`} 
              onClick={onClick}>
                {interaction == 'success' ? 'Correct!' : 
                  isAnswerSubmittable(question, value) ? 
                    interaction == 'failure' ? 
                      getQuestionCorrection(question, value)
                    : `Submit answer` 
                  : getQuestionDescrption(question.type, items)}
              </Button.Submit>
          </div>
        </div>
      </animated.div>
    </div>
  </div>, [interaction, value, options])

}

const doesQuestionHasHint = (lesson, index) => {
  var html = '' + lesson.contentHtml + lesson.actionableAdviceHtml + lesson.supplementaryMaterialsHtml;
  return !!html.match(new RegExp(`<mark[^>]+question-${index + 1}`, 'gi'))
}

const isAnswerSubmittable = (question, answer) => {
  if (!answer) return false;
  if (question.type === 'ranking') {
    return true;
  } else if (question.type === 'choice') {
    return answer.length 
  } else if (question.type === 'match') {
    const expectedAnswers = question.options.map((o) => o.group)
    return expectedAnswers.length === answer.filter((a) => a).length
  } else if (question.type === 'blanks') {
    const blanks = (question.title.match(/_+/g) || []).length;
    const expectedAnswers = question.options.slice(0, blanks).map((o) => o.name)
    return expectedAnswers.length === answer.filter(Boolean).length
  }
}


const getQuestionCorrection = (question, answer) => {
  if (question.type === 'ranking') {
    var expectedAnswers = question.options.map((a, i) => String(i));
    if (JSON.stringify(expectedAnswers.slice().sort()) == JSON.stringify(answer.slice().sort())) {
      return null;
    }
  } else if (question.type === 'choice') {
    var expectedAnswers = question.options
      .map((a, i) => [a, String(i)])
      .filter(([a]) => a.correct)
      .map((a) => a[1]);
    if (JSON.stringify(expectedAnswers.slice().sort()) == JSON.stringify(answer.slice().sort())) {
      return null;
    }
  } else if (question.type === 'match') {
    var expectedAnswers = question.options.map((o) => o.group)
    if (JSON.stringify(expectedAnswers.slice().sort()) == JSON.stringify(answer.slice().sort())) {
      return null;
    }
  } else if (question.type === 'blanks') {
    const blanks = (question.title.match(/_+/g) || []).length;
    var expectedAnswers = question.options.slice(0, blanks).map((o) => o.name)
    if (JSON.stringify(expectedAnswers.slice().sort()) == JSON.stringify(answer.slice().sort())) {
      return null;
    }
  }
  return question.correction || ((question.type == 'choice' && expectedAnswers.length > 1 && answer.length == 1) ? 'Choose multiple answers' : 'The answer is incorrect') ;
}