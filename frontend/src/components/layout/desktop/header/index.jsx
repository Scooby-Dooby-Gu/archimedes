import { Icon } from '/components/index.jsx';
import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import { useStore } from '/lib/state';
import { useRef } from 'preact/hooks';



function Header ({children, ...props}) {
  const user = useStore('auth.user');
  const canBypassUnlock = useStore('auth.canManage') || user.role == 'demo';
  const path = useStore('location.path');
  const unlocks = useStore('app.unlocks');
  const pathsRemembered = useStore('location.pathsRemembered');

  const ref = useRef();
  const onClick = (e) => {
    const link = e.target.closest('a[href]');
    if (link) {
      if (link.getAttribute('disabled') != null) {
        if (ref.current) {
          ref.current.classList.remove(style.clicked);
          clearTimeout(ref.timeout);
        }
        
        link.parentNode.classList.add(style.clicked)
        ref.current = link;
        ref.timeout = setTimeout(() => {
          link.parentNode.classList.remove(style.clicked)
        }, 4000);
        e.stopPropagation();
        e.preventDefault();
      } else if (pathsRemembered[link.pathname] && path !== pathsRemembered[link.pathname]) {
        route(pathsRemembered[link.pathname])
        e.stopPropagation();
        e.preventDefault();
      } 
    }
  }


  return (
    user && <header class={`${props.class} ${style.header}`} onClick={onClick}>
      <menu class={style.menu}>
        <li>
          <a className={path.indexOf(`/users/`) == 0 && style.active} href={`/users/${user.id}`} alt="Profile">
            <Icon.Profile style="width: 24px;" />
            <div>{formatters.name(user.name).length < 13 ? formatters.name(user.name) : 'Profile'} </div>
          </a>
        </li>
        <li>
          <a className={path.indexOf('/ambitions') == 0 && style.active} href="/ambitions">
            <Icon.Goal style="width: 25px;" />
            <div>Progress</div>
          </a>
        </li>
        <li disabled={!unlocks.game}>
          <a className={path.indexOf('/games') == 0 && style.active} disabled={!unlocks.game && !canBypassUnlock}  href="/games/paper-chase">
            {!unlocks.game ? <Icon.Lock /> : <Icon.Games />}
            <div>Play</div>
          </a>
          <div class={style.message}>
            Complete 3 lessons to unlock Paper Chase game
          </div>
        </li>
        <li disabled={!unlocks.videos}>
          <a className={path.indexOf('/videos') == 0 && style.active} disabled={!unlocks.videos && !canBypassUnlock}  href={"/videos/"}>
            {!unlocks.videos ? <Icon.Lock /> : <Icon.Video style="width: 29px;" />}
            <div>Watch</div>
          </a>
        </li>
        <li disabled={!unlocks.courses}>
          <a className={path.indexOf('/courses') == 0 && style.active} disabled={!unlocks.courses && !canBypassUnlock}  href="/courses">
            {!unlocks.courses ? <Icon.Lock /> : <Icon.Explore style="width: 33px;" />}
            <div>Explore</div>
          </a>
          <div class={style.message}>
            Complete 2 goals to unlock videos
          </div>
        </li>
        {user.role === 'admin' && <li>
          <a className={path.indexOf(`/admin/`) == 0 && style.active} href={"/admin/users/"}>
            <Icon.Admin style="width: 25px;" />
            <div>Admin</div>
          </a>
          <div class={style.message}>
            Complete all goals to unlock courses
          </div>
        </li>}
      </menu>
    </header>
  );
}

export default Header;
