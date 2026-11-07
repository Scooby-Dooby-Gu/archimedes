import * as GAME_ATLAS from '/assets/atlas_game/index.jsx';
import * as ATLAS from '/assets/atlas/index.jsx';
import ICON from '/lib/icon';
const Icon = ICON({...ATLAS, ...GAME_ATLAS}, '/assets/atlas_game/');

export default function GameIcon(props) {
  if ((props.src || props.name || '').match(/Badge|Illustration/)) {
    props.color = false;
  }
  return Icon(props);
}
Object.assign(GameIcon, Icon);
