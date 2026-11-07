import style from '../../style.module.scss';
export default function Ticker({ before, prefix, delta, number, suffix, after, format = 'triangle'})  {
  const d = parseFloat(parseFloat(delta).toFixed(2))
  const num = number || Math.abs(d);
  const sign = d > 0 ? (format === 'sign' ? '+' : '▲') : (format === 'sign' ? '' : '▼');
  return <strong>
    {before} 
    {<span class={d > 0 ? style.green : style.red}>{sign}{prefix}{num}{suffix}</span>}
    {after}
  </strong>
}

Ticker.Stock = ({ name, state, before}) => {
  const stock = state.tickers.find((s) => s.name == name);
  const delta = parseFloat((stock.price - stock.previousPrice).toFixed(2))
  return Ticker({ before: before == null ? name : before, delta })
}