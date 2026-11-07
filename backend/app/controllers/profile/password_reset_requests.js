export default (app, req) => {
  
  app.postAsync('/password_reset_requests/', async (req, res) => {
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

      const templateId = 'd-b7b0585b77d9429485f6a7d99a0bd78f';
      const subject = 'Reset your password for Archimedes';
      app.locals.sendEmailFromTemplate(templateId, subject, {
        url: `${process.env.APP_URL}/users/${user.id}/password/edit?token=${token}&campaign=Email&action=Reset%20Password&uid=${user.id}`,
        user: {
          ...user,
          firstName: user.name.split(' ')[0]
        },
      }, user.email);
    }

  });


  app.getAsync('/password_reset_requests/:token', async (req, res) => {
    const passwordResetRequest = await req.locals.selectOne(
      "SELECT id, user_id, created_at FROM password_reset_requests WHERE token = $1",
      [req.params.token],
      'find_password_reset_request_by_token'
    )
    if (passwordResetRequest.createdAt < (new Date - 1000 * 60 * 60 * 24 * 1)) {
      throw new app.locals.BadRequest('Password reset request is expired. Please submit another.')
    }
    return passwordResetRequest;
  })
}
