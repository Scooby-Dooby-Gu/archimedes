import { useStore, useMemo, useFetchedData } from "/lib/hooks"
import update from '/lib/immutability';
import { useCallback } from "preact/hooks";

export default function Data ({ progression }, { gameId}) {
  const explicitSeed = parseInt((location.search.match(/seed=([^&]+)/) || [0,10000])[1]);
  const emptyData = {
    competition: {},
    session: {
      actions: [],
      log: [],
      timestamps: [],
      seed:  explicitSeed,
      score: 10000,
      turn: -1
    }
  }

  const company           = useStore('auth.company');
  const animations        = useStore('app.animations');
  const courses           = useStore('data.courses');
  const submissions       = useStore('data.submissions');
  const gameCompetition   = useStore('data.gameCompetition');
  const gameSession       = useStore('data.gameSession');
  const achievementList   = useStore('data.achievements');
  const user              = useStore('data.user');
  const gameSessionError  = useStore('requests.gameSession.error');
  const renderId          = useStore('app.forcedRenderCount');
  const sessionReload = useCallback(() => {
    dispatch({type: 'fetchGameSession'})
  }, []);
  
  const data = useMemo(() => {
    if (!window.gameResetError && gameSessionError) {
      window.gameResetError = gameSessionError;
      var resetGame = true;
    }
    return gameSession.seed == null || resetGame
      ? { ... emptyData }
      : {
        session: gameSession,
        competition: gameCompetition
      }
  }, [gameSession, gameCompetition, gameSessionError])

  const { session, competition } = data;
  
  const companyParameter = company ? '&companyId=' + company.id : '';
  const [actionData, saveRequest, saveSession] = useFetchedData(`/games/${gameId}/sessions?v=3${companyParameter}`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest: (data) => {
      if (data.session.turn === session.turn) {
        localStorage[`cache:/games/${gameId}/sessions/${user.id}?v=3${companyParameter}`] = JSON.stringify({
          ...data,
          competition: competition
        });
        dispatch({
          type: 'setGameSession', 
          ...data,
          competition: competition
        })
      } else {
        dispatch({ type: 'forceRender' }) // show spinner
      }
      return update(data, {
        session: {
          $unset: ['log', 'timestamps']
        }
      })
    },
    onSuccess: (data) => {
      if (data.session.turn !== session.turn || !session.attempt) {
        localStorage[`cache:/games/${gameId}/sessions/${user.id}?v=3${companyParameter}`] = JSON.stringify(data);
        if (!progression.saving) {
          dispatch({ type: 'setGameSession', ...data })
        } else {
          dispatch({ type: 'setGameSessionWithoutUpdate', ...data })
        }
      }
    },
    immediate: false
  })

  return {
    session: session,
    competition: competition,
    achievementList,
    submissions,
    courses,
    sessionReload,
    renderId,
    saveRequest, saveSession,
    user,
    company,
    animations
  }
}