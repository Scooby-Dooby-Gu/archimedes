import { Page, Icon, Button, Form } from '/components/index.jsx';
import { useStore, useMemo, useFetchedData } from '/lib/hooks/index.jsx'

import style from './style.module.scss';

export default function Waitlist() {
  const {auth: { user } } = useStore();
  
  if (!user) return;
  
  const [{user: me }, personRequest, reloadPerson] = useFetchedData(`/users/me`, {
    onSuccess: (data) => {
      if (data.user.verifiedAt) {
        dispatch({type: 'login', user: data.user, redirect: '/?welcome'});
      }
    }
  });

  const [{ invites }, inviteRequest, reloadInvites] = useFetchedData(`/users/${user.id}/invites`);


  document.addEventListener("visibilitychange", function() {
    if (!document.hidden) {
      reloadPerson();
      if (user.verifiedAt) reloadInvites();
    }
  });

  const navigation = useMemo(() => ({
    title: 'Verification',
    titleNode: <Icon.LogosArchimedes style="width: auto; height: auto;" />,
    parentLink: '/signout',
    parentTitle: 'Sign out',
    parentHandler: () => "Would you like to switch to another account?"
  }), [])

  return <Page class={`${style.finish} centered`} id="waitlist" navigation={navigation}>
    <div class={style.top}>
      <h1 class="largest">You’re all set for now!</h1>
      <br />
      <p>Hey there! Due to an increased number of signups, we’re putting everyone on a waitlist. There’s nothing you need to do for now. We are working hard to let in groups of folks at a time so please be sure to check your email.</p>

    </div>  
    <div class={style.invite}>
      <div class={style.header}>
        <img src="/assets/images/illustrations/squad.svg" />
        <h2>Assemble your own squad</h2>
      </div>
      <p>While you wait, invite your friends or coworkers to play and learn alongside you. An assembled squad size of 3 gets priority access.</p>
      
      <ul class={style.invites}>
        {!invites.isPlaceholder && invites.map((invite, index) => <li class={invite.acceptedAt && style.active}>
          {invite.email}
          {invite.acceptedAt && <Icon.Checkmark />}
        </li>)}
      </ul>
      
      <Button.Link href={`/users/${user.id}/friends/new?origin=${encodeURIComponent(location.pathname)}`} class="wide icon-right" icon="ChevronRight">
        {!invites.isPlaceholder && invites.length > 0 ? 'Invite more friends' : 'Invite friends'}
      </Button.Link>
    </div>
  </Page>
}