import request from 'request';


export async function befriend(req, sourceId, targetId) {
  try {
    const query = `INSERT INTO friendships(source_id, target_id, created_at) VALUES($1, $2, NOW()),($2, $1, NOW()) ON CONFLICT DO NOTHING RETURNING *`
    const friendships = await req.locals.select(
      query, 
      [sourceId, targetId],
      'befriend-user'
    )
    return true;
  } catch(e) {
    console.log(e)
    return false;
  }
}

export async function befriendAndNotify(req, sourceId, targetId) {
  if (await befriend(req, sourceId, targetId)) {
    const inviter = await req.locals.selectOne(
      'SELECT * FROM private.users WHERE id=$1',
      [sourceId],
      'find-user-by-id'
    );
    return req.locals.app.locals.sendNotification(req, targetId, { 
      title: 'Someone added you as a friend',
      body: `${inviter.name.split(' ')[0]} just added you as a friend.`,
      link: `/users/${targetId}/friends/${sourceId}`
    });
  }
}


export default (app, req) => {
  app.deleteAsync('/friendships/:id', app.locals.userOnly, async (req, res) => {
    const query = `DELETE FROM friendships WHERE id=$1 RETURNING *`
    const friendship = await req.locals.selectOne(query, [req.params.id]);
    if (friendship) {
      const query2 = `DELETE FROM friendships WHERE target_id=$1 and source_id=$2 RETURNING *`
      await req.locals.query(query2, [friendship.sourceId, friendship.targetId]);
    }
    return { }
  });

  const invite = async (req, email, role) => {
    const oldInvite = await req.locals.selectOne(
      app.locals.SELECT('invites', {}) + ' WHERE email=$1',
      [email],
      'find-old-invite'
    );
    if (oldInvite) {
      return;
    }

    const token = app.locals.genRandomString(32);
    const invites = await req.locals.select(
      app.locals.UPSERT('invites', ['inviter_id', 'email', 'token', 'role']),
      [JSON.stringify({
        inviter_id: req.locals.user.id,
        email: email,
        token: token,
        role: role
      })],
      'upsert-invite'
    );
    if (process.env.NODE_ENV == 'production') process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `# New invite\n*From:* <${process.env.APP_URL}/users/${req.locals.user.id}|${req.locals.user.name}>\n*To:* ${email}\n`
      },
      json: true,
    });

    // Only the inviter's name goes into the email (the old code sent the whole
    // user record, API key included, to the email provider).
    app.locals.sendEmail('friendInvite', {
      inviter: { name: req.locals.user.name },
      url: `${process.env.APP_URL}/invites/${token}?campaign=Email&action=Invite&uid=${req.locals.user.id}`,
    }, email)
  }

  app.postAsync('/friendships/', app.locals.possiblyUnverifiedUserOnly, async (req, res) => {
    if (req.body.emails) {
      var emails = req.body.emails.toLowerCase()
        .split(/\s*?[,;\r\n\s]\s*?/)
        .filter((email) => email.includes('@'))
      // check if we've got user with that email
      if (emails.length) {
        const query = app.locals.SELECT("users", {
          schema: 'private',
          attributes: ['id', 'name', 'email', 'verified_at']
        }) + ' WHERE email = ANY ($1)';
        const users = await req.locals.select(query, [emails]);
        await Promise.all(users.map((user) => befriendAndNotify(req, req.query.source_id, user.id)))
        emails = emails.filter((email) => users.every((user) => user.email != email));
        console.log(users, emails)
      }
      if (emails.length) {
        await Promise.all(emails.map((email) => {
          return invite(req, email, req.body.role)
        }))
        return 'Your invitation to ' + emails.join(', ') + ' has been sent!'
      }
    } else if (req.query.target_id) {
      return befriendAndNotify(req, req.locals.user.id, req.query.target_id);
    }
  });

}