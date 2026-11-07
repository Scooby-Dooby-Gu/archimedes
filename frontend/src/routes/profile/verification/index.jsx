import { FormField, Button } from '/components/index.jsx';
import { Page } from '/components/index.jsx';
import { useStore, useMemo, useAsyncLink, useFetchedData, useEffect } from '/lib/hooks/index.jsx'


export default function Verification({token}) {
  const {auth: { user } } = useStore();
  //if (!user) return;
  const [verifiedUser, verificationRequest] = token ? useFetchedData(`/verifications/${token}`, {
    method: 'post',
    onSuccess: (data) => {
      dispatch({type: 'login', user: data.user, redirect: '/?welcome'});
    },
  }) : [];

  const [repeatedVerificationRequest, onRepeatVerification] = useAsyncLink();

  const navigation = useMemo(() => ({
    title: token ? 'Verifying email now' : 'Verify your email'
  }), [token])

  const [{user: me }, personRequest, reloadPerson] = useFetchedData(`/users/me`, {
    onSuccess: (data) => {
      if (data.user.verifiedAt) {
        dispatch({type: 'login', user: data.user, redirect: '/?welcome'});
      }
    }
  });

  const checkIfAlreadyVerified = function() {
    if (!document.hidden) {
      reloadPerson();
    }
  };
  useEffect(() => {
    document.addEventListener("visibilitychange", checkIfAlreadyVerified);
    return () => document.removeEventListener('visibilitychange', checkIfAlreadyVerified);
  }, []);
  

  return <Page class="centered" id="verification" navigation={navigation}>
    {!token && <div class="intro">
      <h1 class="largest">We sent an email {user && <>to <strong>{user.email}</strong></>} with a link to verify your account.</h1>
      <br />
      <p>If you haven't received the email, check all of your mail folders and request to get it sent again.</p>
      {repeatedVerificationRequest.success && <p class="success">A second email was sent.{import.meta.env.CONTACT_EMAIL && <> Having troubles? Email <a href={`mailto:${import.meta.env.CONTACT_EMAIL}`}>{import.meta.env.CONTACT_EMAIL}</a>.</>}</p>}
      <br />
      <Button.Link class="primary" href="/verifications/repeat" method="post" onClick={onRepeatVerification}>Resend verification email</Button.Link>
      <br />
      <Button.Link class="secondary" href="/signout">Sign out</Button.Link>
    </div>}

    {token && <div>
      {verificationRequest.loading && <p>Please wait...</p>}
      {verificationRequest.error && [
        <p>We could not verify the email because of the following error:</p>,
        <p class="error">{verificationRequest.error.toString()}</p>,
        verificationRequest.error.toString().includes('already verified') ? [
          <a href="/signout" class="button">Go back</a>,
        ] : [
          repeatedVerificationRequest.success && <p class="success">We sent you another email</p>,
          <a href="/verifications/repeat" method="post" class="button" onClick={onRepeatVerification}>Resend verification email</a>,
          " or ",
          <a href="/signout">Sign out</a>
        ]
      ]}
    </div>}
  </Page>
}