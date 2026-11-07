
import { useRef, useMemo } from '/lib/hooks/index.jsx'
import * as formatters from '/lib/formatters'
import { Button } from '/components/index.jsx'
import LoanChart from '../charts/loan';
import { breakDownLoan } from '../lib/generators/loans'
import CashflowChart from '../charts/cashflow';
import TaxesChart from '../charts/taxes';
import { Icon, Decision, Ticker, Skill } from "../components";

import style from './style.module.scss';

export default function PaperChaseFinance({ 
  decisions, input, state, 
  params: { itemId }
}) {
  const applicableDecisions = decisions.presented.filter((decision) => 
    decision.choice.type === 'finance');

  const lastYear = state.previous;
  const taxes = state.debit.socialSecurity + state.debit.federalTax + state.debit.stateTax;

  const deltaNetWorth = state.networth - lastYear.networth;
  const deltaBalance = (state.creditTotal - state.debitTotal) - (lastYear.creditTotal - lastYear.debitTotal);
  
  const visibilityRef = useRef();
  useMemo(() => {
    if (itemId) {
      visibilityRef[itemId] = true;
    }
  }, [itemId]);

  return <div class="centered">
    <p class={`${style.intro} intro`}>Your yearly breakdown of income and expenses including salary, 
      <a href="/courses/11/lessons/84">dividend income</a>, 
      <a href="/courses/4/lessons/80">loan expenses</a>, 
      <a href="/courses/1/lessons/149">income tax</a>, 
      capital gains tax, 
      and total net worth. You can also monitor the outstanding loans and apply for additional loans.
    </p>
    <ul class={style.dashboard}>
      <li class={style.section}>
        <a onClick={(e) => input.onDialog('networth', null, e)}>
          <Icon.ChevronRight />
          <h2>Net worth</h2>
          <p class={style.big}>{formatters.currency(state.networth)}</p>
          <span class={style.ticker}>
            <Ticker delta={deltaNetWorth} number={formatters.currency(deltaNetWorth)} />
          </span>
          <dl>
            <dt>Cash</dt>
            <dd>{formatters.currency(state.cash)}</dd>
            <dt>Assets</dt>
            <dd>{formatters.currency((state.business ? state.business.valuation : 0) + state.assets.brokeragePortfolio + state.assets.retirementPortfolio + state.assets.retirement + state.assets.property)}</dd>
            <dt>Debt</dt>
            <dd>{formatters.currency(state.assets.schoolDebt + state.assets.personalDebt + state.assets.mortgageDebt)}</dd>
          </dl>
        </a>
      </li>
      <li class={style.section}>
        <a id="cash-flow-breakdown" onClick={(e) => input.onDialog('cashflow', null, e)}>
          <Icon.ChevronRight />
          <h2>Cash flow</h2>
          <p class={style.big}>{formatters.currency(state.creditTotal - state.debitTotal)}</p>
          <span class={style.ticker}>
            <Ticker delta={deltaBalance} number={formatters.currency(deltaBalance)} />
          </span>
          <dl>
            <dt>Income</dt>
            <dd>{formatters.currency(state.income)}</dd>
            <dt>Expenses</dt>
            <dd>{formatters.currency(state.expenses)}</dd>
            <dt>Taxes</dt>
            <dd>{formatters.currency(taxes)}</dd>
          </dl>
        </a>
      </li>
    </ul>
    {state.loans.length > 0 && <ul class={style.loans}>
      {state.loans.map((loan, index) => loan.sum > 0 && <li>
        <a id={`loan-${loan.id}`} href={`/games/paper-chase/finance/${loan.id === itemId ? '' : loan.id}`} disabled={!loan.rate && loan.kind === 'school' }>
          <div class={style.summary}>
            <h3>{loan.name}</h3>
            {loan.startingYear <= state.year && <progress value={loan.paidTotal} max={loan.total} />}
            {loan.startingYear > state.year && <p class={style.status}>Starts in {loan.startingYear}</p>}
            
          </div>
          <aside>
            {itemId == loan.id ? <Icon.Up /> : <Icon.Down />}
            <div class={style.payment}>{formatters.currency(-loan.yearlyPayment)}/yr</div>
            <div class={style.terms}>{formatters.currency(loan.sum)} 
              {loan.rate > 0 && <>&nbsp;at {formatters.rate(loan.rate + loan.riskFreeRate)}</>}
            </div>
          </aside>
        </a>
        <div class={style.details} hidden={loan.id !== itemId}>
          {visibilityRef[loan.id] && <LoanChart breakdown={breakDownLoan(loan)} year={loan.year} />}
          <div class={style.actions}>
            <Button disabled={state.cash < 10000} class="secondary primary" onClick={(e) => { input.onAction({type: 'prepay', kind: loan.kind, id: loan.id, amount: 10000}); e.preventDefault(); e.stopPropagation()}}>Prepay $10K</Button>
            <Button disabled={loan.riskFreeRate <= state.riskFreeRate} class="secondary primary" onClick={(e) => { input.onAction({type: 'refinance', id: loan.id }); e.preventDefault(); e.stopPropagation()}}>Refinance at {formatters.rate(loan.rate + state.riskFreeRate)}</Button>
          </div>
        </div>
      </li>)}
    </ul>}

    {applicableDecisions.map((decision) => 
      <Decision {...decision} onDialog={input.onDialog} state={state} optional={true} />)}
  </div>

}