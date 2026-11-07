import { useFetchedData, useStore } from '/lib/hooks/index.jsx'


export default function GamesReset({gameId}) {
  const explicitSeed = parseInt((location.search.match(/seed=([^&]+)/) || [0,10000])[1]);
  const {auth: {user, company}} = useStore()
  const companyParameter = company ? '&companyId=' + company.id : '';
  const onComplete = () => {
    localStorage.removeItem(`cache:/games/${gameId}/sessions/${user.id}?v=3${companyParameter}`)
    window.closedTooltips = [];
    localStorage.removeItem('year');
    localStorage.removeItem('introYear');
    localStorage.removeItem(`cache:/games/${gameId}/sessions/${user.id}?v=3${companyParameter}`)
    dispatch({type: 'resetGameSession'});
    setTimeout(() => {
      route('/games/paper-chase/?seed=' + explicitSeed);
    }, 1000)
  };
  const [,, sessionDelete] = useFetchedData(`/games/${gameId}/sessions/${user.id}?v=3${companyParameter}`, {
    method: 'delete',
    immediate: true,
    onRequest: () => {
      localStorage.removeItem(`cache:/games/${gameId}/sessions/${user.id}?v=3${companyParameter}`)
    },
    onFailure: onComplete,
    onSuccess: onComplete
  });
}