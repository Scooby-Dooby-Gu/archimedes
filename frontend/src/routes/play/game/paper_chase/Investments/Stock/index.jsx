import { Button } from '/components/index.jsx'
import style from './style.module.scss';
import MarketChart from '../../charts/market';
import * as formatters from '/lib/formatters'
import { useState, useCallback, useRef } from "/lib/hooks";
import { getSkills } from "/lib/data";
import { getApplicableInvestments } from "../index.jsx";
import { Ticker, Icon, Event } from '../../components';


export function Inventory({ amount, ticker, disabled, title, kind, actions, input, max, text}) {
  const onClick = useCallback((e) => {
    if (inputRef.current.value != amount) {
      e.stopPropagation();
      e.preventDefault();
      inputRef.current.blur();
    } else if (e.target.getAttribute('action') === 'buy') {
      input.onAction({
        type: 'buy', 
        name: ticker.name, 
        amount: ticker.buyAmount || 100, 
        kind: kind})
      e.stopPropagation();
      e.preventDefault();
      inputRef.current.focus();
    } else if (e.target.getAttribute('action') === 'sell') {
      input.onAction({
        type: 'sell', 
        name: ticker.name, 
        amount: ticker.buyAmount || 100, 
        kind: kind
      })
      e.stopPropagation();
      e.preventDefault();
      inputRef.current.focus();
    }
  }, [amount])
  const onChange = useCallback((e) => {
    const value = parseInt(e.target.value, 10) - amount;
    if (!isNaN(value)) {
      if (value > 0) {
        input.onAction({
          type: 'buy', 
          name: ticker.name, 
          amount: value, 
          kind: kind})
      } else if (value < 0) {
        input.onAction({
          type: 'sell', 
          name: ticker.name, 
          amount: -value, 
          kind: kind
        })
      }
    } else {
      e.target.value = amount;
    }
  }, [amount])
  const ref = useRef();
  const inputRef = useRef();
  return <div class={style.inventory} ref={ref} onMouseDown={onClick}>
    <Button class=" compact" disabled={amount == 0} action="sell">Sell</Button>
    <span class={style.amount}>
      <span class={style.account}>{title}</span><strong>{amount}</strong> {ticker.kind == 'bond' ? 'bond' : 'stock'}{amount == 1 ? '' : 's'}
      <input ref={inputRef} onBlurCapture={onChange} name={kind} type="number" step={ticker.buyAmount || 100} pattern="[0-9]*" value={amount} />
      <p>{text}</p>
    </span>
    <Button class=" primary compact" disabled={disabled} action="buy" hidden={max <= amount}>{kind === 'corporate' ? 'Buy back' : 'Buy'}</Button>
  </div>
}


