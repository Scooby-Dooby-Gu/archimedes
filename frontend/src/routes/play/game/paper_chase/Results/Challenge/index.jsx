import style from './style.module.scss';
import { Avatar } from '/components/index.jsx';
import * as formatters from '/lib/formatters';

export default function Challenge({ score, failing, stalling, succeeding, kind, summary, passed, title, unit = 'currency', competitive, label = title, year, years, state, user, competition }) {
  const me =  (competition[kind] || []).find((ranking) => ranking.user.id == user.id);
  const top =  (competition[kind] || []).slice().shift();
  const yearsLeft = year + years - state.year;
  return <li class={style.challenge}>
    <div class={style.wrapper}>
      <ul class={style.top}>
        <li>
          {yearsLeft > 0 && <div class={`${style.timer} ${yearsLeft === 1 ? style.expiring : null}`}>{yearsLeft} {yearsLeft == 1 ? 'year' : 'years'} left</div>}
          {yearsLeft <= 0 && passed &&  <div class={`${style.timer} ${style.passed}`}>Passed{me && competitive !== false &&`: #${me.rank}`}</div>}
          {yearsLeft <= 0 && !passed && <div class={`${style.timer} ${style.failed}`}>Did not pass</div>}
        </li>
        <li>
        {me && me.score != null && (!top || top.score != 0) && unit !== 'boolean' && <>
          Your score:
          {succeeding && <strong class={style.up}> {formatters[unit](me.score)}▲</strong>}
          {(failing) && <strong class={style.down}> {formatters[unit](me.score)}▼</strong>}
          {!succeeding && !failing && unit === 'years' && <strong class={style.down}> {formatters[unit](me.score)}</strong>}
          {!succeeding && !failing &&  unit !== 'years' && <strong> {formatters[unit](me.score)}</strong>}
        </>}
        </li>
        <li>
        {top && competitive !== false && top.score != null && top.score != 0 && unit !== 'boolean' && <>
          Top score: <strong>{formatters[unit](top.max)}</strong>
        </>}
        </li>
      </ul>
      <div class={style.summary}>
        <div class={style.information}>
          {competitive !== false && <Race kind={kind} unit={unit} class="compact" competition={competition} user={user} />}
          <h3>{label}</h3>
          <p>{summary}</p>
        </div>
      </div>
    </div>
  </li>
}

export function Race({ kind, competition, user, className, unit = 'currency' }) {
  const rankings = (competition[kind] || []).slice().reverse().sort((a, b) => {
    return (b.number - a.number)
  })
  const me = rankings && rankings.find((ranking) => ranking.user.id == user.id);
  const list = me && me.number > 2 ? [me].concat(rankings.slice(-2)) : rankings.slice(-3)
  list.sort((a, b) => {
    return (b.rank - a.rank) || (a == me ? 1 : b == me ? -1 : 0)
  })
  // dont show widget if best score is 0
  if (list[list.length - 1] && list[list.length - 1].score == 0) return;
  return <div class={`${style.race} ${className}`} tabIndex="0">
  <ul class={style.places}>
    {list.map((ranking) => <li class={user.id == ranking.user.id ? style.you : ranking.number == 1 ? style.winner : null}>
      <span class={style.place}>{ranking.rank}</span>
      <Avatar user={ranking.user}  />
      <span class={style.value}>{formatters[unit](ranking.score)}</span>
    </li>)}
  </ul>
</div>
}