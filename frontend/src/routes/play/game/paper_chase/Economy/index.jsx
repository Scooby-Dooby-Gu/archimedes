import { Icon, Event, Skill } from "../components"
import { Button } from '/components/index.jsx';
import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import { useEffect, useState, useRef } from '/lib/hooks/index.jsx';
import { useTransition, animated, config } from "react-spring";
import { useMemo } from "preact/hooks";

function getEventMilestone(event, year, state, categoryName) {
  for (var yearState = state; yearState.year > year;)
    yearState = yearState.previous;

  const confidence = yearState.expertise[categoryName];
  if (event.difficulty - confidence > 4) {
    return  'Novice'
  } else if (event.difficulty - confidence > 2) {
    return  'Low'
  } else if (event.difficulty - confidence > 0) {
    return  'Medium'
  } else {
    return 'High'
  }
  
}

const consultationTitles = {
  'World news': 'KYP’s current policy review'  ,
  'Economics': 'The Breyer-Mark economic report',
  'Politics': 'Global Affair’s yearly outlook'
}
const consultationTypes = {
  'World news': 'Policy review'  ,
  'Economics': 'Economic report',
  'Politics': 'Yearly outlook'
}

export function NewsCategory({category, categoryName, categoryIndex, consultationsAvailable, onAction, log, actions, state, year}) {
  const { step, chainName, events, event } = category;
  const listRef = useRef();
  const indexRef = useRef();
  const renderRef = useRef();
  const presentMilestone = getEventMilestone(event, year, state, categoryName);

  const presentIndex = events.length - 1;
  const [index, setIndex] = useState(presentIndex);

  const eventYear = year - events.length + index + 1; 
  for (var eventState = state; eventState.year > eventYear;)
    eventState = eventState.previous;

  const predicting = category.next && presentMilestone === "High";

  useMemo(() => {
    renderRef.current = (renderRef.current == null ? 0 : renderRef.current + 1);
  }, [index]); 


  const slides = events.slice(0)
  if (predicting) {
    slides.push(category.next)
  }
  const visible = [
    [slides[index], index, eventState, getEventMilestone(event, eventState, state, categoryName)],
  ];

  useEffect(() => {
    const el = listRef.current.querySelector(`[index="step-${index}"]`)
    if (el) {
      listRef.current.style.height = el.scrollHeight + 35 + 'px';
    }
  }, [listRef, window.innerHeight, index, actions])

  useEffect(() => {
    setIndex(presentIndex);
  }, [year])

  var left = `translateX(100%) translateX(40px)`;
  var right = `translateX(-100%) translateX(-40px)`;

  const eventTransition = useTransition(visible, {
    enter: ([item, eventIndex, eventState, eventMilestone]) => async (next) => {
      try {
        next({
          predictionBlur: `blur(${eventMilestone === 'Novice' ? 10 : 0}px)`,
          reactionBlur: `blur(${eventMilestone === 'Low' || eventMilestone === 'Novice' ? 7 : 0}px)`,
          config: config.molasses,
          //delay: 200
        }).catch((e) => {})
        await next({
          transform: 'translateX(0%) translateX(0px)',
          opacity: 1
        })
      } catch(e) { }
    },
    update: ([item, eventIndex, eventState, eventMilestone]) => ({
      predictionBlur: `blur(${eventMilestone === 'Novice' ? 10 : 0}px)`,
      reactionBlur: `blur(${eventMilestone === 'Low' || eventMilestone === 'Novice' ? 10 : 0}px)`,
      transform: 'translateX(0%) translateX(0px)',
      opacity: 1
    }),
    from: ([item, eventIndex, eventState, eventMilestone]) => ({
      transform: renderRef.current == 0 ? 'translateX(0%) translateX(0px)' : indexRef.current < index ? left : right,
      predictionBlur: `blur(${eventIndex > presentIndex || eventMilestone === 'Novice' ? 20 : 0}px)`,
      reactionBlur: `blur(${eventMilestone === 'Low' || eventMilestone === 'Novice' ? 10 : 0}px)`,
      opacity: 0
    }),
    leave: ([item, eventIndex, eventState, eventMilestone]) => ({
      transform: indexRef.current >= index ? left : right,
      predictionBlur: `blur(${eventIndex > presentIndex || eventMilestone === 'Novice' ? 20 : 0}px)`,
      reactionBlur: `blur(${eventMilestone === 'Low' || eventMilestone === 'Novice' ? 10 : 0}px)`,
      opacity: 0
    }),
    key: ([event, index]) => index
  })

  indexRef.current = index;
  const entireLog = log.concat(actions)
  const consultations = entireLog.filter((action) => action.type === 'consult' && action.category === categoryName);
  const reports = entireLog.filter((action) => action.type === 'buyReport' && action.category === categoryName);
  const freeReportAvailable = reports.length === 0 && entireLog.find((action) => action.type === 'freeReport' && action.category === categoryName);
  const reportPrice = freeReportAvailable ? 0 : 5000 * Math.min(3, reports.filter((report) => report.price).length + 1);

  const onConsult = () => {
    onAction({
      type: consultationsAvailable > 0 ? 'consult' : 'buyReport', 
      category: categoryName, 
      price: consultationsAvailable > 0 || freeReportAvailable ? 0 : reportPrice, 
      hidden: consultationsAvailable > 0 || freeReportAvailable
    });

    if (presentMilestone === 'Medium' && category.next) {
      setIndex(presentIndex + 1)
    }
  }

  return <li categoryIndex={categoryIndex}>
    <ul class={style.steps} ref={listRef}>
      {eventTransition((styles, [event, i, eventState, eventMilestone]) => {
        if (!event) return;

        const reportThisYear = reports.find((action) => action.year === eventState.year);
        const consultationThisYear = consultations.find((action) => !action.price && action.year === eventState.year)
        
        const reportsEnabled = entireLog.find((action) => action.type === 'freeReport');

        
        return <animated.li style={{
          transform: styles.transform,
          opacity: styles.opacity
        }} index={'step-' + i} year={eventState.year}>
          {i <= presentIndex  && <aside class={style[eventMilestone]}>
            Investment literacy 
            <strong>{eventMilestone}</strong>
            <ul class={style.boosts}>
              {consultationThisYear && <li class={style.boost}><Icon.Checkmark />Consultation</li>}
              {reportThisYear && <li class={style.boost}><Icon.Checkmark />{consultationTypes[categoryName]}</li>}
            </ul>
          </aside>}
          {i > presentIndex && 
            <aside class={style.prediction}><strong>PREDICTION</strong></aside>
          }
          <h3>
            <span class={style.tag}>
              <span>{formatters.titlize(categoryName)}</span>
            </span>
            {chainName}
          </h3>
          <animated.div style={{
            filter: styles.predictionBlur,
            transform: 'translateZ(0)',
            perspective: 1000,
            backfaceVisibility: 'hidden'
          }}>
            <h4>
              {event.title}
            </h4>
            <p>{event.description}</p>
            {i <= presentIndex && [
              eventMilestone === 'Low' && <p class={style.requirement}>Increase investment literacy to reveal</p>,
              <animated.p 
                class={style.meta}
                style={{
                  filter: styles.reactionBlur,
                  transform: 'translateZ(0)',
                  perspective: 1000,
                  backfaceVisibility: 'hidden'
                }}>
                  {event.meta || 'There is no definite market reaction this year. '}
              </animated.p>
            ]}
          </animated.div>
          <ul class={style.navigation}>
            {i > 0 && <li class={style.back}>
              <a href="#" onClick={(e) => {
                setIndex((index) => index - 1);
                e.preventDefault();
                e.stopPropagation();
              }}>
                <Icon.ChevronLeft />
                {i > presentIndex ? eventState.year : eventState.year - 1 }
                </a>
            </li>}
            {i < presentIndex && <li class={style.forward}>
              <a href="#" onClick={(e) => {
                setIndex((index) => index + 1);
                e.preventDefault();
                e.stopPropagation();
              }}>
                {eventState.year + 1}
                <Icon.ChevronRight />
              </a>
            </li>}
            {i == presentIndex && eventMilestone !== 'High' && !reportThisYear && ((reportsEnabled && state.cash >= 5000) || consultationsAvailable > 0) && <li class={style.forward}>
              <Button
                id={reportPrice == 0 ? 'free-report' : null}
                onClick={onConsult} 
                class={`primary ${style.unlock} ${reportPrice === 0 && consultationsAvailable == 0 && style.jade}`} >
                {(consultationsAvailable > 0 ? 'Consult club member' : `${consultationTypes[categoryName]} (${reportPrice > 0? formatters.currency(reportPrice) : 'FREE'})`)}
              </Button>
            </li>}
            {i == presentIndex && category.next && eventMilestone === 'High' && <li class={style.forward}>
              <Button onClick={() => setIndex((index) => index + 1)} 
                      class={`primary ${style.unlock} ${style.jade}`} >
                See prediction for {eventState.year + 1}
                <Icon.ChevronRight /> 
              </Button>
            </li>}
          </ul>
        </animated.li>
      })}
    </ul>

    {(presentIndex > 0 || predicting) && <div class={style.progress}>
      <div style={{
        width: 1 / slides.length * 100 + '%',
        left: index / (slides.length) * 100 + '%'
      }} class={style.bar}></div>
      {predicting && <div style={{
        width: 1 / slides.length * 100 + '%',
        right: 0
      }} class={style.prediction}></div>}
    </div>}
  </li>
  
}
export default function News({
  data: { session: { actions, log }, courses, submissions, user },
  world: { state }, 
  input: { onAction }
}) {
  const { news, boosts, expertise, consultationsAvailable, year } = state;
  return <div class={style.news}>
    <Skill.ofUser buttonId="next-economist-lesson" courses={courses} submissions={submissions} user={user} title="Economist" description="Staying ahead of the curve" icon="BadgesFinance" theme="purple" level={1} value={0} max={5} rewards={['Access to the club', 'Expert member joins the club', 'Increased literacy level to reveal']} />

    <ul class={style.categories}>
      {Object.keys(news).map((categoryName, index) => {
        const category = news[categoryName];
        return <NewsCategory {...{year, category, categoryName, expertise, consultationsAvailable, state, onAction, log, actions, categoryIndex: index}} />
      })}
    </ul>
  </div>
}