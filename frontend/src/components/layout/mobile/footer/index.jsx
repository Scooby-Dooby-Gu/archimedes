import { Avatar, Icon } from '/components/index.jsx'
import style from './style.module.scss';
import { useStore } from '/lib/hooks/index.jsx'
import * as formatters from '/lib/formatters';
import { useEffect, useRef, useState } from 'preact/hooks';

import { Button } from '../../..';
export default function Footer({children, ...props}) {
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
          ref.current.parentNode.classList.remove(style.clicked);
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
  return <>
    <menu class={`${props.class} ${style.footer}`} onClick={onClick}>
      <li>
        <a className={path.indexOf(`/users/${user.id}`) == 0 && style.active} href={`/users/${user.id}`} alt="Profile">
          {path.indexOf(`/users/${user.id}`) == 0 ? <Icon.SymbolsPersonFill /> : <Icon.SymbolsPerson />}
          <div>{formatters.name(user.name).length < 17 ? formatters.name(user.name) : 'Profile'} </div>
        </a>
      </li>
      <li>
        <a className={path.indexOf('/ambitions') == 0 && style.active} href="/ambitions">
          {path.indexOf('/ambitions') == 0 ? <Icon.SymbolsFlameFill /> : <Icon.SymbolsFlame  />}
          <div>Progress</div>
        </a>
      </li>
      <li disabled={!unlocks.game}>
        <a disabled={!unlocks.game && !canBypassUnlock}  className={path.indexOf('/games/paper-chase') == 0 && style.active} href="/games/paper-chase">
          {!unlocks.game && <Icon.Lock />}
          {path.indexOf('/games/paper-chase') == 0 ? <Icon.SymbolsGamecontrollerFill /> : <Icon.SymbolsGamecontroller />}
          <div>Play</div>
        </a>
        <div class={style.message}>
          Complete 3 lessons to unlock Paper Chase game
        </div>
      </li>
      <li disabled={!unlocks.videos}>
        <a disabled={!unlocks.videos && !canBypassUnlock} className={path.indexOf('/videos') == 0 && style.active} href="/videos/">
          {!unlocks.videos && <Icon.Lock />}
          {path.indexOf('/videos') == 0 ? <Icon.SymbolsPlayRectangleFill /> : <Icon.SymbolsPlayRectangle />}
          <div>Watch</div>
        </a>
        <div class={style.message}>
          Complete 2 goals to unlock videos
        </div>
      </li>
      <li disabled={!unlocks.courses}>
        <a disabled={!unlocks.courses && !canBypassUnlock} title="Complete all goals to unlock courses" className={path.indexOf('/courses') == 0 && style.active} href="/courses">
          {!unlocks.courses && <Icon.Lock /> } 
          {path.indexOf('/courses') == 0 ? <Icon.SymbolsBooksVerticalFill /> : <Icon.SymbolsBooksVertical />}
          <div>Explore</div>
        </a>
        <div class={style.message}>
          Complete all goals to unlock courses
        </div>
      </li>
    </menu>
  </>
}
Footer.Guest = (props) => {
  return <menu class={`${props.class} ${style.bar}`}>
    <a href={import.meta.env.SITE_URL || "/"}>About Archimedes</a>
    <Button.Link href={`/signup?from=${encodeURIComponent(location.pathname)}`} class="primary icon-right" icon="ChevronRight">Sign up</Button.Link>
  </menu>

}