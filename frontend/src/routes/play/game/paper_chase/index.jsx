import { useMemo, useStore, useState, useRef, useEffect } from "/lib/hooks"

import Data from './lib/mixins/data';
import World from './lib/mixins/world';
import UI from './lib/mixins/ui';
import Progression from './lib/mixins/progression';
import Input from './lib/mixins/input';
import Decisions from './lib/mixins/decisions';

import style from './style.module.scss';

import Pages from './Pages';
import { Canvas, Progression as ProgressionComponent, Icon } from './components'
import { Page } from '/components/index.jsx';


Icon.load(new URL('../../../../assets/atlas_game/index.svg', import.meta.url).href)


export default function PaperChase({ game, section, gameId, itemId, next, start, tooltip, dialog: dialogName }) {
  
  const explicitYear = parseInt((location.search.match(/year=([^&]+)/) || [0,0])[1]);

  const data = useRef();
  const world = useRef();
  const progression = useRef();
  const input = useRef();
  const ui = useRef();
  const decisions = useRef();
  const params = useRef();

  const environment = { data, world, progression, input, ui, params, decisions }
  
  Object.assign(data, Data(environment, { gameId }));
  
  Object.assign(world, World(environment));
  const [dialog, setDialog] = useState(() => ({name: null, open: false, uid: Math.random()}));
  const [scene, setScene] = useState(() => ({ name: null }));
  const [closedTooltips, setClosedTooltips] = useState(window.closedTooltips || []);
  window.closedTooltips = closedTooltips;

  const started = (!localStorage['year'] &&  world.state.turn == -1) || localStorage['year'] == world.state.year;// || data.session.actions.length;

  (() => {
    // lock game on results screen when its finished
    if (world.state.finished && location.search.indexOf('reset') == -1) {
      section = 'results';
      next = '';
      
    } else if (!started) {
      section = 'results';
      next = '';
    } else if (!section) {
      section = 'review'
    }
  })();

  useMemo(() => {
    params.render = params.render == null ? 0 : params.render + 1;
  }, [location.pathname])
  Object.assign(params, { section: section, itemId, next, start, scene, dialog, tooltip });
  Object.assign(input, Input(environment, { setDialog, setScene, setClosedTooltips }));
  Object.assign(decisions, Decisions(environment));
  Object.assign(progression, Progression(environment));
  Object.assign(ui, UI(environment, { closedTooltips }));

  useEffect(() => {
    // debug
    if (location.search.includes('gameover')) {
      world.state.finished = true;
    }
  
    const outstandingDecision = decisions.outstanding[0];
    if (dialog.name === 'customize' && world.state.turn != -1) {
      setDialog({name: null, open: false, uid: Math.random()})
    } else if (!dialog.name && dialogName && !params.initialDialog) {
      params.initialDialog = true;
      setDialog({name: dialogName, open: true, uid: Math.random()})
    } else if (!dialog.name && localStorage.introYear != world.state.year && section === 'review') {
      localStorage.introYear = world.state.year
      if (outstandingDecision) {
        setDialog({name: outstandingDecision.choice.chains[0], open: true, uid: Math.random(), narration: decisions.narration})
      } else {
        setDialog({name: 'empty', open: true, uid: Math.random(), narration: decisions.narration})
      }
    }
  }, [world.state, data.session.actions, dialog.name, start, section, decisions.outstanding]);
  
  const content = useMemo(() =>  <Pages {...{
    ...environment,
    ...data.session,
    ...world
  }} />, [
    world.state, 
    data.session.actions,
    params.itemId,
    params.section,
    params.dialog,
    progression.active,
    progression.lesson,
    ui.tooltip,
    progression.saving,
    input,
  ])

  const navigation = useMemo(() => ({
    scorllSelector: false,
    headerHidden: true
  }), [
    world.state, 
    params.itemId, 
    params.section,
    decisions.outstanding.length, 
    data.saveRequest.loading,
    progression.phase,
    progression.active,
    progression.saving,
    localStorage.year
  ])

  useEffect(() => {
    data.sessionReload()
  }, []);

  useEffect(() => {
    if (!dialog.open) {
      input.onScene(undefined, world.state)
    }
  }, [dialog.name, params.section, params.itemId, world.state.character])

  return <Page id="game" class={style.page} navigation={navigation} >
  <Canvas {...environment }></Canvas>
  {content}
</Page>

}