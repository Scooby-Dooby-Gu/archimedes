import { useConfetti } from "/lib/hooks";
import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import { Event, Icon } from '../components'
import { Button } from '/components/index.jsx'
import Challenge, { Race } from "./Challenge";

export default function Results({
  data: { achievementList, user, competition, session: { log, seed } },
  world: { state },
  input 
}) {

  const confettiRef = useConfetti(() => [{
    startVelocity: 35,
    spread: window.innerWidth / 4,
    particleCount: window.innerWidth / 2,
    ticks: 100,
    origin: {
        x: Math.random(),
        // since they fall down, start a bit higher than random
        y: Math.random() - 0
    },
    shapes: ['square'],
  }], 20000, 1500);
  confettiRef.paused = !state.finished;

  const ranking = competition.total && competition.total.find((ranking) => ranking.user.id == user.id);
  const consequences = state.consequences.filter((c) => !c.person);
  const evidence = state.evidence;
  const newEvidence = state.evidence.filter((e) => !state.previous.evidence.some((e2) => e2.title == e.title))
  const activeChallenges = Object.values(state.previous.activeChallenges)
  const pastChallenges = Object.values(state.previous.challenges).filter((c) => !c.active)
  const newAchievements = state.achievements.filter((a) => !state.previous.achievements.includes(a));
  const allAchievements = state.achievements.slice().sort((a, b) => +!!newAchievements.includes(a) - +!!newAchievements.includes(b)).reverse()
  return <div class="centered">
    {!state.finished && <p class={`${style.intro} intro`}>
      {state.turn > 0
        ? `We don't suggest making a lifetime of decisions all at once. Grab a snack, check out a lesson and they'll be here when you get back.`
        : `Awesome! This screen shows important updates as you take on Evil Corp. Let's start playing!`}
    </p>}
    {!confettiRef.paused && <canvas class={style.confetti} ref={confettiRef}></canvas>}
    <div id="results" class={style.results} style={{style: state.finished ? 'block' : 'none'}}>
      {state.difficulty && state.finished && ranking && <div stage="finish" class={`${style.finish}`}>
        <Icon.BadgesEducation  />
        <h2>Congratulations on placing #{ranking.rank}!</h2>
        <p>You finished this investment adventure on {state.choices.difficulty.value} difficulty</p>
        <p>Even though you've finished the story of Paper Chase, we're still living out our own investment journeys. We hope you picked up some useful lessons as you become a better investor.</p>
        <p>We'd love to hear about your experience, how we can help you learn more about investing, and what you'd like to see from us in the future. </p>
        <p>We get better with practice. Play through the game again to beat your high score or choose a higher difficulty if you're up for a challenge.</p>
        <Button.Link href="/boards/3/topics/10" class="primary">Write feedback</Button.Link>
        <Button.Link href={`/games/paper-chase/reset?seed=${seed + 1}`}>Restart the game</Button.Link>
      </div>}
      <div stage="report">
        {state.difficulty && ranking && <ul class={style.summary}>
          <li>
            <h3>You've turned {state.age}</h3>
            <dl>
              <dt>Net worth</dt>
              <dd>{formatters.currency(state.previous.networth)}</dd>
              <dt>Cash flow</dt>
              <dd>{formatters.currency(state.previous.creditTotal - state.previous.debitTotal)}</dd>
              <dt>Rank ({state.difficulty})</dt>
              <dd>{ranking.rank}</dd>
            </dl>
          </li>
          <li onClick={(e) => input.onDialog('leaderboard', null, e)}>
            <div>
              <Race kind="total" user={user} competition={competition} className={style.race} />
              <Button onClick={(e) => input.onDialog('leaderboard', null, e)} class={`${style.link} round transparent icon-right`} icon="ChevronRight">Leaderboard</Button>
            </div>
          </li>
        </ul>}
        {(consequences.length > 0 || newEvidence.length > 0 || state.warnings.length > 0) && <div class={style.consequences}>
          {state.warnings.map((event) => <Event.consequence {...event} />)}

          {consequences.map((event) => <Event.consequence {...event} />)}

          {newEvidence.length > 0 && 
            newEvidence.map((event) => <Event.consequence {...event} level="good" meta={"From " + formatters.titlize(event.person)} />)
          }
        </div>} 
        <div class={style.relationships}>
          <h2>Relationships</h2>
          <ul>
            {Object.values(state.relationships).map((relationship) => <li class={`${style.relationship} ${style.level} ${relationship.isKnown ? style.known : style.unknown}`}>
              <img src={relationship.icon} />
              <div class={style.details}>
                <p class={style[relationship.level]} title={`${relationship.score} / ${relationship.threshold(state.turn)}`}><strong>{relationship.name}</strong> {relationship.thought}</p>
                {state.consequences.map((consequence) => consequence.person === relationship.id && 
                  <blockquote><Icon name={consequence.icon} /> {consequence.description}</blockquote>)}
              </div>
              <ul class={style.challenges}>
                {activeChallenges.map((challenge) => 
                  (challenge.person || 'grandma') == relationship.id && <Challenge {...{...challenge, competition, user, state}} />
                )}
              </ul>
            </li>)}
          </ul>
        </div>
        {evidence.length > 0 && <div class={style.evidence}>
          <aside>
            {evidence.length} / <span>11</span>
          </aside>
          <h2>Your case against mr. Sinister</h2>
          <ul class={style.evidencelist} id="evidence">
            {newEvidence.map((e) =>
              <li class={newEvidence.includes(e) && style.new}>
                <h3  class={style.information}><Icon name={e.icon} /> {e.title}</h3>
              </li>
            )}
            {evidence.reverse().map((e) =>
              !newEvidence.includes(e) && <li>
                <h3  class={style.information}><Icon.Career /> {e.title}</h3>
              </li>
            )}
          </ul>
        </div>}
        {allAchievements.length > 0 && <div class={style.achievements}>
          <h2>Achievements</h2>
          <ul>
            {allAchievements.map((name) => {
              const achievement = achievementList.find((a) => a.slug === name);
              if (!achievement) return;
              const challenge = pastChallenges.find((challenge) => challenge.achievement == name);
              return <li class={`${style.achievement} ${newAchievements.includes(name) && style.new}`}>
                <img crossorigin={achievement.icon.match(/archimedes.*s3/) && 'anonymous'} src={achievement.icon} />
                <div class={style.description}>
                  <div class={style.name}>{achievement.name}</div>
                  <div class={style.text}>{achievement.summary}</div>
                </div>
                {challenge && challenge.competitive !== false && challenge.unit !== 'years' && <Race class={`${style.race} compact`} kind={challenge.kind} unit={challenge.unit} user={user} competition={competition} className={style.race} />}
              </li>
            })}
          </ul>
        </div>}
      </div>
    </div>
  </div>
}