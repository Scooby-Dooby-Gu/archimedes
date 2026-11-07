import { useStore, useMemo, useAsyncForm, useSignin } from '/lib/hooks/index.jsx';
import { Icon, Button, Page, Form, FormField } from '/components/index.jsx';
import RequestAccess from '../request_access';
import style from '../../app/welcome/style.module.scss';

export default function({email, companyId, token, header, navigation}) {
  const [setUser, onGoogleSignin, googleSigninRequest, onAppleSignin, appleSigninRequest] = useSignin({
    token
  })
  const {app: { open } } = useStore();
  const [request, onSubmit] = useAsyncForm((response) => {
    setUser(response.data.user);
  })

  if (!open && !companyId) return <RequestAccess {...{email, token, header, navigation}} />
  

  if (!token) {
    navigation = useMemo(() => ({
      //headerTheme: 'gray',
      //pageTheme: 'gray',
      parentAlwaysShow: true,
      title: 'Signup',
      parentTitle: 'Back',
      parentLink: '/',
      requests: [request, googleSigninRequest, appleSigninRequest]
    }), [request.error, googleSigninRequest.error, appleSigninRequest.error])
  }

  const content = <>
    <Form action={`${import.meta.env.API_URL}/signup`} onSubmit={onSubmit} method="post">
      <FormField
        label="Full name"
        name="user[name]"
        class="normal-label"
        required
      />
      <FormField
        label="Email"
        type="email"
        defaultValue={email}
        name="user[email]"
        class="normal-label"
        required
      />
      <FormField
        label="Password"
        type="password"
        name="user[password]"
        class="normal-label"
        required
      />
      <input type="hidden" name="token" defaultValue={token} />
      <input type="hidden" name="open" defaultValue={true} />
      <br />
      <Button
        type="submit"
        value="login"
        class="primary icon-right"
        disabled={request.loading}
        loading={request.loading}
        icon="ChevronRight"
      >
        Get started
      </Button>
      <span class={style.or}>or</span>
      <Button.Link class="secondary" href="/signin/google" disabled={!googleSigninRequest.ready || googleSigninRequest.loading} onClick={onGoogleSignin}>
        {googleSigninRequest.loading ? <Icon.Spinner /> : <Icon.LogosGoogle />}
        Sign up with Google
      </Button.Link>
      <Button.Link class="secondary" href="/signin/apple" onClick={onAppleSignin}>
        {appleSigninRequest.loading ? <Icon.Spinner /> : <Icon.LogosApple style="width: 24px; height: 24px; margin-top: -10px;" />}
        Sign up with Apple
      </Button.Link>
      <br />
      <ul class="alternatives">
        <li>
          Already registered? <a href="/signin">Sign in</a>
        </li>
      </ul>
    </Form>
  </>

  return <Page class="centered" id="signup" navigation={navigation}>
    {header}
    {content}
  </Page>
}