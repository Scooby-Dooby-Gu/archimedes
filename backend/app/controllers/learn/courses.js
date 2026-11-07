export default (app, req) => {

  app.postAsync('/courses/:courseId?', app.locals.writerOnly, app.locals.upload.single('course[icon]'), async (req, res) => {
    const results = await req.locals.query(
      app.locals.UPSERT('courses', ['name', 'description', 'color', 'difficulty', 'state']),
      [JSON.stringify({
        ...req.body.course,
        id: req.params.courseId || null,
      })]
    );

    const course = results.rows[0];
    if (course && req.file) {
      const path = `courses/${course.id}.${req.file.mimetype.split('/').pop().split('+')[0]}`;
      course.icon = await app.locals.s3uploadAndUnlink(req.file, path);
      await req.locals.query(
        "UPDATE courses SET icon = $1 WHERE id = $2", 
        [course.icon, course.id]
      );
    }

    return { course };
  })

  app.getAsync('/courses/', /*app.locals.userOnly, */async (req, res) => {
    const query = app.locals.SELECT("courses", {
      attributes: ['id', 'name', 'description', 'difficulty', 'color', 'duration', 'icon', 'cover', 'state', 'order'],

      lessons: {
        attributes: ['id', 'course_id', 'previous_lesson_id', 'name', 'description', 'glossary_terms','image', 'image_sizes', 'difficulty', 'duration', 'chapter_count', 'questions', 'created_at', 'order', 'slugs', 'author_id', 'slugs', 'published_at'],

        author: {
          attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes', 'role', 'companyId' ],
          foreign: 'author_id',
          table: 'users'
        },

        sort: {order: 'asc NULLS LAST', created_at: 'asc'}
      },

      sort: {order: 'asc NULLS LAST', created_at: 'asc'}
    });

    const courses = await req.locals.select(
      query,
      [], 
      'find-courses'
    );

    return { courses }
  });


  app.deleteAsync('/courses/:courseId', app.locals.userOnly, async (req, res) => {
    const query = "DELETE FROM courses WHERE id = $1 RETURNING *";
    const course = await req.locals.selectOne(
      query,
      [req.params.courseId],
      'delete-course'
    );
    return { course }
  });

  app.postAsync('/courses/:courseId/move', app.locals.userOnly, async (req, res) => {
    await req.locals.query(
      app.locals.MOVE('courses', 'id'),
      [req.params.courseId, req.body.order],
      'move-course');
    return {};
  });

  app.getAsync('/courses/:courseId', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("courses", {
      attributes: ['id', 'name', 'description', 'icon', 'cover', 'color', 'difficulty', 'duration', 'state'],

      lessons: {
        attributes: ['id', 'course_id', 'previous_lesson_id', 'name', 'description', 'glossary_terms', 'image', 'image_sizes', 'difficulty', 'duration', 'chapter_count', 'questions'],

        author: {
          attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes', 'role', 'companyId' ],
          foreign: 'author_id',
          table: 'users'
        },
        
        sort: {difficulty: 'asc', order: 'asc NULLS LAST', created_at: 'asc'},
      },


      sort: {
        order: 'asc NULLS LAST', 
        created_at: 'asc'
      },

      where: {
        id : {param: 1},
        state: {$in: {param: 2}}
      }
    });
    const course = await req.locals.selectOne(
      query,
      [
        req.params.courseId,
        ['user', 'visitor'].includes(req.locals.user.role) ? ['public', 'preview'] : ['public', 'preview', 'hidden']
      ],
      'find-course'
    );

    if (!course) {
      throw new Error('Can not find a course')
    }

    return { course }
  });
}