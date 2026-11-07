import { useRef, useMemo, useState, useEffect, useCallback } from "/lib/hooks";
import { Icon, Event, Menu } from "../components";
import style from './style.module.scss';
import * as formatters from '/lib/formatters'
import { Button } from '/components/index.jsx';

import update from '/lib/immutability'
import { config, animated, useTransition, useSpring } from "react-spring";
import { models, skins, palettes, randomCharacterSettings } from "../lib/generators/choices";

export default function Dialog(props) {
  const {
    decisions, 
    actions,
    dialog,
    narration,
    data: { animations },
    world: { state }, 
    input: { onDialog, onDecision, onAction, onScene }
  } = props;
  
  const [step, setStep] = useState(0);;
  const [currentNarration, setCurrentNarration] = useState(() => {
    if (narration && !narration.isFinishing)
      return narration;
  })
  const [parameterIndex, setParameterIndex] = useState(0);;
  const [parameters, setParameters] = useState({});
  const group = decisions.available.filter((decision) => decision.choice.chains.includes(dialog) 
                                            && (decision.choice.chains[0] === dialog || !decision.choice.isChainable || decision.choice.isChainable(state, dialog, actions)))
  const elRef = useRef()
  if (!group[0]) {
    onDialog(null)
    return 
    //throw new Error(`Can not find dialog ${dialog}`);
  };

  const chain = group.map((d) => d.choice.name).join(', ')
  
  var decision = group[step];
  if (!decision) {
    //throw new Error(`Can not find dialog ${dialog}/${step}`);
    onDialog(null)
    return 
  };

  const choice = decision.choice;
  const parametersChosen = Object.keys(parameters).reduce((p, key) => {
    if (choice.parameters[key].options[parameters[key]] != null) {
      p[key] = choice.parameters[key].options[parameters[key]]
    }
    return p;
  }, {});

  const initialActionsRef = useRef();

  // do not react to game state updates caused by current dialog step
  const cachedState = useMemo(() => state, [step, parameterIndex, initialActionsRef.current])
  

  // populate decision with state 
  const preparedChoice = useMemo(() => {
    const preparedButNotInterpolated = choice.prepare(decision.original, cachedState, parametersChosen);
    const preparedAndReacted = choice.react(preparedButNotInterpolated, cachedState, parametersChosen);
    return decision.original.interpolate(preparedAndReacted, state)
  }, [cachedState, parametersChosen]);
  const parameterKeys = Object.keys(preparedChoice.parameters);

  useEffect(() => {
    // hack to avoid concurrent renders
    if (preparedChoice.scene) {
      if (preparedChoice.scene.name !== 'Cafe-Creation' && !currentNarration)
        onScene(preparedChoice.scene, props.world.state)
    }
  }, [JSON.stringify(preparedChoice.scene), currentNarration])

  // commit/reset choices
  useMemo(() => {
    const initialActions = actions.slice();
    if (Object.keys(parametersChosen).length === parameterKeys.length) {
      onDecision(preparedChoice, parametersChosen, dialog);
    } else if (decision.actions.length) {
      if (!initialActionsRef.current) {
        // clean up related actions
        onAction([], actions.filter((a) => !group.some((d) => d.actions.includes(a) || ((d.choice.dependentChains || []).includes(a.chain)))))
        //hack to avoid re-rendering actions initially
        decision = {...decision, actions: []}
      } else {
        onDecision(preparedChoice, {}, dialog)
      }
    }
    if (!initialActionsRef.current)
      initialActionsRef.current = initialActions;
  }, [parameters])

  const onClose = () => {
    if (initialActionsRef.current) {
      onAction([], initialActionsRef.current)
    }
    //onScene()
    onDialog()
  }


  const directionRef = useRef();
  if (!directionRef.current) directionRef.current = 1;
  const onNextStep = useCallback(() => {
    directionRef.current = 1;
    if (step == 0 && currentNarration && !currentNarration.isFinishing) {
      if (parameterKeys.length) {
        setCurrentNarration(null)
      } else {
        onDialog()
      }
    } else if (parameterKeys.length - 1 > parameterIndex) {
      setParameterIndex((parameterIndex) => parameterIndex + 1)
    } else if (step == group.length - 1) {
      if (narration && narration.isFinishing && !currentNarration) {
        setCurrentNarration(narration)
      } else {
        onDialog()
      }
      //onScene()
    } else {

      // hack to allow creation dialog to submit actions only when moving to next dialog
      if (preparedChoice.isDeferred) 
        onDecision(preparedChoice, parameters, dialog)
      setParameters({});
      setParameterIndex(0);
      setStep((step) => step + 1);
    }
    return false;
  }, [step, chain, parameterIndex, parameterKeys])


  const currentChoice = parameters[parameterKeys[parameterIndex]];
  const onPreviousStep = useCallback(() => {
    directionRef.current = -1;
    if (currentNarration) {
      setCurrentNarration(null)
    } else if (currentChoice != null) {
      onChoose(parameterKeys[parameterIndex], null)
    } else if (parameterIndex) {
      onChoose(parameterKeys[parameterIndex - 1], null)
      setParameterIndex((parameterIndex) => Math.max(0, parameterIndex - 1));
    } else if (step == 0 && narration && !narration.isFinishing) {
      setCurrentNarration(narration)
    } else if (step == 0) {
      onClose()
    } else {
      setParameters({});
      setStep((step) => step - 1);
    }
    return false;
  }, [step, chain, parameterIndex, currentChoice, currentNarration])
  
  const onChoose = useCallback((key, value, e, optionsLength) => {
    setParameters((parameters) => {
      const newParams = {};
      var after = false;
      Object.keys(parameters).forEach((k) => {
        if (k === key) {
          after = true;
        }
        if (!after) newParams[k] = parameters[k];
      })
      newParams[key] = value;


      return newParams;
    })
    if (optionsLength === 1) {
      //setTimeout(onNextStep, 10);
    }
    if (e) {
      e.stopPropagation();
      e.preventDefault()
    }
  }, [onNextStep])

  const isLastStep = parameterKeys.length - 1 == parameterIndex && step == group.length - 1;
  const isFirstStep = parameterIndex == 0 && step == 0;
  const renderedActions = useMemo(() => {
    return decision.actions.map((action, index) => 
      <Event.Action.auto {...action} state={state} open={true} index={"event-" + index} />
    )
  }, [decision.actions, currentChoice, step, onPreviousStep, onNextStep])

  const renderedParameters = useMemo(() => {
    if (currentNarration) {
      return [<Dialog.Narration {...{...props, ...currentNarration, onScene, onNextStep}}  index={-1} />]
    }
    return parameterKeys.map((key, i) => {
      const Parameter = decision.choice.name == 'customize' ? Dialog.Parameter.Character : Dialog.Parameter;
      return parameterIndex == i &&  <Parameter  {...preparedChoice.parameters[key]} 
                    icon={preparedChoice.parameters[key].icon || choice.icon}
                    name={key}
                    value={parameters[key]}
                    onChoose={onChoose}
                    onScene={onScene}
                    onDecision={onDecision}
                    decision={preparedChoice}
                    actions={renderedActions}
                    animations={animations}
                    index={i}
                    step={step}
                    />
    }).filter(Boolean)
  }, [parameters, parameterIndex, renderedActions, currentNarration])
  
  const choicesTransition = animations === false 
    ? (callback) => renderedParameters.map((item) => callback({}, item))
    : useTransition(renderedParameters, {
      from: { opacity: 1, transform: `translate3d(${directionRef.current * 100}%,0,0)`},
      enter: { opacity: 1, transform: 'translate3d(0%,0,0)'},
      leave: { opacity: 1, transform: `translate3d(${directionRef.current * -100}%,0,0)`},
      key: (page) =>page.props.index,
      immediate: () => ((!narration || narration.isFinishing) && isFirstStep) || (currentNarration && !currentNarration.isFinishing),
    });
    

  // close dialog when hitting links
  const onClick = useCallback((e) => {
    if (e.target.closest('a[href]')) {
      onDialog();
    }
  }, [onDialog])

  const renderedDialog = useMemo(() => <section ref={elRef} class={`${style.dialog}`} index={preparedChoice.name} onClick={onClick}>
    {decision.choice.isCancellable !== false && false && <Icon.Close onClick={() => onClose()} class={style.close} />}
    {choicesTransition((values, item) =>
        item && <animated.div style={values} class={style.fullscreen}>
          {item}
          <div class={style.actions} index={'actions'}>
            {<Button onClick={onPreviousStep} hidden={decision.choice.isCancellable === false || (currentNarration && !currentNarration.isFinishing)} class="gray" icon="ChevronLeft">
              {currentChoice != null ? 'Change choice' : 
                step === 0 && parameterIndex === 0 ? 'Close dialog' : 'To previous decision'}
            </Button>}
            
            {(currentChoice != null || (currentNarration && !currentNarration.isFinishing)) && <Button.Submit onClick={onNextStep} class="primary next-step" icon="ChevronRight">
              {isLastStep && !currentNarration ? 'Close' : 'Continue'}
            </Button.Submit>}
          </div>
        </animated.div>
      )}
  </section>, [currentNarration, parameters, parameterIndex, currentChoice, decision.actions, onClick]);

  const renderedDialogArray = renderedDialog ? [renderedDialog] : [];
  const dialogsTransition = animations === false
    ? (callback) => renderedDialogArray.map((item) => callback({}, item))
    : useTransition(renderedDialogArray, {
      from: { opacity: 1, transform: `translate3d(${directionRef.current * 100}%,0,0)`},
      enter: { opacity: 1, transform: 'translate3d(0%,0,0)'},
      leave: { opacity: 1, transform: `translate3d(${directionRef.current * -100}%,0,0)`},
      immediate: () => animations === false || (currentNarration && !currentNarration.isFinishing) || ((!narration || narration.isFinishing) && isFirstStep),
      key: (page) => page ? page.props.index : null,
    })
  

  return dialogsTransition((values, item) =>
    <animated.div style={values} class={style.fullscreen}>{item}</animated.div>
  )
}

