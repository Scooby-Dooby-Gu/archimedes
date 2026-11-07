
import { Icon, Decision } from '../components'
import { Grid } from '/components/index.jsx';
import * as formatters from '/lib/formatters';
import { useMemo } from 'preact/hooks';
import style from './style.module.scss';

export default function PaperChaseCareer({ input, decisions, state, actions, log}) {
  const { 
    year, 
    study, education, educations,
    job, experience, salary, salaryExpectation
  } = state;

  const applicableDecisions = decisions.presented.filter((decision) => 
    decision.choice.type === 'career')

  const employedYears = state.history.map((year, index) => {
    if (year.job && (!state.history[index + 1] || !state.history[index + 1].job || (state.history[index + 1].job && state.history[index + 1].job.id !== year.job.id))) {
      return year;
    }
  }).filter(Boolean).reverse();

  const educationList = (study ? [study] : []).concat(educations);
  
  return <div class="centered">
    <p class={`${style.intro} intro`}>
      Manage your career trajectory here. Higher education unlocks better earning jobs at a cost. Set your <a href="/courses/1/lessons/77">401(k)</a> participation to be deducted from your salary and have the company match applied.
    </p>
    {employedYears.length > 0 && <section class={style.section}>
      <h2><Icon.Career /> Career</h2>
      <ul class={style.list}>
        {state.business && <li class={style.current}>
          <aside>{formatters.currency(state.business.salary )}/yr</aside>
          <h3>Owner of {state.business.name}</h3>
          <dl>
            <dt>Year inherited</dt>
            <dd>{state.business.year}</dd>
            <dt>Valuation</dt>
            <dd>{formatters.currency(state.business.valuation)}</dd>
          </dl>
        </li>}
        {employedYears.map((employedYear, index) => {
          const current = job && employedYear.job.id === job.id;
          const stocks = employedYear.job.ticker ? state.corporatePortfolio.find((company) => company.ticker == employedYear.job.ticker) : null;
          const vestedThisYear = stocks && stocks.credit.find((action) => action.year === state.year)
          const exercisedOptions = actions.concat(log).find((action) => action.type === 'exercise' && action.id === employedYear.job.id);
          return <li class={index === 0 ? style.current : style.old}>
            <aside>
              {formatters.currency(employedYear.salary)}/yr
            </aside>

            <h3>{current ? 'Currently working ' : 'Worked'} at {employedYear.job.context}</h3>
            <dl>
              <dt>{current ? 'Year job started' : 'Period of employment'}</dt>
              <dd>{current || employedYear.job.year === employedYear.year ? employedYear.job.year : employedYear.job.year + '-' + employedYear.year}</dd>
              {current && employedYear.job.retirementPlan && [
                <dt>401(k) contribution</dt>,
                <dd>{formatters.currency(employedYear.retirementContributionMatch1 + employedYear.retirementContributionMatch2)}</dd>
              ]}
              {stocks && [
                <dt class={style.separate}>Shares received</dt>,
                <dd class={style.separate}>{stocks.amount}</dd>,
                vestedThisYear && [
                  <dt>Vested this year</dt>,
                  <dd>{vestedThisYear.amount}</dd>,
                ]
              ]}
              {state.options && state.options.id === employedYear.job.id && !exercisedOptions && [
                <dt class={style.separate}><strong>Unexercised options</strong></dt>,
                <dd class={style.separate}>{formatters.currency( salaryExpectation / 2)}</dd>
              ]}
              {exercisedOptions && [
                <dt class={style.separate}>Exercised options</dt>,
                <dd class={style.separate}>{formatters.currency( employedYear.salaryExpectation / 2)}</dd>
              ]}
            </dl>
          </li>
        })}
      </ul>
    </section>}

    {educationList.length > 0 && <section class={style.section}>
      <h2><Icon.Education /> Education</h2>
      <ul class={style.list}>
        
        {educationList.map((education, index) => <li class={index === 0 ? style.current : style.old}>
          <h3>{education.name}</h3>
          <p class={style.status}>
            {education === study && `Graduating in ${education.year + education.years}`}
            {education !== study && `Graduated in ${education.year + education.years}`}
          </p>
          {education === study && <progress value={year - education.year + 1} max={education.years} />} 
        </li>)}
      </ul>
    </section>}

    <br />

    {applicableDecisions.map((decision) => 
      <Decision {...decision} onDialog={input.onDialog} state={state} optional={decision.choice.year !== year} />)}
  </div>
}