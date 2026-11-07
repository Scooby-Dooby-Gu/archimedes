import style from './style.module.scss';
import { usePrecache } from '/lib/hooks/index.jsx';
import { getSkills } from '/lib/data';
import Img from '../img';

const bypass = (r) => r;
export default function User({ user, avatar, process = bypass, style: cssStyle, ...props}) {
  usePrecache(() => ({
    [`/users/${user.id}`]: { user }
  }), [user])
  return <span class={`user ${style.user} ${props.class}`} style={cssStyle}>
    {avatar !== false && <Avatar user={user} class="small" {...avatar} />}
    <a href={`/users/${user.id}`}>{process(user.name)}</a>
  </span>
}

export function Avatar({ user, award, ...props }) {
  return user && [
    <span class={style.picture}>
      <Img srcset={user.avatarSizes} id={props.id} sizes={props.class && String(props.class).indexOf('huge') > -1 ? '128px' : '40px'} crossorigin={(user.avatar || '').match(/archimedes.*s3/) && 'anonymous'} class={`avatar ${style.avatar} ${props.class}`} src={user.avatar && user.avatar.replace('=s96-c', '') || '/assets/sample/avatar.png'} />
    </span>
  ]
}