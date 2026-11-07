import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import { Icon, Decision, Event } from '../components'
import { Button } from '/components/index.jsx'

export default function Decisions({
    world: { state }, 
    data: { user, session: { actions, log, timestamps } },
    progression,
    input,
    decisions
  }) {
  const applicableDecisions = decisions.available.filter((decision) => 
  decision.actions.length || (decision.choice.isOutstanding && decision.choice.isOutstanding(state)))
  // hide pursue higher education until Running into an old friend is chosen
  .filter((decision) => 
    decision.actions.length || state.difficulty || decision.choice.type !== 'career'
  // hide apply for job dialog
  ).filter((decision) => 
    decision.actions.length || decision.choice.name !== 'job' || state.education.tier === 'grad' 
  )

  const filteredActions = actions
    .filter((action) => !action.hidden)
    .filter((action) => 
      !applicableDecisions.some((decision) => action.decision === decision.choice.name))

  
  var years = [];
  
  for (var year = state; years.length < 50 && year; year = year.previous) {
    if (year.previous && year.turn >= -1 && log.find((action) => action.year === year.year && !action.hidden)) {
      years.push(year)
    }
  }

  const earlyActions = ['buyReport', 'hireTaxAdvisor']
  const filteredActionsBefore = filteredActions.filter((action) => earlyActions.includes(action.type))
  const filteredActionsAfter = filteredActions.filter((action) => !earlyActions.includes(action.type))

  return <div id="decisions">
    <p class="intro">
      {decisions.outstanding.length > 0 && 'There are outstanding decisions requiring your attention. '}
      {decisions.outstanding.length == 0 && `All done for the year? Before moving on, make sure you've reviewed every tab.`}
    </p>
    <div class={style.timeline}>
      <div>
        <h2>{state.year}</h2>
        {!state.finished && filteredActionsAfter.length > 0 && <div stage="actions" class={style.actions}>
          {filteredActionsAfter.slice().reverse().map((action) => <Event.Action.auto state={state} {...action} open={state === state} />)}
        </div>}
        {!state.finished && applicableDecisions.length > 0 && <div stage="decisions">
          {applicableDecisions.map((decision) =>
            <Decision {...decision} onDialog={input.onDialog} state={state} />)}
        </div>}
        {!state.finished && filteredActionsBefore.length > 0 && <div stage="actions" class={style.actions}>
          {filteredActionsBefore.slice().reverse().map((action) => <Event.Action.auto state={state} {...action} open={state === state} />)}
        </div>}
      </div>
    </div>

    {years.map((year) => {
      const actions = log
        .filter((action) => action.year === year.year && !action.hidden)
      return <div class={style.timeline}>
        <div>
          <h2>{year.year}</h2>
          {actions.length > 0 && <div stage="actions" class={style.actions}>
            {actions.map((action) => <Event.Action.auto {...action} state={year} />)}
          </div>}
        </div>
      </div>
    })}
    {(state.turn === -1 || (years[years.length - 1] && years[years.length - 1].turn == -1)) && <div class={style.initial} id="plane">
      <img src="/assets/images/illustrations/plane.png" />
      <p><strong>{formatters.name(user.name)}</strong>, you're 18 years old and have your whole life ahead of you. What will your investment journey look like?</p>
    </div>}
  </div>
}