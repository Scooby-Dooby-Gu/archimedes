
import { Grid, Button } from '/components/index.jsx'
import { Icon, Ticker, Skill, Decision } from '../components';
import * as formatters from '/lib/formatters';
import style from './style.module.scss';
import { useState, useCallback, useRef } from '/lib/hooks/index.jsx';
import MarketChart from '../charts/market';
import { getSkills } from '/lib/data';

const labels = {
  researched: 'Researched',
  stock: 'Chosen stocks',
  bond: 'Bonds',
  mutualFund: 'Mutual Funds'
}

export function getApplicableInvestments(state, type) {
  return state.tickers.reduce((groups, ticker) => {
    const company = state.companies.find((company) => company.name === ticker.name)
    const holding = state.portfolio.find((stock) => (stock.name === ticker.name)) || {};
    if (company && company.ticker == "EVIL") {
      if (!state.choices.researchingEVIL) return groups;
    } else {
      if (!type && company && (!state.choices.investmentSectors.some((s) => s.industries.includes(company.industry))) && (!holding || (!holding.amount && !holding.startingAmount))) {
        return groups;
      }
      if (ticker.hidden) {
        return groups;
      }
    }
    (groups[labels[ticker.kind]] || (groups[labels[ticker.kind]] = [])).push(ticker)
    return groups;
  }, {})
  
}