Dialog.Parameter = ({ cta = 'Continue', step, index, title, description, icon, options, name, value, actions, class: className, onDialog, onChoose, animations, ...props}) => {
  const renderedOptions = useMemo(() => 
    options.map((option, index) => !option.hidden && (value == null || value === index) &&
      <Dialog.Option
        {...option} 
        disabled={value === index ? null : option.disabled}
        checked={value === index}
        onChoose={(e) => value !== index && onChoose(name, index, e, options.length)}
        onCancel={(e) => value === index && onChoose(name, null, e, options.length)}
        index={index}
      />).filter(Boolean)
  , [value, options])

  const subsequentRender = useRef();
  useEffect(() => {
    subsequentRender.current = true;
  }, [])
  const transition = useTransition(renderedOptions.concat(actions || []), {
    from: () => 
      subsequentRender.current ? { opacity: 0, transform: `translate3d(30%,-30%,0)`, marginBottom: '0px', maxHeight: '0px'}
                               : { opacity: 0, transform: `translate3d(30%,-30%,0)`, marginBottom: '20px', maxHeight: '400px'},
    enter: (item) => async (next) => {
      try {
        
        if (String(item.props.index).includes('actions') && animations !== false) await new Promise((r) => setTimeout(r, 200));
        await next({ opacity: 1, transform: 'translate3d(0%,0%,0)', marginBottom: String(item.props.index).includes('event') ? '5px' : '20px', maxHeight: '400px'})
      } catch(e) {
        
      }
    },
    leave: { opacity: 0, transform: 'translate3d(0%,-30%,0)', marginBottom: '0px', maxHeight: '0px'},
    trail:  (animations !== false && value == null ? 150 : 1),
    key: (page) => page && page.props.index,
    immediate: () => animations === false,
    //expires: 0
  })
 
  const elRef = useRef()
  return <div class={`${style.choice} ${className} ${index === 0 && style.hasIllustration}`} {...props} ref={elRef}>
    <div class={style.wrapper}>
      <div class={style.decision}>
        <h1><Icon name={icon} />{title}</h1>
        <div class="fiction">
          {formatters.markdown(description)}
        </div>
      </div>
      <div class={style.options}>
        {transition((values, item) =>
          <animated.div style={values} class={`${item.props.class} ${item.props.checked && 'checked'}`}>{item}</animated.div>
        )}
      </div>
    </div>
  </div>
}

