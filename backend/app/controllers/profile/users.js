import { acceptInvitation } from "./auth.js";

export default (app, req) => {

  app.getAsync('/users/:id', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("users", {
      schema: 'private',
      attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes', 'role', 'phoneNumber', 'settings', 'bornAt', 'companyId', 'related_user_ids', 'bio_html'],

      company: {
        schema: 'public',
        attributes: ['id', 'name', 'image', 'image_sizes', 'topicId', 'managerIds'],
        table: 'companies',
        foreign: 'company_id'
      },

      workspaces: {
        schema: 'public',
        table: 'companies',
        attributes: ['id', 'name', 'image', 'image_sizes', 'managerIds', 'topicId'],
        key: 'manager_ids',
      },

      friendships: {
        schema: 'public',
        table: "friendships",
        key: "source_id",
        attributes: ['id', 'target_id'],
        sort: { created_at: 'desc' }
      },

      friends: {
        alias: 'friends',
        table: "users",
        foreign: "related_user_ids",
        attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes'],
        sort: { created_at: 'desc' },
      },

      achievements: {
        schema: 'public',
        table: "user_achievements",
        attributes: ['id', 'created_at', 'updated_at'],

        definition: {
          required: true,
          table: "achievements",
          key: "id",
          foreign: "achievement_id",
          attributes: ['id', 'slug', 'name', 'summary', 'icon']
        },
      },

      where: {
        id: { param: 1}
      }
    });

    const user = await req.locals.selectOne(
      query.replace('id = $1', 'users.id = $1'),
      [req.params.id],
      'find-user'
    );

    if (!user) {
      throw new Error('Can not find the user')
    }

    // Contact details and settings are only for the user themself (or an admin).
    if (!app.locals.isSelfOrAdmin(req, user.id)) {
      delete user.email;
      delete user.phoneNumber;
      delete user.bornAt;
      delete user.settings;
      if (Array.isArray(user.friends)) user.friends.forEach((friend) => { if (friend) delete friend.email; });
    }

    return { user }
  });

  app.getAsync('/achievements', app.locals.userOnly, async (req, res) => {
    const achievements = await req.locals.select(
      app.locals.SELECT("achievements", {
        attributes: ['id', 'slug', 'name', 'summary', 'icon']
      }),
      [],
      'find-achievements'
    )

    return { achievements }
  })

  app.getAsync('/users/:userId/invites', app.locals.possiblyUnverifiedUserOnly, async (req, res) => {
    if (!app.locals.isSelfOrAdmin(req, req.params.userId)) throw new app.locals.Forbidden;
    const query = app.locals.SELECT("invites", {
      attributes: ['id', 'email', 'accepted_at', 'created_at', 'updated_at'],

      user: {
        table: "users",
        key: "id",
        foreign: "user_id",
        attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes'],
      },

      where: {
        inviter_id: { param: 1}
      }
    })
    const invites = await req.locals.select(
      query,
      [req.params.userId],
      'find-user-invites'
    );
    return { invites }
  })

  app.getAsync('/users/:userId/invite', app.locals.selfOnly, async (req, res) => {
    var invite  = await req.locals.selectOne(
      'SELECT token FROM invites WHERE inviter_id=$1 AND email is NULL',
      [req.params.userId]
    );
    if (!invite) {
      var invite = await req.locals.selectOne(
        'INSERT INTO invites(token, inviter_id, created_at, updated_at) VALUES($1,$2,$3,$4) RETURNING *',
        [app.locals.genRandomString(32), req.params.userId, new Date, new Date],
      )
    }
    return { invite }
  })

  app.getAsync('/users/:userId/achievements', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("user_achievements", {
      attributes: ['id', 'created_at', 'updated_at'],

      definition: {
        required: true,
        table: "achievements",
        key: "id",
        foreign: "achievement_id",
        attributes: ['id', 'slug', 'name', 'summary', 'icon']
      },

      where: {
        1: 1
      }
    })
    const achivements = await req.locals.selectOne(
      query.replace('1=1', 'user_id = $1 AND created_at > NOW() - \'5 seconds\'::interval'),
      [req.params.userId],
      'find-recent-user-achievements'
    );
    return { achivements }
  })

  app.deleteAsync('/users/:userId', app.locals.selfOnly, async (req, res) => {
    const query = "DELETE FROM users WHERE id = $1 RETURNING *";
    const user = await req.locals.selectOne(
      query,
      [req.params.userId],
      'delete-user'
    );
    return { user: user }
  });

  app.deleteAsync('/users/:userId/submissions', app.locals.selfOnly, async (req, res) => {
    const user = await req.locals.selectOne(
      "DELETE FROM submissions WHERE user_id = $1 RETURNING *",
      [req.params.userId],
      'delete-user-submissions'
    );
    await req.locals.selectOne(
      `DELETE FROM user_achievements 
      WHERE achievement_id=ANY(
        select id from achievements where slug like '%unlock%'
      ) 
      AND user_id = $1 
      RETURNING *`,
      [req.params.userId],
      'delete-user-unlocks'
    );
    
    return { user: user }
  });

  // Admin tool ("Sign in as this user"): returns the user's API key.
  app.getAsync('/users/:id/signin', app.locals.adminOnly, async (req, res) => {
    const query = app.locals.SELECT("users", {
      schema: 'private',
      attributes: ['id', 'name', 'email', 'avatar', 'apiKey', 'avatarSizes', 'role', 'phoneNumber', 'settings', 'bornAt', 'companyId', 'related_user_ids', 'bio_html'],

      where: {
        id: { param: 1}
      }
    })

    const user = await req.locals.selectOne(
      query.replace('id = $1', 'users.id = $1'),
      [req.params.id],
      'find-user-info'
    );
    
    return {
      user
    }
  })

  app.patchAsync('/users/:id/settings', app.locals.userOnly, async (req, res) => {
    if (!app.locals.isSelfOrAdmin(req, req.params.id)) throw new app.locals.Forbidden;
    var user = await req.locals.selectOne(
      `UPDATE private.users SET settings=$1 WHERE id=$2 RETURNING settings`,
      [JSON.stringify({
        ...(req.locals.user.settings || {}),
        ...req.body.settings
      }), req.params.id],
      'patch-user-settings'
    );
    
    return user.settings
  })

  // Bios are raw HTML shown on profiles, so only staff may set them.
  const withoutStaffFields = (req, user) => {
    if (!app.locals.isWriter(req.locals.user)) delete user.bio_html;
    return user;
  };

  app.patchAsync('/users/:id', app.locals.userOnly, app.locals.upload.single('user[avatar]'), async (req, res) => {
    if (!app.locals.isSelfOrAdmin(req, req.params.id)) throw new app.locals.Forbidden;
    var user = await req.locals.selectOne(
      app.locals.UPSERT('private.users', ['name', 'email', 'born_at', 'phone_number', 'settings', 'role', 'bio_html'], undefined, ['avatar', 'avatar_sizes', 'role', 'bio_html']),
      [JSON.stringify(withoutStaffFields(req, app.locals.underscoreObject({
        ...req.body.user,
        id: req.params.id,
        bornAt: req.body.user.bornAt || null,
        settings: req.body.user.settings || {},
        role: req.locals.user.role === 'admin' ? req.body.user.role : undefined,
      })))],
      'patch-user'
    );
    
    if (req.file) {
      const avatarPath = `users/${req.params.id}/avatar.${req.file.mimetype.split('/')[1].split('+')[0]}`
      const sizes = await app.locals.s3uploadResponsive(req.file, avatarPath, [128, 256, 1024]);
      await req.locals.query(
        "UPDATE users SET avatar = $1, avatar_sizes = $2 WHERE id = $3", 
        [sizes.default, sizes, req.params.id]);
      user.avatarSizes = sizes
      user.avatar = sizes.default
    }
    
    return { user }
  })

  app.getAsync('/invites/:token', app.locals.rateLimit('invite-token', 30, 900), async (req, res) => {
    var query = app.locals.SELECT("invites", {
      attributes: ['id', 'email', 'user_id', 'created_at', 'accepted_at', 'company_id'],

      user: {
        attributes: ['id', 'name', 'email', 'avatar'],
        foreign: 'user_id',
        
        company: {
          attributes: ['id', 'name', 'image'],
          foreign: 'company_id'
        },
      },

      company: {
        attributes: ['id', 'name', 'image'],
        foreign: 'company_id'
      },

      inviter: {
        table: 'users',
        attributes: ['id', 'name', 'avatar'],
        foreign: 'inviter_id'
      },

      where: {
        token: { param: 1}
      }
    })
    const invite = await req.locals.selectOne(
      query,
      [req.params.token],
      'find-invite-by-token'
    );
    if (!invite) throw new Error('Token not found')
    return { invite }
  });


  app.postAsync('/invites/:token', app.locals.rateLimit('invite-accept', 20, 900), async (req, res) => {
    return acceptInvitation(req, req.locals.user, req.params.token);    
  });
}