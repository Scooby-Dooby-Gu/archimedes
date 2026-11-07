import style from './style.module.scss';
import Icon from '../icon';
import { useRef, useEffect, useState } from 'preact/hooks';

export default function Return({collapsed, className}) {
  const href = (location.search.match(/from=([^&]+)/) || ['',''])[1];
  const text = 
    href.match(/paper-chase/) ? 'To game' : 
    location.pathname.match(/enable_notifications/) ? 'I changed my mind' : 
    href.match(/lessons/) ? 'Return to lesson' : 'Return back';
  
  const ref = useRef();

  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    if (collapsed === true || !href) {
      setHidden(true)
    } else {
      setTimeout(() => {
        setHidden(false)
      }, 200)
    }
  }, [collapsed, href])

  return <a href={decodeURIComponent(href)} hidden={!href || collapsed || hidden } class={`${style.wrapper} ${className} cover theme-blue`} ref={ref}>
    {!hidden && [<Icon.Close />, ' ', text]}
  </a>
}