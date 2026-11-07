import style from './style.module.scss';
import Icon from '../Icon'
import { useEffect, useRef } from 'preact/hooks';
import * as formatters from '/lib/formatters';

export default function Progression({ decisions, data, world, input, params, hidden, progression }) {
  
  const decisionType = decisions.outstanding.length && decisions.outstanding[0].choice.type;
  
  return <div class={`${style.wrapper} ${progression.active && style.active} ${world.state.finished && style.finished}`}>
    <a id="next-step" class={`${style.bar} ${style[progression.phase]} ${style[decisionType]}`} onClick={() => input.onNextTurn()} disabled={progression.saving || progression.phase == 'over'}>
      <div>
        {progression.phase == null && 'Review and finish this year'}
        {progression.phase == 'ready' && 'Finish this year'}
        {progression.phase == 'economy' && 'Make your money'}
        {progression.phase == 'continue' && 'Play one more year today'}
        {progression.phase == 'blocked' && 'Progress to the next year ahead of time?'}
        {progression.phase == 'news' && 'Start next year'}
        {progression.phase == 'decisions' && 'Needs decision'}
        {progression.phase == 'consultations' && (world.state.consultationsAvailable <= 1 ? 'You have an upcoming club consultation' : `You have ${world.state.consultationsAvailable} upcoming club consultations`)}
        {progression.phase == 'last' && 'Finish the game'}
        {progression.phase == 'over' && 'Thank you'}
        {progression.saving && data.saveRequest.loading ? <Icon.Spinner /> : 
          progression.phase === 'over' ? <Icon.Checkmark /> :
          progression.phase === 'blocked' ? <Icon.Clock /> : 
          progression.phase === 'consultations' ? <Icon.Down /> : 
          progression.phase != 'decisions' && <Icon.ChevronRight />}
      </div>
    </a>
  </div>
}