Dialog.Parameter.Character = ({onDecision, onChoose, onScene, decision, name}) => {

  const [characterSettings, setCharacterSettings] = useState(randomCharacterSettings)

  useEffect(() => {
    onScene({name: 'Cafe-Creation', uid: Math.random()}, {character: characterSettings})
    onChoose('choice', characterSettings)
  }, [characterSettings]);
  
  return <div class={`${style.choice} ${style.creation} ${style.hasIllustration}`}>
    <div class={style.wrapper}>
      <h2>Create your character</h2>
      <ul>
        <li>
          <Icon.ChevronLeft onClick={() => setCharacterSettings({...characterSettings, model: models[(models.length + models.indexOf(characterSettings.model) - 1) % models.length]})}  />
          <span>Outfit</span>
          <Icon.ChevronRight onClick={() => setCharacterSettings({...characterSettings, model: models[(models.length + models.indexOf(characterSettings.model) + 1) % models.length]})}  />  
        </li>
        <li>
          <Icon.ChevronLeft onClick={() => setCharacterSettings({...characterSettings, skin: skins[(skins.length + skins.indexOf(characterSettings.skin) - 1) % skins.length]})} />
          <span>Skin tone</span>
          <Icon.ChevronRight onClick={() => setCharacterSettings({...characterSettings, skin: skins[(skins.length + skins.indexOf(characterSettings.skin) + 1) % skins.length]})} />  
        </li>
        <li>
          <Icon.ChevronLeft onClick={() => setCharacterSettings({...characterSettings, palette: palettes[(palettes.length + palettes.indexOf(characterSettings.palette) - 1) % palettes.length]})}  />
          <span>Color scheme</span>
          <Icon.ChevronRight onClick={() => setCharacterSettings({...characterSettings, palette: palettes[(palettes.length + palettes.indexOf(characterSettings.palette) + 1) % palettes.length]})}  />  
        </li>
      </ul>
      <Button onClick={() => setCharacterSettings(randomCharacterSettings())}>Randomize</Button>
    </div>
  </div>
  
}

