import { useStore, useFetchedData, useAsyncLink, useMemo } from '/lib/hooks/index.jsx'
import { User, LocalizedDateTime } from '/components/index.jsx'
import { Icon, Button, Page } from '/components/index.jsx';
import Signup from '../signup'
import style from './style.module.scss';


export default function({inviteId}) {
  const state = useStore()
  
  const [{invite}, inviteRequest, inviteReload] = useFetchedData(`/invites/${inviteId}`);
  const [acceptanceRequest, onInviteAccept] = useAsyncLink((response) => {
    if (response.data && response.data.invite && response.data.invite.user) {
      dispatch({
        type: 'login', 
        user: response.data.invite.user, 
        redirect: `/users/${response.data.invite.user.id}`
      });
    } else {
      route('?welcome')
    }
  });

  var navigation = useMemo(() => ({
    headerTheme: 'gray',
    pageTheme: 'gray',
    parentAlwaysShow: true,
    title: 'Signup for Archimedes',
    headerHidden: true,
    parentTitle: false,//'Back',
    parentLink: null,
    scrollSelector: false,
    requests: [inviteRequest, acceptanceRequest]
  }), [inviteRequest.loading, acceptanceRequest.loading])

  const hasCompany = invite.company && !invite.company.isPlaceholder;

  const content = <div class={style.wrapper}>
    <div class={style.top}>
      <a  href={import.meta.env.SITE_URL || "/"}><Icon.LogosArchimedes style="width: auto; height: auto;" /></a>
      <p>Actionable investment steps <br /> made simple for you</p>
      <a href={import.meta.env.SITE_URL || "/"}>Learn more about Archimedes</a>
    </div>
    <div class={style.intro}>
      {!hasCompany && [
        <User user={invite.inviter} avatar={invite.inviter.avatar ? true : false} style="justify-content: center" />,
        <h1>invited you to sign up</h1>
      ]}
      {hasCompany && invite.company.image && [
        <img crossorigin={(invite.company.image || '').match(/archimedes.*s3/) && 'anonymous'} src={invite.company.image} class="logo" />,
        <br />,
        <br />
      ]}
      {hasCompany && !invite.user && <h2>You are signing up to join <strong>{invite.company.name}</strong></h2>}
      {hasCompany && invite.user && <h2>You were invited to join <strong>{invite.company.name}</strong></h2>}

      <br />
      {invite.acceptedAt && <p>This invite was accepted on <LocalizedDateTime date={invite.acceptedAt} /></p>}
      {!invite.acceptedAt && invite.user && invite.user.company && invite.company && invite.company.id != invite.user.company.id && 
        <p>By joining this team you will be logged out of your current company</p>}
      <br />
    </div>


    {!invite.acceptedAt && invite.user && [
      <br />,
      <Button href={`/invites/${inviteId}`} method="post" class="wide primary" onClick={onInviteAccept}>
        Join {invite.company.name}
      </Button>,
      <br />,
      <br />,
      <ul class="alternatives">
        <li><a href={`/`} class="gray">Dismiss invite</a></li>
      </ul>
    ]}
  </div>

  if (!invite.acceptedAt && !invite.user) {
    return <Signup token={inviteId} companyId={invite.companyId} email={invite.email} header={content} navigation={navigation} title="" />
  }

  return <Page class="centered" id="invite" navigation={navigation}>
    {content}
  </Page>
}