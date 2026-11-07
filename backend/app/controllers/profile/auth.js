import multer from 'multer';
import request from 'request';
import { befriend } from './friendships.js';
import { findCompanyById } from '../../helpers/finders.js';
import { addCompanyManager } from '../admin/companies.js';

var upload = multer()


export async function sendWaitlistApprovalEmail(req, user, company) {
  var templateId = 'd-81bf6429fec84682804cc6e7784a808c';
  var subject = `Welcome to Archimedes!`
  return req.locals.app.locals.sendEmailFromTemplate(templateId, subject, {
    url: `${process.env.APP_URL}?campaign=Email&action=Appoved&uid=${user.id}`,
    company
  }, user.email)
}


export async function acceptInvitation(req, user, token, role) {
  const invite = await req.locals.selectOne(
    'UPDATE invites SET accepted_at=(case when invites.email IS NOT NULL then $1 else invites.accepted_at end) WHERE token=$2 and accepted_at is null RETURNING *',
    [new Date, token],
    'update-invite-acceptance'
  );
  if (invite) {
    if (invite.inviterId) {
      var inviter = await req.locals.selectOne(
        'SELECT * FROM private.users WHERE id=$1',
        [invite.inviterId],
        'find-user-by-id'
      );
      var unverifiedUserIds = (await req.locals.select(
        `SELECT users.id FROM users 
        INNER JOIN private.users u
        ON users.id = ANY(u.related_user_ids) OR users.id=u.id
        WHERE u.id=$1 AND u.verified_at IS NULL`,
        [invite.inviterId],
        'find-inviter-friend-ids'
      )).map((r) => r.id);
      await befriend(req, user.id, invite.inviterId);
      await req.locals.app.locals.sendNotification(req, invite.inviterId, {
        title: 'Your friend just signed up',
        body: `${user.name.split(' ')[0]} is now on Archimedes. View their progress from your leaderboard.`,
        link: `/rankings/leaderboard`,
      })
      var newlyVerifiedUsers = await req.locals.select(
        `SELECT * FROM private.users 
        WHERE id = ANY($1) AND verified_at IS NOT NULL`,
        [unverifiedUserIds],
        'find-newly-verified-inviter-friends'
      );
      newlyVerifiedUsers.forEach((friend) => {
        if (friend.id != user.id) {
          sendWaitlistApprovalEmail(req, friend)
        }
      });
      if (invite.role == 'manager' && invite.companyId) {
        const company = await findCompanyById(req, invite.companyId);
        await addCompanyManager(req, company, user);
      }
    }
    return await req.locals.selectOne(
      `UPDATE private.users 
      SET company_id=$1,
          verified_at = coalesce(verified_at, $2),
          role=$3,
          invite_id=$4
      WHERE id=$5 RETURNING *`,
      [
        invite.companyId, 
        // auto-verify self-checkin into companies
        // auto-verify when signup is open
          req.body.open == null && inviter && !inviter.verifiedAt ? null : new Date, 
        user.role === 'user' && invite.role == 'manager' ? 'manager' : user.role,
        invite.id,
        user.id]
    );
  }
  return user;
}

