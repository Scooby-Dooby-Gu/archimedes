export function assignGoalToAmbition(req, goalId, ambitionId) {
  return req.locals.selectOne(
    req.locals.app.locals.UPSERT('goal_ambitions', [ 'goal_id', 'ambition_id'], 'goal_id, ambition_id'),
    [JSON.stringify({
      ambition_id: ambitionId,
      goal_id: goalId
    })],
    'upsert-goal-ambition'
  );
}

export default (app, req) => {
  const findAmbitionQuery = app.locals.SELECT('ambitions', {
    attributes: ['id','slugs',  'color', 'previous_ambition_id', 'tagline', 'name', 'description', 'type', 'author_id', 'question', 'image', 'image_sizes'],
    
    assignments: {
      table: 'goal_ambitions',
      attributes: ['id', 'order' ],
      own: 'ambition_id',
      sort: {
        order: 'asc NULLS LAST', 
        created_at: 'asc'
      },

      goal: {
        table: 'goals',
        foreign: 'goal_id',
        attributes: ['id', 'tagline', 'name', 'afterword_html', 'cta', 'description', 'question', 'image', 'image_sizes', 'slugs'],

        tasks: {
          attributes: ['id', 'order', 'name', 'lesson_id', 'video_id', 'url', 'description', 'type', 'visibility', 'promo_url', 'promo_cta', 'promo_image', 'promo_image_sizes'],
          lesson: {
            foreign: 'lesson_id',
            attributes: ['name']
          },
          video: {
            foreign: 'video_id',
            attributes: ['name']
          },
          sort: {
            visibility: 'asc',
            order: 'asc NULLS LAST', 
            created_at: 'asc'
          },
    
        }
      }
    },

    author: {
      schema: 'private',
      foreign: 'author_id',
      table: 'users',
      attributes: ['id', 'name']
    },


    where: {
      1: 1
    },

    sort: {
      type: 'asc',
      order: 'asc NULLS LAST', 
      created_at: 'asc',
    },

    page: {
      param: 1
    },
    limit: 20123
  })

  const findGoalQuery = app.locals.SELECT('goals', {
    table: 'goals',
    foreign: 'goal_id',
    attributes: ['id', 'name', 'tagline', 'afterword_html', 'cta', 'description', 'question', 'image', 'image_sizes', 'slugs'],

    tasks: {
      attributes: ['id', 'name', 'lesson_id', 'video_id', 'url', 'description', 'type', 'promo_url', 'promo_cta', 'promo_image', 'promo_image_sizes'],

      sort: {
        visibility: 'asc',
        order: 'asc NULLS LAST', 
        created_at: 'asc'
      }
    },
    where: {
      1: 1
    },
  })

  const findAssignmentQuery = app.locals.SELECT('goal_ambitions', {
    attributes: ['id', 'order' ],
    sort: {
      order: 'asc NULLS LAST', 
      created_at: 'asc'
    },
    goal: {
      required: true,
      table: 'goals',
      foreign: 'goal_id',
      attributes: ['id', 'tagline', 'name', 'afterword_html', 'cta', 'description', 'question', 'image', 'image_sizes', 'slugs'],
  
    },
    where: {
      1: 1
    },
  });
  const findTaskQuery = app.locals.SELECT('tasks', {
    table: 'tasks',
    attributes: ['id', 'name', 'lesson_id', 'video_id', 'url', 'description', 'type', 'visibility', 'promo_url', 'promo_cta', 'promo_image', 'promo_image_sizes'],

    where: {
      1: 1
    },
    sort: {
      visibility: 'asc',
      order: 'asc NULLS LAST', 
      created_at: 'asc'
    }
  })

  app.postAsync('/ambitions/:ambitionId?', app.locals.writerOnly, app.locals.upload.single('ambition[image]'), async (req, res) => {

    const ambition = await req.locals.selectOne(
      app.locals.UPSERT('ambitions', ['name', 'color', 'tagline', 'description', 'previous_ambition_id', 'question', 'slugs', 'type', 'author_id', 'image', 'image_sizes'], undefined, ['image', 'image_sizes']),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.ambition,
        id: req.params.ambitionId || null,
        previousAmbitionId: req.body.ambition.previousAmbitionId || null,
      }))],
      'upsert-ambition'
    );


    // rename image attachment
    if (ambition && req.file) {
      const newLocation = `ambitions/new/${ambition.id}/image.${req.file.mimetype.split('/')[1].split('+')[0]}`;
      const sizes = await app.locals.s3uploadResponsive(req.file, newLocation);
      await req.locals.query(
        "UPDATE ambitions SET image = $1, image_sizes = $2 WHERE id = $3", 
        [sizes.default, sizes, ambition.id]);
      ambition.imageSizes = sizes
      ambition.image = sizes.default
    }

    return { ambition }
  });

  app.postAsync('/ambitions/:ambitionId/assignments/:assignmentId?', app.locals.writerOnly, app.locals.upload.single('assignment[goal][image]'), async (req, res) => {
    if (!req.body.assignment.goal) {
      var assignment = await assignGoalToAmbition(req, req.body.assignment.goalId, req.params.ambitionId);

      return { assignment }
    }
      
    const goal = await req.locals.selectOne(
      app.locals.UPSERT('goals', [ 'tagline', 'name', 'question', 'afterword_html', 'cta', 'description', 'image', 'image_sizes', 'slugs']),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.assignment.goal,
        id: req.body.assignment.goal.id || undefined
      }))],
      'upsert-goal'
    );

    if (goal) {
      var assignment = await assignGoalToAmbition(req, goal.id, req.params.ambitionId);
    }

    // rename image attachment
    if (goal && req.file) {
      const newLocation = `goals/new/${goal.id}/image.${req.file.mimetype.split('/')[1].split('+')[0]}`;
      const sizes = await app.locals.s3uploadResponsive(req.file, newLocation);
      await req.locals.query(
        "UPDATE goals SET image = $1, image_sizes = $2 WHERE id = $3", 
        [sizes.default, sizes, goal.id]);
        goal.imageSizes = sizes
        goal.image = sizes.default
    }

    return { goal, assignment }
  });

  app.postAsync('/ambitions/:ambitionId/goals/:goalId/tasks/:taskId?', app.locals.writerOnly, app.locals.upload.single('task[promoImage]'), async (req, res) => {
    const task = await req.locals.selectOne(
      app.locals.UPSERT('tasks', [ 'name', 'visibility', 'type', 'url', 'description', 'lesson_id', 'video_id', 'goal_id', 'promo_url', 'promo_cta', 'promo_image', 'promo_image_sizes'], undefined, ['promo_image', 'promo_image_sizes']),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.task,
        id: req.params.taskId || null,
        goalId: req.params.goalId
      }))],
      'upsert-task'
    );

    // rename image attachment
    if (task && req.file) {
      const newLocation = `/tasks/${task.id}/image.${req.file.mimetype.split('/')[1].split('+')[0]}`;
      const sizes = await app.locals.s3uploadResponsive(req.file, newLocation);
      await req.locals.query(
        "UPDATE tasks SET promo_image = $1, promo_image_sizes = $2 WHERE id = $3", 
        [sizes.default, sizes, task.id]);
        task.promoImageSizes = sizes
        task.promoImage = sizes.default
    }

    return { task }
  });

  app.postAsync('/ambitions/:ambitionId/move', app.locals.writerOnly, async (req, res) => {
    return req.locals.query(
      app.locals.MOVE('ambitions', 'id', [], {'type': 'asc'}),
      [req.params.ambitionId, req.body.order],
      'move-ambition');
  });

  app.postAsync('/ambitions/:ambitionId/goals/:goalId/move', app.locals.writerOnly, async (req, res) => {
    console.log(app.locals.MOVE('goal_ambitions', ['goal_id'], ['ambition_id'], {}))
    return req.locals.query(
      app.locals.MOVE('goal_ambitions', ['goal_id'], ['ambition_id']),
      [req.params.ambitionId, req.params.goalId, req.body.order],
      'move-assignment');
  });

  app.postAsync('/ambitions/:ambitionId/goals/:goalId/tasks/:taskId/move', app.locals.writerOnly, async (req, res) => {
    return req.locals.query(
      app.locals.MOVE('tasks', 'id', ['goal_id'], {'visibility': 'asc'}),
      [req.params.goalId, req.params.taskId, req.body.order]);
  });


  app.getAsync('/ambitions', async (req, res) => {
    //console.log(findAmbitionQuery)
//    await new Promise((a) => setTimeout(a, 3000));
    const ambitions = await req.locals.selectAndCount(
      findAmbitionQuery,
      [req.query.page],
      'find-ambitions'
    );
    return { ambitions }
  });



  app.getAsync('/ambitions/:ambitionId/assignments/:assignmentId', async (req, res) => {
    const assignment = await req.locals.selectOne(
      findAssignmentQuery.replace('1 = 1', `goal_ambitions.id = $1`),
      [req.params.assignmentId],
      'find-assignment-by-id'
    );
    if (!assignment) throw new app.locals.NotFound('Assignment is not found')

    return { assignment }
  });

  app.getAsync('/ambitions/:ambitionId/goals/:goalId/tasks/:taskId', async (req, res) => {
    const task = await req.locals.selectOne(
      findTaskQuery.replace('1 = 1', `id = $1`),
      [req.params.taskId],
      'find-task-by-id'
    );
    if (!task) throw new app.locals.NotFound('Task is not found')

    return { task }
  });

  app.getAsync('/ambitions/:ambitionId', async (req, res) => {
    const ambition = await req.locals.selectOne(
      findAmbitionQuery.replace('1 = 1', `CASE WHEN regexp_match($2, '[^\\d]') is null THEN id = $2::integer ELSE slugs && Array[$2]::text[] END`),
      [1, req.params.ambitionId],
      'find-ambition-by-id'
    );
    if (!ambition) throw new app.locals.NotFound('Ambition is not found')

    return { ambition }
  });


  app.deleteAsync('/ambitions/:ambitionId', app.locals.writerOnly, async (req, res) => {
    const ambition = await req.locals.selectOne(
      "DELETE FROM ambitions WHERE id = $1 RETURNING *",
      [req.params.ambitionId],
      'delete-ambition'
    );
    return { ambition }
  });


  app.deleteAsync('/ambitions/:ambitionId/assignments/:assignmentId', app.locals.adminOnly, async (req, res) => {
    const assignment = await req.locals.selectOne(
      "DELETE FROM goal_ambitions WHERE id = $1 RETURNING *",
      [req.params.assignmentId],
      'delete-assignment'
    );
    const assignments = await req.locals.select(
      findAssignmentQuery.replace('1 = 1', 'goal_id=$1'),
      [assignment.goalId],
      'find-other-assignments'
    );
    if (assignments.length == 0) {
      await req.locals.selectOne(
        "DELETE FROM goals WHERE id = $1 RETURNING *",
        [assignment.goalId],
        'delete-goal'
      );
    }
    return { assignment }
  });

  app.deleteAsync('/ambitions/:ambitionId/goals/:goalId/tasks/:taskId', app.locals.writerOnly, async (req, res) => {
    const task = await req.locals.selectOne(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [req.params.taskId],
      'delete-task'
    );
    return { task }
  });

}