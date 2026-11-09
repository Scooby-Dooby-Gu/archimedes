import { passwordReset, PASSWORD_RESET_MESSAGES } from '../../states/index.js';

export default (app, req) => {
  
  app.postAsync('/password_reset_requests/', app.locals.rateLimit('password-reset-email', 5, 3600), async (req, res) => {
    const user = await req.locals.selectOne(
      "SELECT id, salt, email, name, avatar FROM private.users WHERE email = $1",
      [req.body.passwordResetRequest.email.toLowerCase()],
      'find_user_by_email'
    )
    if (user) {
      const token = app.locals.genRandomString(32);
      
      const passwordResetRequest = await req.locals.selectOne(
        app.locals.UPSERT('password_reset_requests', ['token', 'user_id']),
        [JSON.stringify({
          token: token,
          user_id: user.id
        })],
        'upsert_password_reset_request'
      );

      app.locals.sendEmail('passwordReset', {
        url: `${process.env.APP_URL}/users/${user.id}/password/edit?token=${token}&campaign=Email&action=Reset%20Password&uid=${user.id}`,
        user: { name: user.name },
      }, user.email);
    }

  });


  app.getAsync('/password_reset_requests/:token', app.locals.rateLimit('password-reset-token', 20, 900), async (req, res) => {
    const passwordResetRequest = await req.locals.selectOne(
      "SELECT id, user_id, created_at, used_at FROM password_reset_requests WHERE token = $1",
      [req.params.token],
      'find_password_reset_request_by_token'
    )
    // Lets the reset page say up front whether the link still works.
    const state = passwordReset.stateOf(passwordResetRequest);
    if (state !== 'pending') {
      throw new app.locals.BadRequest(PASSWORD_RESET_MESSAGES[state]);
    }
    return { ...passwordResetRequest, state };
  })
}
