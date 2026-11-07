import { useRef, useMemo } from "/lib/hooks"
import { getSkills } from '/lib/data';
import * as Game from '../index.jsx';

export default function PaperChaseWorld ({ data }, noFuture) {
  const { session, user, submissions, courses } = data;
  const entireLog = session.log.concat(session.actions);

  const oldHistoryRef = useRef();
  // generate whole history initially
  const difficulty = (entireLog.find((action) => action.type === 'difficulty') || {}).value;
  if (!oldHistoryRef.current || oldHistoryRef.difficulty !== difficulty) {
    oldHistoryRef.difficulty = difficulty;
    oldHistoryRef.current = Game.States.initialize({
      difficulty,
      name: user.name,
      skills: getSkills(submissions, courses),
      seed: session.seed
    });
  }
  
  oldHistoryRef.current = Game.States.generate(oldHistoryRef.current, session.turn - 1, session.log, data);

  // apply actions on top of the current state
  const state = useMemo(() => {
    const state = Game.States.next(oldHistoryRef.current, entireLog, data);
    console.log('%c game   %c %O', 'background: #BDBDBD; color: #333; border-radius: 2px;', '', 'state', state)
    return state;
  }, [session.actions, difficulty]);

  // generate future history 
  const future = useMemo(() => {
    return user.role === 'user' || user.role === 'visitor' || noFuture ? state : Game.States.generate(oldHistoryRef.current, 40, session.log, data)
  }, [ session.seed, user.name, user.role, difficulty]);

  return {
    history: oldHistoryRef.current,
    state,
    future
  }
}