export default function PaperChaseStocks({
  decisions,
  data: { user, courses, submissions }, 
  world: { future },
  params: { itemId },
  input,
  state, 
  actions, 
}) {
  const applicableDecisions = decisions.presented.filter((decision) => 
    decision.choice.type === 'investments' && decision.actions.length == 0);

  const brokerageTotal = state.brokeragePortfolio.reduce((sum, holding) => sum + holding.currentPrice, 0);
  const retirementTotal = state.retirementPortfolio.reduce((sum, holding) => sum + holding.currentPrice, 0);
  
  const brokeragePrevious = state.previous.personalPortfolio.concat(state.previous.corporatePortfolio);
  const brokerageDelta = brokerageTotal - brokeragePrevious.reduce((sum, holding) => sum + holding.currentPrice, 0);
  const retirementDelta = retirementTotal - state.previous.retirementPortfolio.reduce((sum, holding) => sum + holding.currentPrice, 0);

  const groups = getApplicableInvestments(state, itemId);
  
  const skills = getSkills(submissions, courses);
  const trader = skills.find((skill) => skill.name === 'Stock trader');
  
  return <div class="centered">
    {!itemId && <p class={`${style.intro} intro`}>
      A watchlist for all the purchasable tickers broken down by stocks, bonds and mutual funds. 
      <a href="/courses/2/lessons/82">Stocks</a> and 
      <a href="/courses/10/lessons/142">Bonds</a> 
      can be purchased or sold for your brokerage account. 
      <a href="/courses/6/lessons/83">Mutual funds</a> 
      can be traded for your brokerage account or retirement account. 
    </p>}
    <ul class={style.dashboard}>
      <li class={style.section} id="brokerage-portfolio">
        <a onClick={(e) => input.onDialog('portfolio', 'brokerage', e)}>
          <Icon.ChevronRight />
          <h2>Brokerage portfolio</h2>
          <p class={style.big}>{formatters.currency(brokerageTotal)}</p>
          <span class={style.ticker}>
            <Ticker delta={brokerageDelta} number={formatters.currency(brokerageDelta)} />
          </span>
          <dl>
            <dt>Dividends</dt>
            <dd>{formatters.currency(state.dividends)}</dd>
            {trader && trader.points > 2 && <dt>Alpha</dt>}
            {trader && trader.points > 2 && <dd>{state.brokeragePortfolio[0] ? state.brokeragePortfolio[0].alpha.toFixed(2) : 'N/A'}</dd>}
            {trader && trader.points > 1 && <dt>Beta</dt>}
            {trader && trader.points > 1 && <dd>{state.brokeragePortfolio[0] ? state.brokeragePortfolio[0].beta.toFixed(2) : 'N/A'}</dd>}
          </dl>
        </a>
      </li>
      <li class={style.section}>
        <a onClick={(e) => input.onDialog('portfolio', 'retirement', e)}>
          <Icon.ChevronRight />
          <h2>401(k) portfolio</h2>
          <p class={style.big}>{formatters.currency(retirementTotal)}</p>
          <span class={style.ticker}>
            <Ticker delta={retirementDelta} number={formatters.currency(retirementDelta)} />
          </span>
          <dl>
            <dt>Dividends</dt>
            <dd>{formatters.currency(state.retirementPortfolioInterest)}</dd>
            {trader && trader.points > 2 && <dt>Alpha</dt>}
            {trader && trader.points > 2 && <dd>{state.retirementPortfolio[0] ? state.retirementPortfolio[0].alpha.toFixed(2) : 'N/A'}</dd>}
            {trader && trader.points > 1 && <dt>Beta</dt>}
            {trader && trader.points > 1 && <dd>{state.retirementPortfolio[0] ? state.retirementPortfolio[0].beta.toFixed(2) : 'N/A'}</dd>}
          </dl>
        </a>
      </li>
    </ul>
  
    {applicableDecisions.map((decision) => 
      <Decision {...decision} onDialog={input.onDialog} state={state} optional={true} />)}

    {itemId === 'brokerage' && <p class={`${style.intro} intro`}>This is your taxable brokerage account you set up with grandma and it is where you can purchase stocks, bonds, and mutual funds. All gains will be taxed as <a href="/courses">Long term capital gains</a> or <a href="/courses">Short term capital gains</a>.</p>}
    {itemId === 'retirement' && <p class={`${style.intro} intro`}>This is your retirement account that’s accessible through your employer and to open an account you have to start participating and contribute to a <a href="/courses">401(k)</a>. You can only purchase mutual funds in this account and all gains will be taxed deferred.</p>}
    <Skill.ofUser title="Stock trader" description="Staying ahead of the curve" icon="BadgesStocks" theme="black" level={1} value={0} max={3} user={user} courses={courses} submissions={submissions} rewards={['Brokerage account', 'Beta calculations for stocks', 'Alpha calculations for stocks', 'Stock analysis']} />

    {Object.keys(groups).map((key) => {
      const tickers = groups[key];
      return <div class={style.group}>
        <h2>{key}</h2>
        <ul class={style.tickers}>
          {tickers.map((ticker) => {
            const holding = state.portfolio.find((stock) => (stock.name === ticker.name)) || {};
            const amount = holding.amount || 0;
            const investmentAmount = holding.personal ? holding.personal.amount : 0;
            const corporateAmount = holding.corporate ? holding.corporate.amount : 0;
            const retirementAmount = holding.retirement ? holding.retirement.amount : 0;
            return <div class={`${style.ticker} ${corporateAmount > 0 && 'has-rsus'}`} id={`stock-${ticker.ticker}`} onClick={(e) => {
              e.preventDefault()
              input.onDialog('stock', ticker.name, e)
            }}>
              {/*<aside class={style.stats}>
                <div class={style.alpha}>&alpha; <strong>{ticker.alpha.toFixed(2)}</strong></div>
                <div class={style.beta}>&beta; <strong>{ticker.beta.toFixed(2)}</strong></div>
              </aside>*/}
              {ticker.ticker == 'EVIL' ?
                <aside class={style.hidden}>
                  <span>???</span>
                  {ticker.events && ticker.events.length > 0 && <span class={`${style.news} news-indicator`}>News</span>}
                </aside>
                
              : <aside>
                <div class={style.price}>{formatters.currency(ticker.price)}</div>
                <Ticker.Stock name={ticker.name} state={state} before="" />
                {ticker.events && ticker.events.length > 0 && <span class={`${style.news} news-indicator`}>News</span>}
              </aside>}
              {<MarketChart.Sparkline states={ticker.ticker == 'EVIL' ? state.history.slice(0, -1) : state.history} ticker={ticker} width="100" height="40" stroke-width="1" />}
              <h3><a href="#">{ticker.name}</a></h3>
              <abbr>{ticker.industry || ticker.characteristic}</abbr>
              {amount > 0 && <p>
                You own <strong>
                {formatters.and([
                  investmentAmount > 0 && investmentAmount + ' taxable',
                  corporateAmount > 0 && corporateAmount + ' RSU',
                  retirementAmount > 0 && retirementAmount + ' retirement'
                ])}
                </strong> {ticker.kind == 'bond' ? 'bond' : 'share'}{amount > 1 ? 's' : ''}.
              </p>}
              {amount > 0 && holding.averagePrice != ticker.price && <p>
                Average cost: {formatters.currency(holding.averagePrice)} per {ticker.kind == 'bond' ? 'bond' : 'share'}.
              </p>}
            </div>
          })}
        </ul>
    
      </div>
      
    })}
    {user.role !== 'user' && user.role !== 'visitor' && [
      <br />,<br />,<br />,<br />,
      <Button icon="question" onClick={() => input.onDialog('economy')}>Economy performance</Button>,
    ]}
  </div>
}