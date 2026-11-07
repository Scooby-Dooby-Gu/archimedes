import request from 'request';

export default function(app) {
  app.getAsync('/companies/:companyId/invites', app.locals.findCompany, app.locals.managerOnly,  async (req, res) => {
    var query = app.locals.SELECT("invites", {
      attributes: ['id', 'email', 'role', 'user_id', 'created_at', 'accepted_at'],

      user: {
        attributes: ['id', 'name', 'email', 'avatar'],
        foreign: 'user_id'
      },

      inviter: {
        table: 'users',
        attributes: ['id', 'name', 'avatar'],
        foreign: 'inviter_id'
      },

      where: {
        company_id: { param: 2 },
        email: { $not: null },
        accepted_at: null
      },

      limit: 20,
      page: '$1',

      sort: {
        'created_at': 'desc'
      }
    })
    return req.locals.select(
      query,
      [req.query.page || 1, req.params.companyId],
      'find-invites'
    );
  });

  const inviteToCompany = async (req, email, user, role) => {

    // when inviting a registered user to a company role, just make them a manager instantly
    if (role == 'manager' && user) {
      // upgrade user to become a manager
      if (user.role == 'user') {
        await req.locals.query(`UPDATE users SET role='manager' WHERE id=$1`, [user.id]);
      }
      // add user as a manager to the company
      if (!req.locals.company.managerIds.includes(user.id)) {
        await req.locals.query(`UPDATE companies SET manager_ids=$1 WHERE id=$2`, [
          req.locals.company.managerIds.concat(user.id), 
          req.locals.company.id
        ]);
      }
      return
    }

    // if user is already in this company, dont create invite
    if (user && user.companyId == req.locals.company.id) {
      return;
    }

    const oldInvite = await req.locals.selectOne(
      "SELECT * FROM invites WHERE company_id = $1 AND email = $2 AND accepted_at is null",
      [req.params.companyId, email],
      'update-old-invite'
    );

    if (oldInvite) {

      // update role if necessary
      if (role && oldInvite.role != role) {
        await req.locals.query('UPDATE invites SET role=$1 WHERE id=$2', [role, oldInvite.id]);
      }

      return;
    }
    const token = app.locals.genRandomString(32);
    const invite = await req.locals.selectOne(
      app.locals.UPSERT('invites', ['inviter_id', 'user_id', 'company_id', 'email', 'token', 'role'], 'email, company_id, accepted_at'),
      [JSON.stringify({
        company_id: req.params.companyId,
        inviter_id: req.locals.user.id,
        user_id: user ? user.id : null,
        email: email,
        token: token,
        role: role
      })],
      'upsert-company-invite'
    );
    if (user) {
      var templateId = 'd-ce915eb550ab41cfb6f165bb5ec2174d';
      var subject = `${req.locals.user.name} invited you to join ${req.locals.company.name} workspace on Archimedes`
    } else {
      var templateId = 'd-72902755f34a4a42bc011e63ab075e20';
      var subject = `${req.locals.user.name} invited you to the ${req.locals.company.name} workspace on Archimedes`
    }
    if (!user) {
      if (process.env.NODE_ENV == 'production') process.env.SLACK_WEBHOOK_URL && request({
        url: process.env.SLACK_WEBHOOK_URL,
        method: 'POST',
        body: {
          text: `# New invite\n*From:* <${process.env.APP_URL}/users/${req.locals.user.id}|${req.locals.user.name}>\n*To:* ${email}\n* Company:* ${req.locals.company.name}`
        },
        json: true,
      });
    }
    app.locals.sendEmailFromTemplate(templateId, subject, {
      url: `${process.env.APP_URL}/invites/${token}?campaign=Email&action=Invite`,
      user: user ? {
        ...user,
        firstName: user.name.split(' ')[0]
      } : null,
      inviter: {
        name: req.locals.user.name,
        firstName: req.locals.user.name.split(' ')[0],
        id: req.locals.user.id,
        avatar: req.locals.user.avatar
      },
      company: req.locals.company
    }, email)
  }

  app.postAsync('/companies/:companyId/invites', app.locals.findCompany, app.locals.managerOnly, async (req, res) => {
    var emails = req.body.emails.toLowerCase()
      .split(/\s*?[,;\r\n\s]\s*?/)
      .filter((email) => email.includes('@'))

    var role = req.body.role || null;

    // check if we've got users with given emails
    if (emails.length) {
      const query = app.locals.SELECT("users", {
        schema: 'private',
        attributes: ['id', 'name', 'email', 'companyId', 'role'],

        company: {
          attributes: ['id', 'name', 'image'],
          foreign: "company_id",
          schema: "public"
        },

        where: {
          email: { $in: { param: 1 } }
        }
      });
      const users = await req.locals.select(
        query,
        [emails]
      );
      await Promise.all(users.map((user) => {
        return inviteToCompany(req, user.email, user, role)
      }))
      emails = emails.filter((email) => users.every((user) => user.email != email));
    }

    // invite the rest of emails to sign up
    if (emails.length) {
      await Promise.all(emails.map((email) => 
        inviteToCompany(req, email, null, role)))
      return 'Your invitation to ' + emails.join(', ') + ' has been sent!'
    }
  })
}