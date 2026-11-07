import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import Button from '/components/button';
import Ticker from '../Ticker';
import Icon from '../Icon';

export default function Event(props) {
  return <div class={`${style.event} ${props.class}`}>

  </div>
}

Event.Action = ({chance, extras, children, cause, type, title, description, meta, icon, group, open, reaction, partial=true, cta, href, ...props}) => {
  return <details class={`${style.event} ${props.class} ${style[type]} event ${cause && style.caused}`} open={open}>
    <summary>
      <div class={style.summary}>
        <Icon name={cause ? 'ChevronRight' : (icon || group)} />
        <div class={style.content}>
          {title && <h3>{title}</h3>}
          {meta && <div class="meta">{meta}</div>}
          {description && partial && <div class="fiction">{formatters.markdown(description)}{reaction && <p>{reaction}</p>}</div>}
        </div>
        {cta && <Button.Link href={href} icon="ChevronRight" class="icon-right round">{cta}</Button.Link>}
      </div>
    </summary>
    {description && !partial && <div class="fiction">{formatters.markdown(description)}{reaction && <p>{reaction}</p>}</div>}
    {children}
    {extras}

  </details>
}

Event.Link = ({children, type, title, description, meta, icon, group, open, partial, cta, href, ...props}) => {
  return <a class={`${style.event} ${props.class} ${style[type]} event`} href={href}>
    <div class={style.summary}>
      <Icon name={icon || group} />
      <div class={style.content}>
        {title && <h3>{title}</h3>}
        {meta && <div class="meta">{meta}</div>}
        {description && partial && <div class="fiction three-lines">{formatters.markdown(description)}</div>}
      </div>
      {cta && <Icon.ChevronRight />}
    </div>
    {description && !partial && <div class="fiction three-lines">{formatters.markdown(description)}</div>}
    {children}
  </a>
}

Event.Action.auto = (props) => {
  const Action = Event.Action[props.type];
  if (!Action) {
    return `No template for ${props.type} event`
    //throw new Error(`Can't find Event.Action.${props.type}`)
  }
  return <Action {...props} />
}

Event.Action.consult = (props) => {
  if (!props.price) return;
  const Consultation = Event.Action.consult[props.category];
  return <Consultation {...props} icon="Friendship" meta={`-${formatters.currency(props.price)}`} />
}
Event.Action.buyReport = Event.Action.consult;

Event.Action.consult['World news'] = (props) => {
  if (!props.price) return;
  return <Event.Action {...props} icon="World" title={`Global Affairs' yearly outlook`} description="We are turning to Global Affairs for help regarding US international relations and how other countries and groups are perceiving our polices."/>
}
Event.Action.consult['Economics'] = (props) => {
  if (!props.price) return;
  return <Event.Action {...props} icon="Finance" title={`The Breyer-Mark economic report`} description="We have hired the economic consulting firm Breyer-Mark to conduct additional research on the current health of the economy and the likely path forward."/>
}
Event.Action.consult['Politics'] = (props) => {
  if (!props.price) return;
  return <Event.Action {...props} icon="Friendship" title={`KYP think tank review`} description="We renewed our yearly dues with KYP, a think tank for current politics, and the firm has published its yearly review on the impacts of future policy on the economy."/>
}


Event.news = (props) => <Event.Action
  {...props} />



Event.Action.tomasAnswer = (props) => <Event.Action
  {...props} icon="education" />

Event.consequence = ({level, ...props}) => <Event.Action
  {...props} class={level} type="consequence" />

Event.Action.buy = ({state, ...props}) => <Event.Action
  group="Stocks"
  meta={`-${formatters.currency(props.price * props.amount)}`}
  title={props.name.includes('Bond')
      ? <div>Bought {props.amount} <Ticker.Stock name={props.name} state={state} title={props.name + ' bond' + (props.amount > 1 ? 's' : '')}  /></div>
      : <div>Bought {props.amount} share{props.amount > 1 ? 's' : ''} of <Ticker.Stock name={props.name} state={state} /> </div>
    }
  {...props} />

Event.Action.difficulty = ({name, amount, description, ...props}) => <Event.Action {...props} 
  group="Finance"
  description={description}
  title={name}
  meta={`+${formatters.currency(amount)} in cash`} />

Event.Action.sell = ({state, ...props}) => <Event.Action 
  group="Stocks"
  meta={`+${formatters.currency(props.price * props.amount)}`}
  title={props.name.includes('Bond')
  ? <div>Sold {props.amount} <Ticker.Stock name={props.name} state={state} title={props.name + ' bond' + (props.amount > 1 ? 's' : '')} /></div>
  : <div>Sold {props.amount} share{props.amount > 1 ? 's' : ''} of <Ticker.Stock name={props.name} state={state} /> </div>
}
  {...props} />

  Event.Action.borrow = (props) => <Event.Action
  group="Finance"
  title={`${props.name}`} 
  meta={!props.sum ? 'Prepaid' : `${formatters.currency(props.sum)} ${props.rate ? 'at ' + formatters.rate(props.rate + props.riskFreeRate) + ' for' : ' over'} ${props.years} yrs`}
  description="The loan is a heavy burden, but it opens up the new possibilities"

  {...props} />
    

  Event.Action.prepay = (props) => <Event.Action
  group="Finance"
  title={`Prepaid ${props.name}`}
  description={`You prepaid your ${formatters.titlize(props.kind)}, lowering the principal by ${formatters.currency(props.amount)} and total interest by ${formatters.currency(Math.abs(props.decrease))}.`}
  meta={`-${formatters.currency(props.amount)}`}
  {...props} />
    
