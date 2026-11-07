
import style from './style.module.scss';

import Investments from './Investments';
import Finance from './Finance';
import Property from './Property';
import Career from './Career';
import Results from './Results';
import Economy from './Economy';
import Dialog from './Dialog';
import Review from './Review';


import Start from './History/Start';
import Squad from './History/Squad';
import Leaderboard from './History/Leaderboard';
import Cashflow from './Finance/Cashflow';
import Networth from './Finance/Networth';
import Portfolio from './Investments/Portfolio';
import Stock from './Investments/Stock';
import EconomyDialog from './Investments/Economy';

import { Component } from "preact";
import { useCallback, useRef, useMemo} from "/lib/hooks";
import { config, useTransition, animated } from 'react-spring'
import { memo, useEffect } from 'preact/compat';
import { Progression, Canvas, Menu, Tooltip } from './components';


export default function PaperChasePages(props) {
  const {
    data: { session, animations },
    world: { state },
    params: { tooltip, section, dialog, itemId },
    ui,
    progression,
    decisions
  } = props;

  const Page = (() => {
    switch (section) {
      case 'finance':     return Finance;
      case 'investments': return Investments;
      case 'career':      return Career;
      case 'property':    return Property;
      case 'economy':     return Economy;
      case 'results':     return Results;
      case 'review' :     return Review;
    }
  })();
  
  const previousURLRef = useRef();

  var order = ['economy', 'property', 'investments', 'career', 'finance'];
  var lastIndex = previousURLRef.current ? order.indexOf(previousURLRef.current.split('/')[3]) : -1
  const immediate = !previousURLRef.current;
  var newIndex = order.indexOf(section)
  var side = lastIndex >= newIndex ? -1 : 1;

  var shouldNotMove = useMemo(() => {
    if (!section) return true;
    const previous = previousURLRef.current;
    previousURLRef.current = location.pathname;
    return previous 
      && previous !== location.pathname
      && previous.split('/')[3] === section;
  }, [location.pathname, section])

  useMemo(() => {
    document.title = `Paper chase / ${section}`;
  }, [location.pathname]);

  
  const initialOpacity =  window.innerWidth > 783 ? 0 : 1;
  const transitionFrom = shouldNotMove ? { opacity: initialOpacity, x: 'calc(0% + 0px)'} : { opacity: initialOpacity, x: `calc(${100 * side}% + ${5 * side}px)`};
  const transitionTo = { opacity: 1, x: 'calc(0% + 0px)'};
  const renderedPages = [{Page, props, section}];

  const transition = animations === false
    ? (callback) => renderedPages.map((item) => callback({}, item))
    : useTransition(renderedPages, {
      from: immediate ? transitionTo : transitionFrom,
      enter: () => async (next) => {
        try {
          return await next(transitionTo)
        } catch(e) {
          
        }
      },
      update: () => async (next) => {
        try {
          await next(transitionTo);
        } catch(e) {

        }
      },
      leave: () => async (next) => {
        try {
          await next(shouldNotMove ? { opacity: 0 } : { opacity: initialOpacity, x: `calc(${-100 * side}% + ${-5 * side}px))` })
          //if (!shouldNotMove) {
          //  await next({ opacity: initialOpacity });
          //}
        } catch(e) {

        }
      },
      key: (slide) => slide.section,
      immediate: immediate,
      //expires: false,
      onRest: () => document.querySelector(`.dialog`) && document.querySelector(`.dialog`).classList.remove('disabled'),
      onStart: () => {
        
      },
    })
  
  const DialogPage = useMemo(() => {
    switch (dialog.name) {
      case 'networth':    return Networth;
      case 'cashflow':    return Cashflow;
      case 'squad':       return Squad;
      case 'leaderboard': return Leaderboard;
      case 'portfolio':   return Portfolio;
      case 'stock':       return Stock;
      case 'economy':     return EconomyDialog;
      default:            return dialog.name ? Dialog : null;
    }
  }, [dialog.name])

  useMemo(() => {
    if (dialog.name) {
      track('send', 'pageview', {
        'page': location.pathname + '/' + dialog.name + '/' + (dialog.page || ''),
        'title': 'Paper Chase / ' + section + ' / ' + dialog.name
      })
      track('send', 'event', 'Game/Dialog', dialog.name, dialog.page);
    }
  }, [dialog.name, dialog.page])

  const renderedDialog = useMemo(() => {
    return DialogPage ? <DialogPage {...props} dialog={dialog.name} page={dialog.page} narration={dialog.narration} /> : null;
  }, [dialog.name, decisions.available, dialog.narration])
  
  const offset = progression.active ? 0 : 0;
  const dialogX = (dialog.x || window.innerWidth / 2) - (window.innerWidth > 783 ? 64 : 0);
  const dialogY = (dialog.y || window.innerHeight / 2);
  const renderedDialogArray = renderedDialog ? [renderedDialog] : [];
  const finalStyles = (item) => {
    const topOffset = offset;
    return {
      delay: dialog.name.match(/networth|cashflow|stock|portfolio/) ? 100 : 0,
      opacity: 1, 
      transform: `translate3d(0%, ${topOffset}px,0) scale(1.0) rotateZ(0deg)`,
  //    onRest: () => document.querySelector(`.dialog`) && document.querySelector(`.dialog`).classList.remove('disabled'),
   //   onStart: () => document.querySelector(`.dialog`) && document.querySelector(`.dialog`).classList.add('disabled'),
    };
  };
  const dialogTransition = animations === false
    ? (callback) => renderedDialogArray.map((item) => callback(finalStyles(item), item))
    : useTransition(renderedDialogArray,  {
      config: config.default,
      key: (item) => item.props.dialog + item.props.page,
      from: (item) => 
              item.props.dialog == 'customize' ? finalStyles(item) :
              item.props.dialog.match(/^(customize|leaderboard|networth|cashflow|stock|portfolio)$/) ? 
                { opacity: 1, transform: 'translate3d(0%, 0px,0) scale(0.0) rotateZ(0deg)', transformOrigin: `${dialogX}px ${dialogY}px`} :
                { opacity: 1, transform: 'translate3d(0%, 0px,0) scale(0.0) rotateZ(30deg)', transformOrigin: `${dialogX}px ${dialogY}px`},
      enter:  finalStyles,
      leave:  { opacity: 0, transform: 'translate3d(0%,0px,0) scale(0.1) rotateZ(0deg)', transformOrigin: `${dialogX}px ${dialogY}px`},
    })

    
  return [
    <div class={style.outer} scrollable={true}>
      <div class={style.wrapper}>
        {<Progression {...props} />}
        {<Menu {...props} title={`Year ${state.year}`} hidden={progression.active} />}
        <Tooltip tooltip={ui.tooltip} {...props} />
        {transition((values, item) =>
          <animated.div class={`${style.slide} slide ${item.section}`} style={values} id={style[item.section]}>
            <MemoizedSlide {...item} isHiding={item.section !== (section || 'story')} />
          </animated.div>
        )}
      </div>
    </div>,

    dialogTransition((values, item) => {
      return <animated.div class={`${style.slide} slide dialog ${item.props.dialog}`} style={values} id={style[item.props.dialog]}>{item}</animated.div>
    })
  ]
}


class Slide extends Component {
  render() {
    const Page = this.props.Page;
    return <Page {...this.props.props} id={this.props.section} key={this.props.section} />;
  }

  shouldComponentUpdate(previousProps) {
    return !this.props.props.params.dialog.open && !(this.props.isHiding || previousProps.isHiding)//this.props.props != previousProps.props;
  }
}

const MemoizedSlide = memo(Slide);