import { useMemo, useConfetti, useFetchedData, useRef, useEffect, useStore } from "/lib/hooks";
import style from './style.module.scss';

export default function Achievement({ success }) {
  const auth = useStore('auth')
  const user = useStore('data.user')
  if (!auth.user) return;
  const { achievements } = user;

  
  const elementRef = useRef();
  const confettiRef = useConfetti(() => [{
    startVelocity: 15,
    spread: 100,
    ticks: 200,
    origin: {
        x: Math.random(),
        // since they fall down, start a bit higher than random
        y: Math.random() - 0
    },
    shapes: ['square'],
  }], 5000, 1000);

  const newAchievements = useMemo(() => {
    const list = achievements.isPlaceholder ? [] : achievements.filter((achievement) => {
      return (new Date() - new Date(achievement.createdAt)) < 5000;
    });
    if (list.length) {
      setTimeout(() => {
        elementRef.current && elementRef.current.setAttribute('hidden', 'hidden');
      }, 7500)
      setTimeout(() => {
        elementRef.current && elementRef.current.removeAttribute('hidden');
      }, 100);
    }
    if (list.length) {
      list.map((achievement) => track('send', 'event', 'Achievement', 'App', achievement.definition.name))
    }
    return list;
  }, [achievements])


  if (newAchievements.length) {
    return <div class={`${style.root} cover theme-blue`} ref={elementRef} hidden key="achievement">
      <canvas class={`background ${style.confetti}`} ref={confettiRef}></canvas>
      {newAchievements.slice(0, 1).map((achievement) => <div>
        <img crossorigin={achievement.definition.icon.match(/archimedes.*s3/) && 'anonymous'} src={achievement.definition.icon} />
        <div class={style.name}>{achievement.definition.name}</div>
        <div class={style.summary}>{achievement.definition.summary}</div>
      </div>)}
    </div>
  }
}