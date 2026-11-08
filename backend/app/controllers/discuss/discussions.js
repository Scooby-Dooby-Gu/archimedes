import tsquery from '../../../lib/sql/tsquery.js';

export default (app, req) => {

  app.getAsync('/discussions', async (req, res) => {

    var query = app.locals.SELECT("discussions", {
      attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'reply_count', 'closed_at', 'pinned_at', 'assistance_requested_at', 'assistance_provided_at'],

      user: {
        foreign: 'user_id',
        attributes: ['id', 'name', 'avatar', 'avatarSizes']
      },

      topic: {
        required: true,
        attributes: ['id', 'name', 'description', 'icon', 'cover'],
        foreign: 'topic_id',

        board: {
          required: true,
          attributes: ['id', 'name', 'description', 'icon', 'cover'],
          foreign: 'board_id'
        }
      },

      where: {
        1: 1
      },

      limit: 20,
      page: { param: 1 }
    })
    query = query.replace(/('[^\']+', )([a-z_]+\.[a-z_]+)/g, (m, left, right) => {
      if (right.match(/\.jsonb|_id|\.id|count|score|avatar/))
        return m;
      return `${left}ts_headline('english', '' || coalesce(${right}::text, ''), to_tsquery('english', $2))`
    })
    return req.locals.selectAndCount(
      query.replace('1 = 1', `search @@ to_tsquery('english', $2)`),
      [req.query.page, tsquery(req.query.query)],
      'search-discussions'
    );
    
  })

  // Authors can delete their own discussions; moderators can delete any.
  app.deleteAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId', app.locals.userOnly, async (req, res) => {
    const query = "DELETE FROM discussions WHERE id = $1 AND ($2 OR user_id = $3) RETURNING *";
    const discussion = await req.locals.selectOne(
      query,
      [req.params.discussionId, app.locals.isModerator(req.locals.user), req.locals.user.id],
      'delete-discussion'
    );
    return { discussion: discussion }
  });

  app.getAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId', async (req, res) => {
    const query = app.locals.SELECT("discussions", {
      attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'reply_count', 'closed_at', 'pinned_at', 'assistance_requested_at', 'assistance_provided_at'],

      topic: {
        required: true,
        attributes: ['id', 'name', 'description', 'icon', 'cover'],
        foreign: 'topic_id',

        board: {
          required: true,
          attributes: ['id', 'name', 'description', 'icon', 'cover'],
          foreign: 'board_id'
        }
      },

      user: {
        foreign: 'user_id',
        attributes: ['id', 'name', 'avatar', 'avatarSizes']
      },

      replies: {
        attributes: ['id', 'body', 'image', 'created_at', 'score'],

        targets: {
          foreign: 'target_reply_ids',
          alias: 'target',
          table: 'replies',
          attributes: ['id', 'body', 'image', 'created_at', 'score'],

          user: {
            foreign: 'user_id',
            attributes: ['id', 'name', 'avatar', 'avatarSizes']
          },
        },

        user: {
          foreign: 'user_id',
          attributes: ['id', 'name', 'avatar', 'avatarSizes']
        },

        vote: {
          attributes: ['id', 'score'],
          where: {
            user_id: { param : 2 }
          }
        },

        sort: {
          //score: 'desc',
          created_at: 'asc'
        },

        page: { param: 1 },
        limit: 50
      }
    });
    
    const discussion = await req.locals.selectOne(
      query + " WHERE discussions.id = $3",
      [req.query.page, req.locals.user ? req.locals.user.id : -1, req.params.discussionId],
      'find-discussion'
    );
    if (!discussion) {
      throw new app.locals.NotFound('Discussion is not found')
    }
    return {discussion}
  });


  app.postAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId?', app.locals.userOnly, app.locals.rateLimit('discussions', 20, 3600), app.locals.upload.single('discussion[image]'), async (req, res) => {
    const image = req.file
    const isModerator = app.locals.isModerator(req.locals.user);
    // Editing an existing discussion: only its author or a moderator.
    if (req.params.discussionId) {
      const existing = await req.locals.selectOne(
        'SELECT user_id FROM discussions WHERE id = $1',
        [req.params.discussionId],
        'find-discussion-owner'
      );
      if (!existing) throw new app.locals.NotFound('Discussion is not found');
      if (!isModerator && existing.userId !== req.locals.user.id) throw new app.locals.Forbidden;
    }
    // Pinning, closing and linking a lesson's feedback thread are for moderators/writers.
    if (!isModerator) {
      delete req.body.discussion.closedAt;
      delete req.body.discussion.pinnedAt;
    }
    if (!app.locals.isWriter(req.locals.user)) {
      delete req.body.discussion.lessonId;
      delete req.body.discussion.lesson_id;
    }
    // Only moderators can change closed/pinned; for everyone else they stay as they are.
    const keepAttributes = ['user_id', 'lesson_id'].concat(
      !isModerator || req.body.discussion.closedAt ? ['closed_at'] : [],
      !isModerator || req.body.discussion.pinnedAt ? ['pinned_at'] : []
    )
    var discussion = await req.locals.selectOne(
      app.locals.UPSERT('discussions', ['user_id', 'topic_id', 'name', 'description', 'image', 'image_sizes', 'closed_at', 'pinned_at', 'lesson_id'], undefined, ['image'], keepAttributes),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.discussion,
        id: req.params.discussionId || null,
        user_id: req.locals.user.id,
        topic_id: req.params.topicId,
        closed_at: req.body.discussion.closedAt ? new Date : null,
        pinned_at: req.body.discussion.pinnedAt ? new Date : null,
        image: req.file ? req.file.location : null,
      }))]
    );

    // rename image attachment
    if (req.file) {
      if (req.file) {
        const imagePath = `discussions/${discussion.id}/image.${req.file.mimetype.split('/')[1].split('+')[0]}`
        const sizes = await app.locals.s3uploadResponsive(req.file, imagePath, [480, 960, 1280]);
        await req.locals.query(
          "UPDATE discussions SET image = $1, image_sizes = $2 WHERE id = $3", 
          [sizes.default, sizes, discussion.id]);
        discussion.imageSizes = sizes
        discussion.image = sizes.default
      }
    }

    return {discussion};
  })


  app.putAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId/assistance', app.locals.userOnly, async (req, res) => {
    
    if (req.body.state === 'request') {
      await req.locals.query("UPDATE discussions SET assistance_requested_at=NOW() WHERE id=$1", [req.params.discussionId]);
    } else if (req.body.state === 'cancel') {
      await req.locals.query("UPDATE discussions SET assistance_requested_at=NULL WHERE id=$1", [req.params.discussionId]);
    } else if (req.body.state === 'resolve') {
      await req.locals.query("UPDATE discussions SET assistance_provided_at=NOW() WHERE id=$1", [req.params.discussionId]);      
    } else if (req.body.state === 'reset') {
      await req.locals.query("UPDATE discussions SET assistance_provided_at=null,assistance_requested_at=NOW() WHERE id=$1", [req.params.discussionId]);      
    }
    if (req.body.state === 'request' || req.body.state === 'reset') {
      const discussion = await req.locals.selectOne("SELECT name, topic_id from discussions where id=$1", [req.params.discussionId]);
      const experts = (await req.locals.select(`SELECT id FROM private.users where role = 'admin'`));
      await Promise.all(experts.map((user) => {
        return req.locals.app.locals.sendNotification(req, user.id, {
          title: 'Assistance requested',
          body: 'In "' + discussion.name + '"',
          link: `/boards/${req.params.boardId}/topics/${discussion.topicId}/discussions/${req.params.discussionId}`,
        })
      }))
    }
    return req.body;
  })
}