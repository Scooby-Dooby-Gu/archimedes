import { useMemo, useRef, useAsyncForm, useStore, useState } from "/lib/hooks";
import { Button, Page, Icon, FormField } from '/components/index.jsx';

import style from './style.module.scss';
import { useFetchedData } from "../../../lib/hooks";
import { copyToClipboard } from "/lib/helpers";

export default function Invite({from, origin, userId}) {
  const {auth: {user }} = useStore();
  if (userId == null)
    userId = user.id;

  // power up user invitation form
  const [friendInvitationRequest, onFriendInvite] = useAsyncForm((response) => {
    formRef.current.reset();
    var url = from || origin || `/users/${userId}/friends`;

    route(url + `?success&flash=${encodeURIComponent(response.data)}`)
  });

  const [{ invite }, magicLinkRequest] = useFetchedData(`/users/${userId}/invite`, {
    observeRequest: true
  });

  const [copied, setCopied] =  useState(false);
  const onCopyLink = (e) => {
    copyToClipboard(`${import.meta.env.APP_URL}/invites/${invite.token}`)
    setCopied(true);
    e.preventDefault();
    e.stopPropagation();
  }

  const formRef = useRef();

  const navigation = useMemo(() => ({
    headerTheme: 'white',
    pageTheme: 'white',
    parentLink: from || origin || `/users/${userId}/friends`,
    parentTitle: 'Back',
    title: 'Invite friends',
    //actionTitle: 'Send',
    //actionRequest: friendInvitationRequest,
    //actionHandler: () => {
    //  onFriendInvite(formRef.current);
    //}
  }), [userId, friendInvitationRequest])

  return <Page id="invite" navigation={navigation}>
    <form action={`/friendships/?source_id=${userId}`} onSubmit={onFriendInvite} method="post" ref={formRef} class={style.form}>
      <section class={`${style.section} ${style.link}`}>
        <h2 class="normal bold">Share the kowledge</h2>
        {!copied && <p>Empower someone you know to make investing a bigger part of their life by texting the link below.</p>}
        {copied && <p class={style.success}>The link was copied! You can paste it into a message, email or chat now.</p>}
        <Button.Link href={`${import.meta.env.APP_URL}/invites/${invite.token}`} class="primary" disabled={magicLinkRequest.loading} onClick={onCopyLink}><Icon.Link /> Copy magic link</Button.Link>
      </section>
      <section class={`${style.section} ${style.link}`}>

        <p class={style.or}>or</p> 

        <h2 class="normal bold">Invite them by email</h2>
        <p>
        Send an email invitation to other people you know.
        </p>
        <FormField required type="textarea"  rows={1} placeholder={"Email address goes here..."} name="emails" />
        
        {false && user.role == 'admin' && <label class={style.management}>
          <input type="checkbox" name="role" value="manager" /> Invite as a manager
          <p>Invited persons will not be part of a leaderboard, and have their UX optimized for management. They will be able to manage discussions and memberships in the company.</p>
        </label>}

        <Button.Submit>Send emails</Button.Submit>
      </section>
      
    </form>
  </Page>
}