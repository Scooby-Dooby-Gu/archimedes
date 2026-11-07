import { Event, Ticker, Icon } from "../../components"
import style from './style.module.scss';
import EconomyChart from '../../charts/economy';
import * as formatters from '/lib/formatters'
import { useState } from "/lib/hooks";



export default function({ state, future, input, params: { dialog: { page }}, input: { onDialog } }) {
  const years = future.history;
  const [year, setYear] = useState(state);
  
  return [
    <a onClick={() => input.onDialog()} class={style.close}><Icon.Close /></a>,
    <h1>Economy performance {year !== state && 'in ' + year.year || ''}</h1>,
    <div class={style.chart} onMouseLeave={() => setYear(state)}>
      <EconomyChart states={years} name={name} height={200} tooltip={{
        custom: (data) => {
          setYear(years[data.dataPointIndex])
          return '';
        }
      }} />
    </div>,
    <dl class={style.stats}>
      <dt><span class={style.color} style="background-color: rgb(208, 155, 92);"></span>Market fund return</dt>
      <dd>{formatters.rate(year.tickers.find((c) => c.name === 'Market').return)}</dd>
      <dt><span class={style.color} style="background-color: rgb(41, 44, 71);"></span>Market force change</dt>
      <dd>{formatters.rate(year.marketForce - (year.previous.marketForce || 1))}</dd>
      <dt><span class={style.color} style="background-color: #ccc;"></span>Market composite  force</dt>
      <dd>{(year.marketCompositeForce.toFixed(2))}</dd>
      <dt><span class={style.color} style="background-color: red;"></span>Market composite force target</dt>
      <dd>{(year.marketCompositeForceTarget.toFixed(2))}</dd>
      <dt><span class={style.color} style="background-color: rgb(141, 186, 150);"></span>Market fund price</dt>
      <dd>{formatters.currency(year.tickers.find((c) => c.name === 'Market').price)}</dd>
    </dl>,
    
    year.events.length > 0 && <ul class={style.news}>
      {Object.keys(year.news).map((name) => 
       <li><Event.news {...year.news[name].event} meta={JSON.stringify(year.news[name].event.effects)} description={year.news[name].event.description + '\n\n*' + year.news[name].event.meta + '*'} title={name + ' / ' + year.news[name].chainName + ' / ' + year.news[name].event.title} /></li>)}
      
    </ul>,
  ]
}