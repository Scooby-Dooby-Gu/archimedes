import { Ticker, Icon } from "../../components"
import style from './style.module.scss';
import PortfolioChart from '../../charts/portfolio';
import * as formatters from '/lib/formatters'
import { useState } from "/lib/hooks";
import { getSkills } from "/lib/data";



export default function({ data: { user, submissions, courses } , state, input, params: { dialog: { page }}, input: { onDialog } }) {
  const name = page === 'brokerage' ? 'brokeragePortfolio' : 'retirementPortfolio'
  const onToggle = (e) => {
    e.target.closest('small').setAttribute('hidden', 'hidden')
    e.target.closest('thead').nextElementSibling.removeAttribute('hidden')
    e.preventDefault();
    e.stopPropagation();
  }
  const onStockClick = (e) => {
    const row = e.target.closest('tr[stock]')
    input.onDialog('stock', row.getAttribute('stock'), e);
    e.preventDefault();
    e.stopPropagation();
  }
  const years = state.history;
  const [year, setYear] = useState(state);
  const portfolio = year[name].slice().sort((a, b) => b.buckets[0].year - a.buckets[0].year)
  
  const portfolioToday = state[name].slice().sort((a, b) => b.buckets[0].year - a.buckets[0].year)

  const skills = getSkills(submissions, courses);
  const trader = skills.find((skill) => skill.name === 'Stock trader');
  
  
  return [
    <a onClick={() => input.onDialog()} class={style.close}><Icon.Close /></a>,
    <h1 class={style.header}>{page === 'retirement' ? '401(k)' : 'Brokerage'} portfolio {year.year !== state.year ? ` in ${year.year}` : ''}</h1>,
    <div class={style.chart} onMouseLeave={() => setYear(state)}>
      <PortfolioChart level={trader.points} states={years} name={name} height={200} tooltip={{
        custom: (data) => {
          //setYear(years[data.dataPointIndex])
          return '';
        }
      }} />
    </div>,
    <dl class={style.stats}>
      {trader && trader.points > 2 && <dt><span class={style.color} style="background-color: rgba(208, 155, 92, 0.8);"></span>Alpha</dt>}
      {trader && trader.points > 2 && <dd>{portfolio[0] ? portfolio[0].alpha.toFixed(2) : 0}</dd>}
      <dt><span class={style.color} style="background-color: rgba(65,65,65, 0.8);"></span>Return</dt>
      <dd>{portfolio[0] ? formatters.rate(portfolio[0].totalReturn) : 0}</dd>
      <dt><span class={style.color} style="background-color: rgb(141, 186, 150);"></span>Current value</dt>
      <dd>{formatters.currency(portfolio.reduce((sum, holding) => sum + holding.currentPrice, 0))}</dd>
      <dt><span class={style.color} style="background-color: transparent;"></span>Invested money</dt>
      <dd>{formatters.currency(portfolio.reduce((sum, holding) => sum + holding.paidPrice, 0))}</dd>
      <dt><span class={style.color} style="background-color: transparent;"></span>Total gains</dt>
      <dd>{formatters.currency(portfolio.reduce((sum, holding) => sum + holding.currentPrice - holding.paidPrice, 0))}</dd>
    </dl>,
    
    portfolioToday.length > 0 && <table class={style.table}>
      <thead class={style.legend}>
        <tr>
          <th>
            Stock name
          </th>
          <th class={style.amount}>
            Shares
          </th>
          <th>
            Paid price
          </th>
          <th>
            Current
          </th>
        </tr>
      </thead>

      {portfolioToday.map((holding) => {
        const buckets = holding.buckets.filter((bucket) => bucket.amount > 0)
        return buckets.length > 0 && [
          <thead class={style.heading} onClick={onStockClick}>
            <tr stock={holding.name}>
              <th>
                <a>{holding.name}</a>
                <small>
                  {buckets.length > 1 ? <a class={style.toggler} onClick={onToggle}>
                    {buckets[0].year} - {buckets[buckets.length - 1].year}
                    <Icon.Down />
                  </a> : <span>{buckets[0].year}</span>}
                </small>
              </th>
              <th class={style.amount}>
                {holding.amount}
              </th>
              <th>
                <span class="gray">
                  {formatters.currency(holding.averagePrice)}
                </span>
              </th>
              <th class={style.price}>
                <aside><Icon.ChevronRight /></aside>
                {formatters.currency(holding.price)} 
                <Ticker delta={holding.ticker.price - holding.ticker.previousPrice} number={formatters.currency(holding.ticker.price - holding.ticker.previousPrice)} />
              </th>
            </tr>
          </thead>,
          buckets.length > 1 && <tbody class={style.breakdown} hidden>
            {buckets.map((bucket) => <tr>
              <th>
                <small>{bucket.year}</small>
              </th>
              <td class={style.amount}>
                <small>{bucket.amount}</small>
              </td>
              <td>
                {formatters.currency(bucket.price)}
              </td>
            </tr>)}
          </tbody>
        ]
      })}

    </table>,
    portfolioToday.length === 0 && page === 'retirement' && <p class={style.empty}>Your retirement portfolio is empty. <br />Consider participating in 401(k) and allocating the savings.</p>,
    portfolioToday.length === 0 && page !== 'retirement' && <p class={style.empty}>Your portfolio is empty. <br />Consider buying some stocks or bonds.</p>
  ]
}