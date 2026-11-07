import { Button } from '/components/index.jsx';
import style from './style.module.scss';

export default function StartDialog({input: { onDialog }}) {
  return [
    <div class={style.text}>
      <p>Paper Chase is a competitive investment role-playing game. Play against friends and peers, and demonstrate mastery over finance to become the next tycoon. To win, amass more paper than any other player.</p>
      <p>Gameplay is broken into turns with each turn representing a year of your life. Every year you will have an opportunity to engage with financial news, manage your investments, and make outstanding decisions like jobs or education. <br /><strong>Finish the year to move the story forward.</strong></p>
    </div>,
    <Button class="primary wide" onClick={() => onDialog('start')}>Start the game</Button>
  ]
}