export default (app, req) => {

  app.postAsync('/users/:userId/submissions', app.locals.userOnly, async (req, res) => {
    const submission = await req.locals.selectOne(
      app.locals.UPSERT('submissions', ['type', 'ref', 'data', 'is_complete', 'is_skipped', 'ambition_id', 'goal_id', 'user_id', 'video_id', 'lesson_id', 'task_id'], 'user_id, type, ref', ['data', 'is_complete']),
      [JSON.stringify(app.locals.nullifyObject(app.locals.underscoreObject({
        ...req.body.submission,
        user_id: req.locals.user.id,
        type: req.body.submission.type || 'lesson'
      })))],
      'insert-submission'
    );

    return { submission}
  })

  app.getAsync('/users/:userId/submissions', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("submissions", {
      attributes: ['id', 'type', 'ref', 'data', 'is_complete', 'ambition_id', 'is_skipped', 'goal_id', 'video_id', 'lesson_id', 'created_at', 'task_id'],

      sort: {created_at: 'desc'},

      where: {
        user_id: {param: 1}
      }
    })
    const submissions = await req.locals.select(
      query,
      [
        req.params.userId, 
      ],
      'find-user-submissions'
    );

    return { submissions }
  })

}