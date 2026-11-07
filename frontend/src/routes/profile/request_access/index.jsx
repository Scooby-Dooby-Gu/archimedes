import { useStore, useMemo, useAsyncForm, useSignin } from '/lib/hooks/index.jsx';
//import style from './style.module.scss';
import { Icon, Button, Page, Form, FormField } from '/components/index.jsx';


export default function({email, token, header, navigation}) {
  const { app: { open }} = useStore();
  const [setUser, onGoogleSignin, googleSigninRequest, onAppleSignin, appleSigninRequest] = useSignin({
    token
  })
  const [request, onSubmit] = useAsyncForm((response) => {
    setUser(response.data.user);
  })

  if (!token && !navigation) {
    navigation = useMemo(() => ({
      //headerTheme: 'gray',
      //pageTheme: 'gray',
      parentAlwaysShow: true,
      title: 'Request access',
      titleNode: <Icon.LogosArchimedes style="width: auto; height: auto;" />,
      parentTitle: 'Back',
      parentLink: '/',
      requests: [request, googleSigninRequest, appleSigninRequest]
    }), [request.error, googleSigninRequest.error, appleSigninRequest.error])
  }

  return <Page class="centered" id="signup" navigation={navigation}>
    {header}
    <h1>Request access</h1>
    <p style={{textAlign: 'center',color: '#999'}}>Archimedes is in closed alpha.</p>
    <br />
    <br />
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
        label="Phone number"
        pattern="\+?[0-9() -]+"
        name="user[phoneNumber]"
        class="normal-label"
      />
      <FormField
        label="Date of birth"
        name="user[bornAt]"
        class="normal-label"
        type="date"
      />
      {<FormField
        label="Password"
        type="password"
        name="user[password]"
        class="normal-label"
        required
      />}
      <input type="hidden" name="token" defaultValue={token} />
      <br />
      <Button
        type="submit"
        value="login"
        class="primary icon-right"
        disabled={request.loading}
        loading={request.loading}
        icon="ChevronRight"
      >
        Send request
      </Button>
      <br />
      <ul class="alternatives">
        <li>
          Already registered? <a href="/signin">Sign in</a>
        </li>
        <li>
        Sign up with <a href="/signin/google" onClick={onGoogleSignin}>{googleSigninRequest.loading && <Icon.Spinner />}Google</a>
          &nbsp;or&nbsp;
          <a href="/signin/apple" onClick={onAppleSignin}>{appleSigninRequest.loading && <Icon.Spinner />}Apple</a> account
        </li>
      </ul>
    </Form>
  </Page>
}