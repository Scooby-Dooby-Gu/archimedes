import { useMemo, useAsyncForm, useSignin } from '/lib/hooks/index.jsx';
import { Icon, Button, FormField, Form, Page } from '/components/index.jsx';
import style from '../../app/welcome/style.module.scss';



export default function() {
  const [setUser, onGoogleSignin, googleSigninRequest, onAppleSignin, appleSigninRequest] = useSignin()
  const [request, onSubmit] = useAsyncForm((response) => {
    setUser(response.data.user);
  })
  const navigation = useMemo(() => ({
    headerTheme: 'gray',
    pageTheme: 'gray',
    title: 'Sign in',
    parentAlwaysShow: true,
    parentTitle: 'Back',
    parentLink: '/',
    requests: [request, googleSigninRequest, appleSigninRequest]
  }), [request.error, googleSigninRequest.error, appleSigninRequest.error])

  return <Page id="signin" class="centered" navigation={navigation}>
    <Form class="compact" action="/signin" onSubmit={onSubmit} method="post">
      <FormField
        label="Email"
        name="user[email]"
        type="email"
        class="normal-label"
        required
      />
      <FormField
        label="Password"
        name="user[password]"
        type="password"
        class="normal-label"
        required
      />
      <br />

      <Button.Submit type="type" value="login" loading={request.loading} class="primary">Sign in</Button.Submit>
      <span class={style.or}>or</span>
      <Button.Link class="secondary" href="/signin/google" disabled={!googleSigninRequest.ready || googleSigninRequest.loading} onClick={onGoogleSignin}>
        {googleSigninRequest.loading ? <Icon.Spinner /> : <Icon.LogosGoogle />}
        Sign in with Google
      </Button.Link>
      <Button.Link class="secondary" href="/signin/apple" disabled={!appleSigninRequest.ready || appleSigninRequest.loading} onClick={onAppleSignin}>
        {appleSigninRequest.loading ? <Icon.Spinner /> : <Icon.LogosApple style="width: 24px; height: 24px; margin-top: -10px;" />}
        Sign in with Apple
      </Button.Link>
      <br />
      <br />
      <ul class="alternatives">
        <li>
          Need an account? <a href="/signup">Sign up</a>
        </li>
        <li class=" gray">
          <br />
          <a href="/reset_password" class="dark-gray">Forgot password?</a>
        </li>
      </ul>
    </Form>
  </Page>
}