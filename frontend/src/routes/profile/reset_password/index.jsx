import { Page, Form, FormField, Button } from '/components/index.jsx';
import { useAsyncForm, useMemo } from "/lib/hooks";

export default function ResetPassword({token}) {
  const [formSubmission, onSubmit] = useAsyncForm()

  const navigation = useMemo(() => ({
    parentAlwaysShow: true,
    headerTheme: 'gray',
    pageTheme: 'gray',
    title: 'Reset password',
    titleNode: [],
    parentLink: '/signin',
    parentTitle: 'Sign in'
  }), [])
  return <Page id="reset_password" class="centered" navigation={navigation}>
    <div class="intro">
      <img src="/assets/images/illustrations/account.svg" style="height: 300px; width: auto;" />
      <h1 class="largest">Forgot password?</h1>
      {formSubmission.initial && <p> It's not a big deal! Just type in your email</p>}
      {!formSubmission.initial && [
        <br />,
        <p>We've just sent an email with instructions to reset your password to the address provided.</p>,
      ]}
    </div>
    <br />
    {formSubmission.initial && [
      <Form action='/password_reset_requests' method="POST" onSubmit={onSubmit}>
        <FormField name="passwordResetRequest[email]" type="email" label="Email" required />
        <br />
        <Button.Submit class="primary" loading={formSubmission.loading}>Reset</Button.Submit>
      </Form>
    ]}
  </Page>
}