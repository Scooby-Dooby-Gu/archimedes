import { useFetchedData, useCallback, useAsyncForm, useRef, useMemo } from '/lib/hooks/index.jsx'
import { Avatar, Grid, User, LocalizedDateTime } from '/components/index.jsx';
import { Page } from '/components/index.jsx';
import style from './style.module.scss';


export default function({companyId, success, origin}) {
  const [{company}, companyRequest, companyReload] = useFetchedData(`/companies/${companyId}`, {invalidate: success});
  const [invites, invitesRequest, invitesReload] = useFetchedData(`/companies/${companyId}/invites`, {invalidate: success});

  const [invitationRequest, onInvitationSubmit] = useAsyncForm((response) => {
    formRef.current.reset()
    invitesReload();
    //route(`/companies/${companyId}/invites/new?success=${Math.random()}&flash=${encodeURIComponent(response.data)}`)
  });


  const formRef = useRef();

  const navigation = useMemo(() => ({
    title: 'Invite to company',
    parentType: 'company',
    parentCache: company,
    parentLink: `/companies/${companyId}`,
    actionTitle: 'Send',
    actionRequest: invitationRequest,
    actionHandler: () => {
      onInvitationSubmit(formRef.current);
    }
  }), [companyId, invitationRequest]);


  return <Page id="invites" navigation={navigation}>

    <form class={style.form} action={`/companies/${companyId}/invites`} method="post" onSubmit={onInvitationSubmit} ref={formRef}>
      {!invitationRequest.success && company.wildcards && company.wildcards.length > 0 && <p>
        Any users registed with email <strong>{company.wildcards.map((w) => `@${w}`).join(', ')}</strong> will be added to this company.
      </p>}
      {invitationRequest.success && <p>{invitationRequest.response.data}</p>}

      <textarea name="emails" placeholder="Comma or new-line separated list of emails"></textarea>
    
        
      <label class={style.management}>
        <input type="checkbox" name="role" value="manager" /> Invite as a manager
        <p>Invited persons will not be part of a leaderboard, and have their UX optimized for management. They will be able to manage discussions and memberships in the company.</p>
      </label>
    </form>

    <br />
    <br />

    {invites.length > 0 && !invites.isPlaceholder && [
      <Grid 
        type="list"
        headers={[
        {name: 'Avatar', type: 'icon'},
        {name: 'Person', important: true},
        {name: 'Invited by', type: 'text'},
      ]} rows={invites.map((invite) => [
        invite.user ? <Avatar user={invite.user} /> : null,
        invite.user ? <User user={invite.user} avatar={false} /> : invite.email,
        <span class={style.author}>
          <aside>
            <LocalizedDateTime date={invite.createdAt} />
          </aside>
          by <User user={invite.inviter} avatar={false} class="gray smaller" />
          {invite.role === 'manager' && <strong>as manager</strong>}
        </span>
      ])} />,
    ]}
  </Page>
}