export default (app, req) => {


  app.getAsync('/boards/:boardId/topics/:topicId', async (req, res) => {
    const discussionQuery = {
      attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'reply_count', 'pinned_at', 'last_reply_at', 'closed_at', 'assistance_requested_at', 'assistance_provided_at'],

      user: {
        foreign: 'user_id',
        attributes: ['id', 'name', 'avatar', 'avatarSizes']
      },

      page: '$1',
      limit: 10,

      sort: {
        pinned_at: 'desc nulls last',
        last_reply_at: 'desc'
      }
    }
    // FIXME: Currently does not respect board scoping
    if (req.params.topicId === 'all') {
      const query = app.locals.SELECT("discussions", {
        ...discussionQuery,
        sort: {
          last_reply_at: 'desc'
        }
      });
      return {
        topic: {
          name: 'All discussions',

          board: {
            id: req.params.boardId
          },

          discussions: await req.locals.select(query, 
            [req.query.page]
          )
        } 
      }
    } else if (req.params.topicId == 'requests') {
      // Discussions whose assistance state isn't 'none' (app/states/assistance.js).
      const query = app.locals.SELECT("discussions", {
        ...discussionQuery,
        sort: {
          assistance_requested_at: 'desc NULLS last'
        },

        where: {
          $or: {
            
            assistance_requested_at: {$not: null},
            assistance_provided_at: {$not: null} 
          }
        }
      });
      return {
        topic: {
          name: 'Assistance requested',

          board: {
            id: req.params.boardId
          },

          discussions: await req.locals.select(query, 
            [req.query.page]
          )
        } 
      }
    } else {
      const query = app.locals.SELECT("topics", {
        attributes: ['id', 'name', 'description', 'icon', 'cover',  'discussion_count', 'is_hidden'],
  
        discussions: discussionQuery,
  
        board: {
          required: true,
          attributes: ['id', 'name', 'description', 'icon', 'cover'],
          foreign: 'board_id'
        }
      });
      const topic = await req.locals.selectOne(
        query + ' WHERE topics.id = $2',
        [req.query.page, req.params.topicId],
        'find-topic'
      );
      return { topic }
    }
  });

  app.deleteAsync('/boards/:boardId/topics/:topicId', app.locals.moderatorOnly, async (req, res) => {
    const query = "DELETE FROM topics WHERE id = $1 RETURNING *";
    const result = await req.locals.selectOne(
      query,
      [req.params.topicId],
      'delete-topic'
    );
    return { topic: result }
  });

  app.postAsync('/boards/:boardId/topics/:topicId/move', app.locals.moderatorOnly, async (req, res) => {
    await req.locals.query(`
      UPDATE topics t
      SET "order" = CASE
        WHEN t.id = $2 THEN
          $3
        WHEN t2.new_order < $3 THEN
          t2.new_order
        ELSE
          t2.new_order + 1
        END
      FROM (SELECT id, row_number() OVER (ORDER BY "order" asc) as new_order
            FROM topics
            WHERE board_id=$1 AND id != $2) t2
      WHERE t2.id = t.id or t.id = $2
      RETURNING *`,
      [req.params.boardId, req.params.topicId, req.body.order]);
    return {};
  });

  app.postAsync('/boards/:boardId/topics/:topicId?', app.locals.moderatorOnly, app.locals.upload.fields([
    {name: 'topic[icon]', maxCount: 1},
    {name: 'topic[cover]', maxCount: 1}
  ]), async (req, res) => {
    const image = req.file

    const results = await req.locals.query(
      app.locals.UPSERT('topics', ['board_id', 'name', 'description', 'icon', 'cover', 'is_hidden'], undefined, ['icon', 'cover']),
      [JSON.stringify({
        ...req.body.topic,
        is_hidden: req.body.topic.isHidden,
        id: req.params.topicId || null,
        board_id: req.params.boardId,
        icon: req.file ? req.file.location : null,
      })]
    );

    const topic = results.rows[0];
    const icon = req.files['topic[icon]'] && req.files['topic[icon]'][0]
    const cover = req.files['topic[cover]'] && req.files['topic[cover]'][0]
    if (topic && icon) {
      const path = `boards/${topic.id}.${icon.mimetype.split('/').pop().split('+')[0]}`;
      topic.icon = await app.locals.s3uploadAndUnlink(icon, path);
      await req.locals.query(
        "UPDATE topics SET icon = $1 WHERE id = $2", 
        [topic.icon, topic.id]
      );
    }
    if (topic && cover) {
      const path = `boards/${topic.id}.cover.${cover.mimetype.split('/').pop().split('+')[0]}`;
      topic.cover = await app.locals.s3uploadAndUnlink(cover, path);
      await req.locals.query(
        "UPDATE topics SET cover = $1 WHERE id = $2", 
        [topic.cover, topic.id]
      );
    }
    return {topic};
  })
}