export default (app) => {


  app.postAsync('/signin', async (req, res) => {
    const query = app.locals.SELECT("users", {
      schema: 'private',
      attributes: ['id', 'name', 'email', 'avatar', 'salt', 'hashed_password', 'api_key', 'role', 'verified_at', 'external'],

      where: {
        email: (req.body.user.email || '').toLowerCase()
      }
    });
    const user = await req.locals.selectOne(query)
    if (user) {
      if (!user.hashedPassword) {
        if (user.external.source === 'apple') {
          throw new app.locals.Unauthorized('The user does not have password and needs to log in with Apple.')
        } else {
          throw new app.locals.Unauthorized('The user does not have password and needs to log in with Google.')
        }
      }
      if (user.hashedPassword == app.locals.sha512(req.body.user.password, user.salt)) {
        return { user };
      }
    }
    throw new app.locals.Unauthorized('The password provided does not match with the email address');
  })


  app.postAsync('/signin/external', async (req, res) => {
    try {
      if (req.body.user.external.token !== 'none' && req.body.user.external.source === 'google')
        await app.locals.verifyGoogleToken(req.body.user.external.token);

    } catch(e) {
      console.log(e)
      throw new app.locals.Unauthorized('Could not validate google auth token');
    }

    const apiKey = app.locals.genRandomString(32);
    var user = await req.locals.selectOne(
      app.locals.UPSERT('private.users', 
        ['email', 'name', 'avatar', 'external', 'verified_at', 'api_key'], 
        'email', 
        [],
        ['name', 'avatar', 'verified_at', 'api_key', 'external']),
      [JSON.stringify({
        ...req.body.user,
        verified_at: new Date,
        api_key: apiKey
      })],
      'external-signin',
    );
    
    if (new Date - user.createdAt < 60 * 1000) {
      notifyAboutSignup(app, user);
    }
    if (req.body.token) {
      return { user: await acceptInvitation(req, user, req.body.token) };
    } else {
      return { user };
    }

  })

  app.postAsync('/verifications/repeat', async (req, res) => {
    const query = app.locals.SELECT("users", {
      schema: 'private',
      attributes: ['id', 'email', 'verification_token'],

      where: {
        api_key: req.query.api_key,
        verified_at: null
      }
    });
    const user = await req.locals.selectOne(query)
    if (user) {
      sendVerificationEmail(app, user);
      return {}
    } else {
      throw new Error('The user is probably already verified. Try signing in?')
    }
  })


  app.postAsync('/verifications/:token', async (req, res) => {
    const query = app.locals.SELECT("users", {
      schema: 'private',
      attributes: ['id', 'name', 'email', 'avatar', 'salt', 'hashed_password', 'api_key', 'role', 'verified_at'],

      where: {
        verification_token: req.params.token
      }
    });
    const user = await req.locals.selectOne(query)
    if (user) {
      if (!user.verifiedAt) {
        //throw new Error('This user already verified. Try signing in.')
        user.verifiedAt = new Date;
        await req.locals.query(
          'UPDATE private.users SET verified_at=$1 WHERE id=$2',
          [user.verifiedAt, user.id]
        );
      }
      return { user };
    }
    throw new Error('Can not find user with this verification token')
  })  

  const sendVerificationEmail = (app, user, company) => {
    var templateId = 'd-c524e6064ec14fad8073334558f4a6a7';
    var subject = `Complete your signup for Archimedes`
    return app.locals.sendEmailFromTemplate(templateId, subject, {
      url: `${process.env.APP_URL}/verify?token=${user.verificationToken}&campaign=Email&action=Verified&uid=${user.id}`,
      company
    }, user.email)
  }

  const sendWaitlistEmail = (app, user, company) => {
    var templateId = 'd-875b55f2ad714d4ca833c74a6018783f';
    var subject = `You've been added to the Archimedes waitlist`;

    return app.locals.sendEmailFromTemplate(templateId, subject, {
      //url: `${process.env.APP_URL}/verify?token=${user.verificationToken}`,
      company
    }, user.email)
  }

  const notifyAboutSignup = (app, user) => {
    if (process.env.NODE_ENV == 'production') process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `# New signup\n*Name:* <https://app.getmedes.com/users/${user.id}|${user.name}>\n*Email:* ${user.email}`
      },
      json: true,
    });
  }

  app.postAsync('/signup', upload.none(), async (req, res) => {
    const email = req.body.user.email.toLowerCase();

    const query = app.locals.SELECT("users", {
      schema: 'private',
      attributes: ['id', 'name', 'email', 'bornAt', 'phoneNumber', 'avatar', 'salt', 'hashed_password', 'api_key', 'role', 'verified_at'],
    });
    var user = await req.locals.selectOne(
      query + ' WHERE email=$1',
      [email]
    )

    if (user) {
      // login user if they already have account with this password
      if (!user.hashedPassword || user.hashedPassword == app.locals.sha512(req.body.user.password, user.salt)) {
        return { user };
      } else {
        throw new app.locals.BadRequest('This email is already registered with a different password. Maybe you would to reset password?');
      }
    }

    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      throw new app.locals.BadRequest('Email is malformed');
    }

    const company = await req.locals.selectOne(
      'SELECT * FROM companies WHERE wildcards && ARRAY[$1]::varchar[]',
      [emailDomain]
    )

    const salt = app.locals.genRandomString(32);
    const apiKey = app.locals.genRandomString(32);
    const hashedPassword = app.locals.sha512(req.body.user.password, salt)
    const verificationToken = app.locals.sha512(app.locals.genRandomString(32), salt);

    user = await req.locals.selectOne(`
      INSERT INTO private.users(name, email, company_id, born_at, phone_number, salt, hashed_password, api_key, verification_token) 
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *
    `, [
      req.body.user.name,
      email,
      company ? company.id : null,
      req.body.user.bornAt || null,
      req.body.user.phoneNumber || null,
      salt,
      hashedPassword,
      apiKey,
      verificationToken
    ]);

    if (req.body.token) {
      user = await acceptInvitation(req, user, req.body.token);
    }

    notifyAboutSignup(app, user);
    
    // gated access
    if (req.body.open == null) {
      //sendWaitlistEmail(app, user, company);
    } else if (!user.verifiedAt) {
      sendVerificationEmail(app, user, company);
    }

    return { user }
  })

  app.getAsync('/users/me', app.locals.possiblyUnverifiedUserOnly, async (req, res) => {
    return {user: req.locals.user};
  })
  
  app.putAsync('/users/:userId/approve', app.locals.adminOnly, async (req, res) => {
    const user = await req.locals.selectOne(
      'UPDATE private.users SET verified_at = NOW() where id = $1 RETURNING *',
      [req.params.userId]
    );
    sendWaitlistApprovalEmail(req, user)
  })

  app.postAsync('/users/:userId/devices', app.locals.userOnly, async (req, res) => {
    var device = await req.locals.selectOne(
      app.locals.UPSERT('private.devices', ['user_id', 'platform', 'token'], 'user_id, token'),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.device,
        userId: req.locals.user.id,
      }))],
      'upsert-device'
    );
    
    return device;
  })

  app.putAsync('/users/:userId/password', async (req, res) => {
    if (!req.locals.user || req.locals.user.id != req.params.userId) {
      if (!req.query.token) {
        throw new app.locals.BadRequest('Token was not provided')
      }
      const passwordResetRequest = await req.locals.selectOne(
        'SELECT * from password_reset_requests WHERE token=$1', 
        [req.query.token]
      );
      if (!passwordResetRequest) {
        throw new app.locals.BadRequest('Password request was not found')
      }
      if (passwordResetRequest.createdAt < ((new Date) - 1000 * 60 * 60 * 24 * 1)) {
        throw new app.locals.BadRequest('Password reset request is expired. Please submit another.')
      }
      if (passwordResetRequest.userId != req.params.userId) {
        throw new app.locals.BadRequest('Password reset request was made for another user')
      }
    }
    const salt = app.locals.genRandomString(32);
    const hashedPassword = app.locals.sha512(req.body.user.password, salt);
    const user = await req.locals.selectOne(
      'UPDATE private.users SET hashed_password = $1, salt = $2, verified_at=coalesce(users.verified_at, NOW()) where id = $3 RETURNING *',
      [hashedPassword, salt, req.params.userId]
    );
    return { user }
  })

}