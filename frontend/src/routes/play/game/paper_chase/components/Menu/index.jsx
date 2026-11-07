import style from './style.module.scss';
import Ticker from "../Ticker";
import * as formatter from '/lib/formatters';
import { useCallback } from '/lib/hooks/index.jsx';
import { useMemo, useRef } from "preact/hooks";

export default function Menu({world: { state }, progression, params: { dialog } , params, hidden, input}) {
  const section = params.section;
  const previous = state.previous;
  const stocks = state.assets.brokeragePortfolio + state.assets.retirementPortfolio;
  const previousStocks = previous.assets.brokeragePortfolio + previous.assets.retirementPortfolio;
  const stocksBalance = (stocks - previousStocks)
  const propertyBalance = state.credit.rentCollected - state.debit.propertyTax - state.debit.rent - state.debit.mortgagePayment;
  const cashBalance = state.cash - previous.cash;
  const propertyEnabled = propertyBalance || state.residence;
  const investmentsEnabled = state.assets.stocks > 0 || state.age > 18;
  const careerEnabled = state.study || state.education || state.job;
  const financeEnabled = state.choices.difficulty;
  const economyEnabled = state.choices.joinedInvestmentClub;
  const onClick = useCallback((e) => {
    if (params.dialog.open) {
      input.onDialog()
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const renderRef = useRef();
  if (!renderRef.current) renderRef.current = 0;
  if (!progression.saving && !progression.active && !dialog.open) {
    renderRef.current++;
  }

  const items = useMemo(() => [
    <li id="news-tab" class={`${style.narrow}`} hidden={!economyEnabled}><a class={`${style.tab} ${(section === 'economy') && style.active }`} href="/games/paper-chase/economy">
      Economy
      <span class={style.menu_ticker}>
        Year {state.year}
      </span>
    </a></li>,
    <li id="property-tab" hidden={!propertyEnabled}><a class={`${style.tab} ${section === 'property' && style.active}`}  href="/games/paper-chase/property">
      Property 
      <span class={style.menu_ticker}>
        {propertyBalance || state.residence ? <Ticker format="sign" delta={propertyBalance} number={formatter.currency(propertyBalance)} /> : <span class="gray">None</span>}
      </span>
    </a></li>,
    <li id="investments-tab" hidden={!investmentsEnabled}><a class={`${style.tab} ${section == 'investments' && style.active}`}  href="/games/paper-chase/investments">
      Investments 
      <span class={style.menu_ticker}>
        {stocks > 0 ? <Ticker delta={stocksBalance} number={formatter.currency(stocksBalance)} /> : <span class="gray">None</span>}
      </span>
    </a></li>,
    <li id="career-tab" hidden={!careerEnabled}><a class={`${style.tab} ${section === 'career' && style.active}`}  href="/games/paper-chase/career">
      Career 
      <span class={style.menu_ticker}>
        {state.study && <span class="gray">In {state.study.tier === 'college' ? 'college' : 'grad school'}</span>}
        {state.job && <Ticker format="sign" delta={state.salary - previous.salary} number={formatter.currency(state.salary)} />}
        {!state.study && !state.job && state.education && <span class="gray">After {state.education.tier}</span>}
        {!state.study && !state.job && !state.education && <span class="gray">None</span>}
      </span>
    </a></li>,
    <li id="finance-tab" hidden={!financeEnabled}><a class={`${style.tab} ${section === 'finance' && style.active}`}  href="/games/paper-chase/finance">
      <span class="nowrap">Bank</span>
      <span class={style.menu_ticker}>{cashBalance ? <Ticker unit="$" delta={cashBalance} number={formatter.currency(state.cash)} /> : ' ‎'}</span>
    </a></li>
  ], [renderRef.current])
  
  return <ul class={style.menu} hidden={hidden} onClickCapture={onClick} id="game-menu">
    {items}
  </ul>
}