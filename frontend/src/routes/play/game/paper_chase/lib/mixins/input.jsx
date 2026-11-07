import { useCallback, useRef } from '/lib/hooks/index.jsx'
import * as Game from '../index.jsx';
import update from '/lib/immutability';

import { randomCharacterSettings } from '../generators/choices';

export function getPossibleScenes(prefix, scenes = ['Work'], clips) {
  const type = scenes[Math.floor(scenes.length * Math.random())];
  const name = type ? prefix + '-' + type : prefix;
  const actors = type == 'Work' ? [] : [[false, 'character'], ['character', false], []][Math.floor(Math.random() * 3)];
  return { name, actors, clips }
}

export default function PaperChaseInput({ world, data, params, decisions, ui, progression }, { setDialog, setScene, setClosedTooltips }) {
  const onNextYear = useCallback((e) => {
    const nextState = Game.States.next(world.state, data.session.log.concat(data.session.actions), data);
    const newSession = update(data.session, {
      $merge: {
        turn: world.state.turn + 1,
        actions: [],
        scores: nextState.scores,
        log: data.session.log.concat(data.session.actions),
        achievements: nextState.achievements
      }
    });
    if (e) e.preventDefault();
    return data.saveSession({ session: newSession, advance: true })
  }, []);


  // method to acknowledge game action(s) and/or override action list with second argument
  const onAction = useCallback((actions, previousActions = data.session.actions) => {
    console.log('%c game   %c %O', 'background: #BDBDBD; color: #333; border-radius: 2px;', '', 'action', actions)

    // actions can rewrite actions for current turn
    const newActions = Game.Actions.executeAll(actions, world.state, previousActions);
    const nextState = Game.States.next(world.history, data.session.log.concat(newActions), data);
    const newSession = update(data.session, {
      $merge: {
        actions: newActions,
        scores: nextState.scores,
        difficulty: world.state.difficulty || null,
      }
    });
    newActions.forEach((action) => {
      track('send', 'event', 
        'Game/' + action.type[0].toUpperCase() + action.type.slice(1), 
        action.kind || action.category || (typeof action.value === 'string' ? action.value : null) || action.context, 
        action.ticker, 
        action.sum || action.amount || action.salary || action.value || action.price || 0);
    })
    

    // send new set of actions to serve
    if (newSession !== data.session) {
      data.saveSession({ session: newSession }) 
    }
  }, []);


  // decisions are pre-written sets of possible decisions
  // actions issued by decisions are tagged with the name of a decision
  // so that if decision is changed, previous actions can be unrolled
  const onDecision = useCallback((decision, parameters, chain, isComplete) => {
    console.log('%c  %c %O', 'background: #BDBDBD; color: #333; border-radius: 2px;', '', 'decision', decision.name)
    

    const newActions = Object.keys(parameters).length ? decision.finalize(decision, parameters, world.state, data.session.log) : [];
    
    // remove previous actions applied by the same decision
    const filteredActions = data.session.actions.filter((action) => action.decision !== decision.name);

    // tag actions with the decision name
    const newTaggedActions = newActions.map((action) => ({...action, decision: decision.name, chain}));

    // perform all actions at once
    return onAction(newTaggedActions, filteredActions)
    
  }, [])

  const onNextTurn = useCallback(async (e) => {
    if (params.dialog.open) {
      return onDialog(null)
    }

    switch (progression.phase) {
      case 'economy':
        route('/games/paper-chase/review?start')
        break;

      case 'last':
      case 'over':
      case 'decisions':
        onNextDecision()
        break;
      case 'consultations':
        document.querySelector('.slide.economy').scrollIntoViewCustom({
          behavior: 'smooth', 
          block: 'start'
        })
        return;
      case 'news':

      case 'blocked':
      case 'continue':
        localStorage['year'] = world.state.year;
        if (world.state.choices.joinedInvestmentClub) {
          route('/games/paper-chase/economy?next')
        } else {
          route('/games/paper-chase/review?start')
        }
        break;
      default:
        if (params.section !== 'review') {
          route(`/games/paper-chase/review`);
        } else {
          progression.saving = true;
          onNextYear().then(() => {
            setTimeout(() => {
              progression.saving = false;
              setTimeout(() => {
                route(`/games/paper-chase/results`);
                track('send', 'event', 'Game/Progress', world.state.difficulty || 'unknown', String(world.state.age), world.state.scores.total || 0);
                for (var property in world.state.previous.scores) {
                  if (property !== 'total' && world.state.previous.scores[property] != world.state.previous.previous.scores[property]) {
                    track('send', 'event', 'Game/Challenge/' + property, world.state.difficulty || 'unknown', String(world.state.previous.age), world.state.previous.scores[property]);
                  }
                }
                const newAchievements = world.state.previous.achievements.filter((a) => !world.state.previous.previous.achievements.includes(a));
                newAchievements.map((name) => {
                  const achievement = data.achievementList.find((a) => a.slug === name);
                  if (achievement) {
                    track('send', 'event', 'Achievement', 'Game', achievement.name);
                  }
                })
              }, 200)
            }, 50)
          });
        }
    }
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [])
  
  const onNextDecision = useCallback((e) => {
    // workaround the case when the game was started in a different browser
    if (!decisions.outstanding.length) {
      onDialog(null)
    } else {
      requestAnimationFrame(() => onDialog(decisions.outstanding[0].choice.chains[0]))
    }
  }, [])

  const onDialog = useCallback((name, page, event = { pageX: window.innerWidth / 2, pageY: 308 }) => {
    setDialog((oldDialog) => {
      return {name, open: !!name, uid: !params.dialog.open && Math.random(), page: page, x: event.pageX, y: event.pageY - 56}
    })
  }, [])

  const onScene = useCallback((overrideScene, settings = {}) => {
    var scenes = overrideScene ? overrideScene :
      params.section === 'finance' ? ['Bank', 'Bank-Visit', 'Bank-Visit-2'] :
      params.section === 'economy' ? 'Exchange-News' :
      params.section === 'career' ? 
        (world.state.study 
          ? getPossibleScenes('University', ['Study']) 
          : (!world.state.job || world.state.job.kind == 'minimum') 
            ? 'Burgers'
            : world.state.job && world.state.job.kind == 'corporate'
              ? getPossibleScenes('Office', ['Job', 'Hire'])
              : getPossibleScenes('Startup', ['Work', 'Rest'])) :
      params.section === 'property' ? 
        getPossibleScenes(world.state.residence ? 'Home' : 'Dorm', ['Work', 'Rest', 'Rest-2']) :
      params.section === 'investments' 
        ? 'Exchange' : //getPossibleScenes('Exchange', ['Invite', null]) :
      params.section == 'results' 
        ? world.state.turn == 0 
          ? ['Park-Decisions', 'Park-Decisions-2'] 
        : world.state.finished 
          ? ['Home-Victory'] : 
          getPossibleScenes(world.state.residence ? 'Home' : 'Dorm', ['Work', 'Rest', 'Rest-2'])
          : ['Park-Decisions', 'Park-Decisions-2'/*, {name: 'Hotdogs-Meeting', actors: [false]} */] ;
    var scenesArray = [].concat(scenes);
    var scene = scenesArray[Math.floor(Math.random() * scenesArray.length)];
    if (typeof scene === 'string') {
      scene = { name: scene };
    }
    if (!scene.actors) {

      if (scene.name.includes('Dorm')) {
        var actors = ['roomie']
      } else if (scene.name.includes('Office')) {
        var actors = [
          randomCharacterSettings(undefined, ['BusinessMan_Suit', 'BusinessMan_Shirt', 'BusinessWoman']),
          randomCharacterSettings(undefined, ['BusinessMan_Suit', 'BusinessMan_Shirt', 'BusinessWoman'])
        ]
      } else if (scene.name.includes('Finance')) {
        var actors = ['taxAdvisor', 'grandma']
      } else if (scene.name.includes('Hotdogs')) {
        var actors = ['grandma', 'grandma']
      } else if (scene.name.includes('Startup')) {
        var actors = [randomCharacterSettings(undefined, ["Jock", "PunkGuy", "Hobo", "Male_Jacket"])]
      } else if (scene.name.includes('Exchange')) {
        var actors = [null, 'mary']
      } else if (scene.name.includes('Burgers')) {
        var actors = [randomCharacterSettings(undefined, ["FastFoodGuy", "ShopKeeper"])]
      } else if (scene.name.includes('Bank-Visit')) {
        var actors = [ 
          randomCharacterSettings(undefined, ['BusinessMan_Suit', 'BusinessMan_Shirt', 'BusinessWoman']),
          undefined,
          randomCharacterSettings(undefined, ['BusinessMan_Suit', 'BusinessMan_Shirt', 'BusinessWoman'])
        ]
      }
    }
    
    var { character, npcs } = settings;
    setScene({ actors, character, npcs, ...scene })
  }, [])

  const onTooltipClose = useCallback((name) => {
    setClosedTooltips((list) => list.concat(name))
  }, []);
  
  return {
    onNextYear,
    onDecision,
    onAction,
    onNextTurn,
    onNextDecision,
    onDialog,
    onScene,
    onTooltipClose
  }
}