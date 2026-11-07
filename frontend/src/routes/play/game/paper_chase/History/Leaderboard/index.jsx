import { User, Button, Grid } from '/components/index.jsx';
import style from './style.module.scss';
import { useState, useFetchedData } from "/lib/hooks";
import * as formatters from '/lib/formatters';
import Icon from '../../components/Icon';

export default function Leaderboard({attempt, data: {user, company}, state, gameId, input}) {
  const turn = state.turn - 1;

  const [allPlayers, showAllPlayers] = useState(true)

  const [leaderboardData, leaderboardRequest, leaderboardReload] = useFetchedData(
    `/games/${gameId}/sessions?difficulty=${state.difficulty}&turn=${turn}&filter=${allPlayers ? 'all' : 'friends'}&companyId=${company ? company.id : ''}`,
    {invalidate: turn}
  );

  return <div class={style.leaderboard}>
  <Icon.Close onClick={() => input.onDialog()} class={style.close} />
  <h2>Leaderboard</h2>
  <p>{state.difficulty} difficulty</p>
  {<Grid
    class={style.tabs}
    type="tabs"
    headers={[
      {name: 'Link', type: 'link'},
      {name: 'Name'},
    ]}

    rows={[
      [
        '',
        `My squad`,
        null,
        {class: !allPlayers && 'selected', onClick: (e) => {
          showAllPlayers(false);
          e.preventDefault()
          e.stopPropagation()
        }}
      ],
      [
        '',
        'All players',
        {class: allPlayers && 'selected', onClick: (e) => {
          showAllPlayers(true);
          e.preventDefault()
          e.stopPropagation()
        }}
      ],
    ]} 
  />}
  <Top leaderboardData={leaderboardData} user={user} attempt={attempt} />
  <Grid
  class={style.places}
  type="list"
  headers={[
    {name: 'Link', type: 'link'},
    {name: 'Icon', type: 'icon'},
    {name: 'Person'},
    {name: 'Note', type: 'after'},
    {name: 'Score', type: 'right'},
  ]}
  rows={leaderboardData.slice(3).map((leader, index) => [
    `/users/${leader.user.id}`,
    <span class={style.rank}>{index + 4}</span>,
    <User user={leader.user} />,
    
    leader.user.id === user.id && attempt !== leader.attempt ? 'Previous best' : null,
    <div class={style.scores}>
      <span class={style.score}>
        {leader.isPlaceholder ? null : formatters.currency(leader.scores.total) + (turn == null ? ' at ' + (leader.turn + 18) : '')}
      </span>
      <span class={style.scores}>
        {leader.isPlaceholder&& <span class={style.evidence}><Icon.Search />{leader.scores.evidence || 0}</span>}
        {leader.isPlaceholder || leader.scores.achievements > 0 && <span class={style.achievements}><Icon.Challenge />{leader.scores.achievements || 0}</span>}
      </span>
    </div>,
    {class: user.id === leader.user.id && style.you}
  ])} 
/>
</div>
}


Leaderboard.Top = ({attempt, data: {user, company}, state, gameId, input}) => {
  const turn = state.turn - 1;

  const [allPlayers, showAllPlayers] = useState(true)

  const [leaderboardData, leaderboardRequest, leaderboardReload] = useFetchedData(
    `/games/${gameId}/sessions?difficulty=${state.difficulty}&turn=${turn}&filter=${allPlayers ? 'all' : 'friends'}&companyId=${company ? company.id : ''}`,
    {invalidate: turn}
  );

  return <Top leaderboardData={leaderboardData} user={user} attempt={attempt} />
}

const Top = ({leaderboardData, attempt, user}) => {
  return <ul class={style.top}>
    {leaderboardData.slice(0, 3).map((leader, index) => <li class={`${style['place_' + (index + 1)]} ${user.id === leader.user.id && style.you}`}>
      <span class={style.rank}>{index + 1}</span>
      <div><User user={leader.user} /></div>
      <span class={style.score}>
        {leader.isPlaceholder ? "$" : formatters.currency(leader.scores.total)}
      </span>
      {leader.user.id === user.id && attempt !== leader.attempt && <span class={style.previous}>Previous best</span>}
      <span class={style.scores}>
        {leader.isPlaceholder || leader.scores.evidence > 0 && <span class={style.evidence}><Icon.Search />{leader.isPlaceholder ? " " : leader.scores.evidence || 0}</span>}
        {leader.isPlaceholder || leader.scores.achievements > 0 && <span class={style.achievements}><Icon.Challenge />{leader.isPlaceholder ? " " : leader.scores.achievements || 0}</span>}
      </span>
    </li>)}
  </ul>
}