Event.Action.refinance = (props) => <Event.Action
  group="Finance"
  title={`Refinanced ${props.name}`}
  description={`Total interest was lowered by ${formatters.currency(props.decrease)}.`}
  meta={`-${formatters.rate(props.riskFreeRateDecrease)}`}
  {...props} />
  
Event.Action.opinion = (props) => <Event.Action
  group="Finance"
  icon="Approve"
  class="good"
  {...props} />
  

Event.Action.loan = Event.Action.borrow

Event.Action.work = (props) => <Event.Action
  group="Career"
  meta={`+${formatters.currency(props.salary)}/yr`}
  description={`Took a job at ${props.company} with salary of ${formatters.currency(props.salary)}`}
  {...props}>
  
</Event.Action>

Event.Action.enroll = ({name, years, ...props}) => <Event.Action {...props} 
  meta={`${years} years`}
  group="Education"
  {...props} />

Event.Action.pay = ({sum, ...props}) => <Event.Action
  group="Finance"
  meta={`-${formatters.currency(sum)}`}
  title={`Paid for ${props.context} with cash`}
  {...props}  />

Event.Action.exercise = ({...props}) => <Event.Action
  group="Finance"
  {...props}  />

Event.Action.buyHouse = ({name, expenses, ...props}) => 
  <Event.Action 
    group="Property"
    title={`Purchased a ${name}`} 
    meta={`-${formatters.currency(expenses)}/yr`}
    {...props}  />

Event.Action.getHouse = ({name, expenses, ...props}) => 
  <Event.Action 
    group="Property"
    title={`Managing a ${name}`} 
    {...props}  />

Event.Action.sellHouse = ({name, amount, ...props}) => 
  <Event.Action 
    group="Property"
    title={`Sold a ${name}`} 
    meta={`+${formatters.currency(amount)}`}
    {...props}  />

Event.Action.retirementContribution = ({expenses, ...props}) => 
  <Event.Action 
    group="Finance"
    {...props}   />

Event.Action.retirementAllocation = (props) => 
  <Event.Action 
    group="Finance"
    {...props}   />

Event.Action.character = () => null



Event.Action.bonus = (props) => <Event.Action {...props}  />
Event.Action.story = (props) => <Event.Action {...props}  />
Event.Action.tooltip = (props) => <Event.Action {...props}  />

Event.Action.newsPrediction = (props) => <Event.Action {...props}  />
Event.Action.freeReport = (props) => <Event.Action {...props}  />
Event.Action.sectorChoice = (props) => <Event.Action {...props}  />
Event.Action.challenge = ({summary, label, years, ...props}) =>
  <Event.Action {...props} open={true}>
    <div class={style.details}>
      <Icon.Challenge />
      <div class={style.years}>{formatters.years(years)}</div>
      <h3>{label}</h3>
      <div class={style.summary}>
        {summary}
      </div>
    </div>

  </Event.Action>

Event.Action.hireTaxAdvisor = (props) => <Event.Action {...props}  />
Event.Action.lesson = (props) => <Event.Link href={`/courses/${props.courseId}/lessons/${props.id}`} {...props} title={'Lesson: ' + props.title} open={true} icon="Pages" cta="Read" />
Event.Action.passed = (props) => <Event.Link href={`/courses/${props.courseId}/lessons/${props.id}`} {...props} title={'Lesson: ' + props.title} open={true} icon="Checkmark" cta="Read" />

Event.Action.moveIn = ({expenses, ...props}) => 
  <Event.Action 
    title={`${props.from ? 'Moved' : 'Moved in'} to ${props.context}`}
    description={"You are excited to live in a home you own with the freedom to make any renovations you want."}
    group="Property" 
    {...props}  />

Event.Action.moveOut = ({expenses, ...props}) => 
  <Event.Action 
    group="Property"
    meta={`${formatters.currency(-24000)}/yr`}
    title="Started renting an appartment"
    description="You moved out of your house to rent it out. "
    {...props}  />

Event.Action.rentOut = ({context, amount, props}) => 
  <Event.Action 
    group="Property"
    meta={`+${formatters.currency(amount)}/yr`}
    title={`Rented out ${context}`}
    description="You are now getting passive income"
    {...props}  />

Event.Action.renovate = ({expenses, ...props}) => 
  <Event.Action 
    group="Property"
    title={`Renovated ${props.context}`}
    description="House value has slightly increased"
    meta={`-${formatters.currency(props.amount)}`}
    {...props}  />


Event.Action.hidden = ({expenses, ...props}) => null