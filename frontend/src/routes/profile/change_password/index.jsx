import { Page, Form, FormField, Button } from '/components/index.jsx';
import { useStore, useAsyncForm, useMemo, useState, useFetchedData } from "/lib/hooks";


export default function ChangePassword({userId, token, layout}) {
  const {auth: { user }} = useStore();

  // A reset link (?token=...) works once and for 24 hours (backend/app/states/password-reset.js).
  // Check it up front so nobody types a new password into a dead link.
  const [, resetLinkRequest] = useFetchedData(token ? `/password_reset_requests/${token}` : null);
  const resetLinkProblem = token && resetLinkRequest.error ? (resetLinkRequest.error.message || String(resetLinkRequest.error)) : null;

  const [formSubmission, onSubmit] = useAsyncForm((response) => {
    dispatch({type: 'login', user: response.data.user, redirect: '/?welcome'});
  })
  const [isValid, setValid] = useState(false);

  const onInput = (e) => {
    const inputs = document.querySelectorAll('input[type="password"]');
    setValid(inputs[0].value === inputs[1].value);
  }
  const navigation = useMemo(() => ({
    headerTheme: layout == 'minimal' ? 'gray' : 'white',
    pageTheme: layout == 'minimal' ? 'gray' : 'white',
    title: 'Set new password',
    titleNode: layout == 'minimal' ? [] : 'Change password',
    parentAlwaysShow: true,
    parentLink: user ? `/users/${userId}/settings` : '/signin',
    parentTitle: user ? 'Settings' : 'Sign in',
    actionRequest: formSubmission,
    actionTitle: layout != 'minimal' && 'Save',
    actionHandler: () => onSubmit(document.querySelector('#reset_password form'))
  }), [user, layout, formSubmission])

  return <Page id="reset_password" navigation={navigation} class={`${layout !== 'minimal' ? 'white' : 'centered'}`}>
    <div class="intro">
      <img src="/assets/images/illustrations/account.svg" style="height: 300px; width: auto;" />
      <h1 class="largest">Reset</h1>
      <p>Type in your new password</p>
    </div>
    <br />
    {resetLinkProblem && <>
      <p class="error">{resetLinkProblem}</p>
      <Button.Link class="primary" href="/reset_password">Get a new reset link</Button.Link>
    </>}
    {!resetLinkProblem && <Form action={`/users/${userId}/password?token=${token}`} method="PUT" onInput={onInput} onSubmit={onSubmit}>
      <FormField name="user[password]" type="password" label="New password" required />
      <FormField name="user[passwordConfirmation]" type="password" label="Re-enter new password" required />
      <br />
      {layout === 'minimal' && <Button.Submit class="primary" loading={formSubmission.loading} disabled={formSubmission.loading || !isValid}>Change password</Button.Submit>}
    </Form>}
  </Page>
}