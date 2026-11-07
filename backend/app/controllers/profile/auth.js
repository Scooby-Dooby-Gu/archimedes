import multer from 'multer';
import request from 'request';
import { befriend } from './friendships.js';
import { findCompanyById } from '../../helpers/finders.js';
import { addCompanyManager } from '../admin/companies.js';

var upload = multer()


export async function sendWaitlistApprovalEmail(req, user, company) {
  return req.locals.app.locals.sendEmail('waitlistApproval', {
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

// Check a password against a user row; upgrades legacy/weak hashes in place.
async function passwordMatches(req, user, password) {
  const app = req.locals.app;
  const { ok, needsRehash } = await app.locals.verifyPassword(password, user.hashedPassword, user.salt);
  if (ok && needsRehash) {
    const { hashedPassword, salt } = await app.locals.hashPassword(password);
    await req.locals.query(
      'UPDATE private.users SET hashed_password=$1, salt=$2 WHERE id=$3',
      [hashedPassword, salt, user.id]
    );
  }
  return ok;
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
        if (user.external?.source === 'apple') {
          throw new app.locals.Unauthorized('The user does not have password and needs to log in with Apple.')
        } else {
          throw new app.locals.Unauthorized('The user does not have password and needs to log in with Google.')
        }
      }
      if (await passwordMatches(req, user, req.body.user.password)) {
        return { user };
      }
    }
    throw new app.locals.Unauthorized('The password provided does not match with the email address');
  })


  app.postAsync('/signin/external', async (req, res) => {
    // Identity must come from a verified provider credential, never from the
    // request body: otherwise anyone could sign in as any email address.
    const source = req.body.user?.external?.source;

    let profile;
    if (source === 'google') {
      try {
        profile = await app.locals.verifyGoogleAuthCode(req.body.user.external.code);
      } catch(e) {
        // Log only the reason: the full error includes the request, client secret and all.
        console.log("Google sign-in failed:", e.code || "", e.message)
        throw new app.locals.Unauthorized('Could not validate Google sign-in. Please try again.');
      }
    } else if (source === 'apple' && app.locals.appleSigninEnabled()) {
      try {
        profile = await app.locals.verifyAppleToken(req.body.user.external.idToken);
      } catch(e) {
        console.log("Apple sign-in failed:", e.code || "", e.message)
        throw new app.locals.Unauthorized('Could not validate Apple sign-in. Please try again.');
      }
    } else {
      throw new app.locals.Unauthorized('This sign-in method is not available.');
    }

    // Display details that are not part of the identity: keep what we have
    // rather than overwrite it with blanks (Apple only sends a name once, and
    // that name is not covered by its token).
    const existing = await req.locals.selectOne(
      'SELECT name, avatar FROM private.users WHERE email=$1',
      [profile.email]
    );
    const suppliedName = typeof req.body.user.name === 'string' ? req.body.user.name.trim().slice(0, 200) : '';
    profile.name = profile.name || existing?.name || suppliedName || (source === 'apple' ? 'Apple User' : profile.email);
    profile.avatar = profile.avatar || existing?.avatar || null;

    const apiKey = app.locals.genRandomString(32);
    var user = await req.locals.selectOne(
      app.locals.UPSERT('private.users',
        ['email', 'name', 'avatar', 'external', 'verified_at', 'api_key'],
        'email',
        [],
        ['name', 'avatar', 'verified_at', 'api_key', 'external']),
      [JSON.stringify({
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
        external: {
          source,
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
        },
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
    return app.locals.sendEmail('verification', {
      url: `${process.env.APP_URL}/verify?token=${user.verificationToken}&campaign=Email&action=Verified&uid=${user.id}`,
      company
    }, user.email)
  }

  const sendWaitlistEmail = (app, user, company) => {
    return app.locals.sendEmail('waitlist', { company }, user.email)
  }

  const notifyAboutSignup = (app, user) => {
    if (process.env.NODE_ENV == 'production') process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `# New signup\n*Name:* <${process.env.APP_URL}/users/${user.id}|${user.name}>\n*Email:* ${user.email}`
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
      if (!user.hashedPassword) {
        // Accounts created through Google/Apple have no password. Never hand
        // them out to someone who merely knows the email address.
        throw new app.locals.BadRequest('This email is already registered through Google or Apple. Please sign in that way.');
      } else if (await passwordMatches(req, user, req.body.user.password)) {
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

    if (typeof req.body.user.password !== 'string' || req.body.user.password.length < 8) {
      throw new app.locals.BadRequest('Password must be at least 8 characters.');
    }
    const { hashedPassword, salt } = await app.locals.hashPassword(req.body.user.password);
    const apiKey = app.locals.genRandomString(32);
    const verificationToken = app.locals.genRandomString(64);

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
      if (passwordResetRequest.usedAt) {
        throw new app.locals.BadRequest('This password reset link was already used. Please submit another.')
      }
      if (passwordResetRequest.createdAt < ((new Date) - 1000 * 60 * 60 * 24 * 1)) {
        throw new app.locals.BadRequest('Password reset request is expired. Please submit another.')
      }
      if (passwordResetRequest.userId != req.params.userId) {
        throw new app.locals.BadRequest('Password reset request was made for another user')
      }
    }
    if (typeof req.body.user?.password !== 'string' || req.body.user.password.length < 8) {
      throw new app.locals.BadRequest('Password must be at least 8 characters.');
    }
    const { hashedPassword, salt } = await app.locals.hashPassword(req.body.user.password);
    const user = await req.locals.selectOne(
      'UPDATE private.users SET hashed_password = $1, salt = $2, verified_at=coalesce(users.verified_at, NOW()) where id = $3 RETURNING *',
      [hashedPassword, salt, req.params.userId]
    );
    if (req.query.token) {
      // Reset links are single-use.
      await req.locals.query('UPDATE password_reset_requests SET used_at=NOW() WHERE token=$1', [req.query.token]);
    }
    return { user }
  })

}