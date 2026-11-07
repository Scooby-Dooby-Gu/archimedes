export default (app, req) => {
  app.postAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId/replies', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("discussions", {
      attributes: ['id', 'name', 'user_id', 'description', 'image', 'created_at'],

      topic: {
        required: true,
        attributes: ['id', 'name', 'description', 'icon', 'cover'],
        foreign: 'topic_id',

        board: {
          required: true,
          attributes: ['id', 'name', 'description', 'icon', 'cover'],
          foreign: 'board_id'
        }
      }
    });
    const results = await req.locals.select(
      query + " WHERE discussions.id = $1 AND associated_topic_id = $2",
      [req.params.discussionId, req.params.topicId/*, req.params.boardId*/],
      'find-discussion-to-reply'
    );
    const discussion = results[0];
    if (!discussion) {
      throw new app.locals.NotFound('Discussion is not found')
    }

    const replies = await req.locals.select(
      "SELECT * from replies where discussion_id=$1",
      [discussion.id],
      'find-replies-in-discussion'
    )

    const targets = await req.locals.select(
      "SELECT * from replies where id=ANY($1)",
      [req.body.reply.target_reply_ids || []],
      'find-reply-targets'
    )

    const reply = await req.locals.selectOne(
      "INSERT INTO replies(user_id, discussion_id, body, target_reply_ids) VALUES($1, $2, $3, $4) RETURNING *",
      [req.locals.user.id, discussion.id, req.body.reply.body, req.body.reply.target_reply_ids || []],
      'upsert-reply'
    )
    
    const notifications = [];

    targets.forEach((r) => {
      if (!notifications.find((n) => n[0] == r.userId) && r.userId !== req.locals.user.id) {
        notifications.push([r.userId, {
          title: `You\'ve got a response`,
          link: `/boards/${req.params.boardId}/topics/${req.params.topicId}/discussions/${req.params.discussionId}`,
          body: reply.body.substring(0, 100),
        }])
      }
    });
    
    if (!notifications.find((n) => n[0] == discussion.userId) && discussion.userId !== req.locals.user.id) {
      notifications.push([discussion.userId, {
        title: 'You\'ve got a response',
        link: `/boards/${req.params.boardId}/topics/${req.params.topicId}/discussions/${req.params.discussionId}`,
        body: reply.body.substring(0, 100),
      }]);
    }

    targets.forEach((r) => {
      if (!notifications.find((n) => n[0] == r.userId) && r.userId !== req.locals.user.id) {
        notifications.push([r.userId, {
          title: 'You\'ve got a response',
          link: `/boards/${req.params.boardId}/topics/${req.params.topicId}/discussions/${req.params.discussionId}`,
          body: reply.body.substring(0, 100),
        }])
      }
    });

    replies.forEach((r) => {
      if (!notifications.find((n) => n[0] == r.userId) && r.userId !== req.locals.user.id) {
        if (new Date - new Date(r.createdAt) < 60 * 60 * 1000 * 24 * 30) {
          notifications.push([r.userId, {
            title: 'Someone replied in the discussion',
            link: `/boards/${req.params.boardId}/topics/${req.params.topicId}/discussions/${req.params.discussionId}`,
            body: reply.body.substring(0, 100),
          }])
        }
      }
    })
    await Promise.all(notifications.map((notification) => {
      return app.locals.sendNotification(req, notification[0], notification[1], '1 hour')
    }))

    return reply
  });

  app.deleteAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId/replies/:replyId', async (req, res) => {
    const query = "DELETE FROM replies WHERE id = $1 RETURNING *";
    const reply = await req.locals.selectOne(
      query,
      [req.params.replyId],
      'delete-reply'
    );
    return { reply: reply }
  });


  app.postAsync('/boards/:boardId/topics/:topicId/discussions/:discussionId/replies/:replyId/votes', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("replies", {
      discussion: {
        attributes: ['id', 'name', 'description', 'image', 'created_at'],
        foreign: 'discussion_id',

        topic: {
          required: true,
          attributes: ['id', 'name', 'description', 'icon', 'cover'],
          foreign: 'topic_id',

          board: {
            required: true,
            attributes: ['id', 'name', 'description', 'icon', 'cover'],
            foreign: 'board_id'
          }
        }
      }
    });
    const results = await req.locals.select(
      query + " WHERE replies.id=$1 AND associated_discussion_id = $2",
      [req.params.replyId, req.params.discussionId/*, req.params.topicId, req.params.boardId*/]
    );
    const reply = results[0];
    if (!reply) {
      throw new app.locals.NotFound('Reply is not found');
    }

    // upsert vote by user
    const vote = await req.locals.query(
      `INSERT INTO votes(user_id, reply_id, score) VALUES($1, $2, $3) 
       ON CONFLICT(reply_id, user_id) DO
       UPDATE SET score = $3
       RETURNING *`,
      [req.locals.user.id, reply.id, req.query.score]
    )

    return { vote }
  });
}