export default function({ state, actions, future, data: { user, submissions, courses }, input, params: { dialog: { page }} }) {

  const [stockName, setStockName] = useState(page);
  const [year, setYear] = useState(state);
  const ticker = year.tickers.find((ticker) => ticker.name == stockName)
  if (!ticker) return;
  const holding = state.portfolio.find((stock) => (stock.name === ticker.name)) || {};
  const investmentAmount = holding.personal ? holding.personal.amount : 0;
  const corporateAmount = holding.corporate ? holding.corporate.amount : 0;
  const retirementAmount = holding.retirement ? holding.retirement.amount : 0;
  const years = state.history;

  const onClick = (e) => {
    const row = e.target.closest('tr[portfolio]');
    if (row) {
      input.onDialog('portfolio', row.getAttribute('portfolio'), e)
    }
  }

  const groups = getApplicableInvestments(state);
  var list = Object.values(groups).flat();
  var index = list.findIndex((item) => item.name == ticker.name);

  const onPrevious = (e) => {
    setStockName(list[(index - 1 + list.length) % list.length].name)
    e.preventDefault();
    e.stopPropagation();
  }
  const onNext = (e) => {
    setStockName(list[(index + 1) % list.length].name)
    e.preventDefault();
    e.stopPropagation();
  }
  
  const isPresent = year.year === state.year;

  const skills = getSkills(submissions, courses);
  const trader = skills.find((skill) => skill.name === 'Stock trader');
  
  const ops = holding.credit ? holding.credit.slice().reverse().concat(holding.debit.slice().reverse()).sort((a, b)  => b.year - a.year): [];
  return [
    <a onClick={() => input.onDialog()} class={style.close}><Icon.Close /></a>,
    <div class={style.bar}>
      <a class={style.previous} onClick={onPrevious}><Icon.ChevronLeft /></a>
      <div>
        <p class={style.kind}>{formatters.titlize(ticker.kind)}</p>
        <h1 class="ellipsis">{ticker.name} {year.year !== state.year ? ` in ${year.year}` : ''}</h1>
      </div>
      <a class={style.next} onClick={onNext}><Icon.ChevronRight /></a>
    </div>,

    <div class={style.chart} onMouseLeave={() => setYear(state)}>
      <MarketChart level={trader.points} states={years} tickers={[ticker]} showMore={false && user.role != 'user'}  height="200" tooltip={{
        custom: (data) => {
          //setYear(years[data.dataPointIndex])
          return '';
        }
      }} />
    </div>,

    ticker.kind !== 'researched' && <dl class={style.stats}>
      <dt><span class={style.color} style="background-color: rgb(141, 186, 150);"></span>Price</dt>
      <dd><Ticker.Stock name={ticker.name} state={state} before="" />{formatters.currency(ticker.price)}</dd>
      {trader && trader.points > 2 && <dt><span class={style.color} style="background-color: rgba(208, 155, 92, 0.8);"></span>Alpha</dt>}
      {trader && trader.points > 2 && <dd><span class={style.row} id="stock-alpha"></span>{ticker.alpha.toFixed(2)}</dd>}
      {trader && trader.points > 1 && <dt><span class={style.color}></span>Beta</dt>}
      {trader && trader.points > 1 && <dd><span class={style.row} id="stock-beta"></span>{ticker.beta.toFixed(2)}</dd>}
      {isPresent && ticker.kind == 'bond' && <dt><span class={style.color}></span>Coupon</dt>}
      {isPresent && ticker.kind == 'bond' && <dd><span class={style.row} id="stock-coupon"></span>{formatters.rate(ticker.interest)}</dd>}
      {isPresent && <dt><span class={style.color}></span>{ticker.kind === 'bond' ? 'Yield' : 'Dividends'}</dt>}
      {isPresent && <dd><span class={style.row} id="stock-yield"></span>{formatters.rate(ticker.dividends || ticker.yield || ticker.interest)}</dd>}
      {isPresent && <dt><span class={style.color} style="background-color: transparent;"></span>Return</dt>}
      {isPresent && <dd><span class={style.color}></span>{holding.paidPrice ? formatters.currency(holding.currentPrice - holding.paidPrice) : 'N/A'}</dd>}
      {ticker.kind === 'mutualFund' && state.retirementSavings > 0 && <dt class="separate"><span class={style.color} style="background-color: transparent;"></span>Retirement savings</dt>}
      {ticker.kind === 'mutualFund' && state.retirementSavings > 0 && <dd class="separate">{formatters.currency(state.retirementSavings)}</dd>}
      {isPresent && ticker.years && <dt><span class={style.color}></span>Term</dt>}
      {isPresent && ticker.years && <dd><span class={style.row} id="stock-coupon"></span>{ticker.years} years</dd>}
      
    </dl>,
    
    (isPresent && ticker.kind !== 'researched' && (state.cash > ticker.price || investmentAmount > 0)) && 
      <Inventory input={input} actions={actions} disabled={state.cash < ticker.price} title="Brokerage" kind="personal" ticker={ticker} amount={investmentAmount} text={`Available cash: ${formatters.currency(state.cash)}. Price: ${formatters.currency(ticker.price)}`} />,
      isPresent && (corporateAmount > 0 || holding.corporate && holding.corporate.startingAmount > 0) && 
      <Inventory input={input} actions={actions} kind="corporate" title="RSUs" ticker={ticker} amount={corporateAmount} max={holding.corporate.startingAmount} text={`Price: ${formatters.currency(ticker.price)}`} />,
      isPresent && ticker.kind === 'mutualFund' && (retirementAmount > 0 || state.retirementSavings >= ticker.price) &&
      <Inventory input={input} actions={actions} disabled={state.retirementSavings < ticker.price} kind="retirement" title="401(k)" ticker={ticker} amount={retirementAmount} text={`Available savings ${formatters.currency(state.retirementSavings)}. Price: ${formatters.currency(ticker.price)}`} />,


    ticker.events && ticker.events.length > 0 && <section class={style.news}>
      {ticker.events.map((event) => <Event.news {...event} />)}
    </section>,
    ticker.kind === 'researched' && [<br />],
    isPresent && <p class={style.description}>{ticker.description}</p>,

    ops.length > 0 && isPresent && <section class={style.operations}>
      <table class={style.table} onClick={onClick}>
        <thead class={style.legend}>
          <tr>
            <th class={style.year}>
              Year
            </th>
            <th class={style.operation}>
              Operation
            </th>
            <th>
              Type
            </th>
            <th class={style.amount}>
              Change
            </th>
            <th class={style.price}>
              Price
            </th>
          </tr>
        </thead>

        {ops.map((op) => {
          const kind = op.kind === 'retirement' ? '401(k)' :
          op.kind === 'corporate' ? 'RSUs' :
                      'Taxable';
          const type = op.type === 'buy' ? 'Bought' :
                      op.type === 'sell' ? 'Sold' :
                      op.type === 'redeem' ? 'Redeemed' : 'Acquired';
                      
          return <thead class={style.heading}>
            <tr portfolio={op.kind}>
              <th class={style.year}>
                {op.year}
              </th>
              <th class={style.operation}>
                {type}
              </th>
              <th>
                <span class="gray">{kind}</span>
                <br />
                {op.type === 'sell' || op.type === 'redeem' ? ' from ' + op.bucket.year : ''}
                {ticker.kind === 'bond' && op.type === 'buy' && formatters.rate(op.interest) + ' coupon'}
              </th>
              <th class={style.amount}>
                {op.type == 'sell' || op.type === 'redeem' ? <strong>-{op.amount}</strong> : <strong>+{op.amount}</strong>}
              </th>
              <th class={style.price}>
                <span class="gray">
                  {formatters.currency(op.price)}
                  {op.type === 'sell' ? <Ticker delta={op.price - op.bucket.price} number={formatters.currency(op.price - op.bucket.price)} /> : null}
                </span>
              </th>
            </tr>
          </thead>
        })}

      </table>
    </section>
  ]
}