Dialog.Narration = ({world, title, description, icon = 'BadgesAction', scene, isFinishing, onScene, onNextStep}) => {
  useEffect(() => {
    onScene(scene, world.state)
  }, [scene]);

  return <div class={`${style.choice} ${style.hasIllustration} ${style.narration}`}>
    <div class={style.wrapper}>
      <div class={style.decision}>
        <h1><Icon name={icon} />{title}</h1>
        <div class="fiction">
          {formatters.markdown(description)}
        </div>

      </div>
    </div>
  </div>
  
}


Dialog.Option = ({title, description, checked, years, price, riskFreeRate = 0, rate, effect, disabled, hidden, image, onChoose, positive, neutral, negative, class: className}) => {
  var meta;
  if (effect) {
    meta = effect;
  } else if (price && !years) {
    meta = 'Price: ' + formatters.currency(price)
  } else if (price && years) {
    meta = `${formatters.currency(price / years)}/yr for ${years} yrs`
  } else if (rate && !years) {
    meta = formatters.rate(rate + riskFreeRate)  
  } else if (rate && years) { 
    meta = `${formatters.rate(rate + riskFreeRate)}` + (!title.match(/year|yrs?/i) ? ` interest for ${years} yrs` : '')
  } 

  const onClick = (e) => {
    if (!disabled) onChoose(e);
    e.preventDefault();
    e.stopPropagation();
  }
  return <a onClick={onClick} class={`${style.option} ${className} ${checked && 'checked'}`} hidden={hidden} disabled={disabled}>
    <div>
      {image && <Icon name={image} class={style.right} />}
      <h2>
        {title}
      </h2>
      {(positive || negative || neutral) && <div class="meta breakdown">
        {positive && <div class="positive">{positive}</div>}
        {neutral && <div class="neutral">{neutral}</div>}
        {negative && <div class="negative">{negative}</div>}
      </div>}
      {!(positive || negative || neutral) && meta && <div class="meta">
        {meta}
      </div>}
      {disabled && <p class={`fiction ${style.disabled_reason}`}>{formatters.markdown(disabled)}</p>}
      {!disabled && <div class={`fiction ${style.option_description}`}>{formatters.markdown(description)}</div>}
    </div>
  </a>
}