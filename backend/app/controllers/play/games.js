function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


export async function getRelatedUserIds(req) {
  if (req.query.companyId) {
    var users = await req.locals.select(
      `SELECT id FROM private.users WHERE company_id=$1 AND role != 'manager'`, 
      [req.query.companyId], 
      'find-company-user-ids'
    );
    return users.map((u) => u.id);
  } else if (req.locals.user.relatedUserIds) {
    return req.locals.user.relatedUserIds
  } else {
    return [req.locals.user.id];
  }
}

export default (app, req) => {
    
  app.getAsync('/games/', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("games", {
      attributes: ['id', 'name', 'description', 'image', 'is_enabled'],
    });
    const games = await req.locals.select(
      query, 
      [], 
      'find-games'
    );
    return { games };
  });

  app.getAsync('/games/:id/sessions', app.locals.userOnly, async (req, res) => {
    const filter = req.query.filter == 'friends' ? 'friends' : 'all';
    const query = app.locals.SELECT("game_sessions", {
      attributes: ['id', 'turn', 'seed', 'scores', 'attempt'],
      user: {
        foreign: 'user_id',
        attributes: ['id', 'name', 'avatar', 'avatar_sizes']
      },
      where: {
        1: 1
      },
      sort: {
        scores: 'desc'
      },
      limit: 10
    }).replace('FROM game_sessions', `
      FROM (
        SELECT DISTINCT ON (user_id) * from game_sessions s 
        WHERE s.game_id = $1
          AND s.difficulty=$2
          AND ($3 = -100 OR s.turn = $3)
          AND ($4 = Array[]::int[] OR user_id = ANY($4))
        ORDER BY user_id DESC, ((scores->>\'total\'))::float DESC) game_sessions
    `).replace('scores DESC', '((scores->>\'total\'))::float DESC NULLS LAST');

    return req.locals.select(
      query,
      [
        req.params.id,
        req.query.difficulty, 
        isNaN(parseInt(req.query.turn)) ? -100 : parseInt(req.query.turn),
        filter === 'friends' ? await getRelatedUserIds(req) : []
      ], 
      `find-game-sessions`
    )
  })

  async function getUserSession(req, userId) {
    // select last game session
    const session = await req.locals.selectOne(
      `SELECT id, game_id, user_id, seed, turn, scores, actions, achievements, competition, difficulty, attempt, created_at
      FROM game_sessions
      WHERE game_id = $1 AND user_id = $2 and is_finished = false
      ORDER BY turn desc, created_at desc
      LIMIT 1`,
      [req.params.gameId, userId],
      'find-game-session'
    );

    if (!session) throw new app.locals.NotFound()

    // fetch action log since beginning of a game
    const { log, timestamps, attempts } = await req.locals.selectOne(
      `SELECT array_cat_agg(actions ORDER BY turn asc) log,
              array_agg(created_at::text ORDER BY turn asc) timestamps
      FROM game_sessions
      WHERE game_id = $1 
        AND user_id = $2 
        AND id != $3 
        AND attempt = $4`,
      [session.gameId, session.userId, session.id, session.attempt],
      'find-game-actions'
    )

    session.log = log || []
    session.timestamps = (timestamps || []).concat(session.createdAt).map((t) => new Date(t));
    return session;
  }

  async function getSessionCompetition(req, session) {
    //const ids = await getRelatedUserIds(req);
    const metrics = await req.locals.select(`
      SELECT metric, json_agg(jsonb_build_object(
        'user', json_build_object(
          'id', users.id,
          'name', users.name,
          'avatar', users.avatar
        ),
        'score', score,
        'rank', rank, 
        'avg', avg,
        'max', max,
        'min', min,
        'number', number
      ))  as rankings

      FROM (
        SELECT metric,
               user_id,
               score,
               row_number() OVER (PARTITION BY metric ORDER BY score DESC) as number,
               rank()       OVER (PARTITION BY metric ORDER BY score DESC) as rank,
               avg(score)   OVER (PARTITION BY metric) as AVG,
               max(score)   OVER (PARTITION BY metric) as MAX,
               min(score)   OVER (PARTITION BY metric) as MIN

        FROM (
          -- Best personal bests
          SELECT
            scores.key as metric,
            user_id,
            max(scores.value::int) AS score
          
          FROM (
              -- List of all game sessions at that difficulty/turn
              SELECT * 
                FROM game_sessions
              WHERE game_id=$1
                AND difficulty=$2
                AND turn=$3
                AND ($6 = Array[]::int[] OR user_id = ANY($6))
            ) sessions,
            jsonb_each(scores) as scores

          WHERE user_id != $4 or attempt = $5

          GROUP BY 1, 2
        ) bests
          
      ) user_scores
    
      INNER JOIN users on (user_id = users.id)
      
      WHERE number < 4 OR user_id = $4
    
      GROUP BY metric
    `, [
      'paper-chase', session.difficulty, session.turn - 1, req.locals.user.id, session.attempt, []//ids.length >= 3 ? ids : []
    ], 'compute-rankings');

    return metrics.reduce((result, metric) => {
      return {...result, [metric.metric]: metric.rankings};
    }, {});
  }

  app.getAsync('/games/:gameId/sessions/:userId', app.locals.userOnly, async (req, res) => {
    const session = await getUserSession(req, req.params.userId)
    const competition = await getSessionCompetition(req, session)
    return { session, competition }
  }); 


  app.postAsync('/games/:gameId/sessions', app.locals.userOnly, async (req, res, next) => {
    const query = app.locals.UPSERT("game_sessions",
      ['achievements', 'difficulty', 'attempt', 'competition', 'actions', 'scores', 'user_id', 'game_id', 'turn', 'seed', 'updated_at'],
      'game_id, attempt, user_id, turn'
    );

    if (req.body.session.attempt == null) {
      var lastSession = await req.locals.selectOne(
        `SELECT max(attempt)
        FROM game_sessions 
        WHERE game_id = $1 
          AND user_id = $2`,
        [req.params.gameId, req.locals.user.id],
        'find-game-attempt'
      );
      await req.locals.selectOne(`
        UPDATE game_sessions
        SET is_finished=true
        WHERE game_id = $1
          AND user_id = $2`,
        [req.params.gameId, req.locals.user.id],
        'complete-previous-attempts'
      );
      var attempt = lastSession ? lastSession.max + 1 : 0;
    } else {
      var attempt = req.body.session.attempt;
    }

    await req.locals.selectOne(
      query,
      [
        JSON.stringify({
          ...req.body.session,
          attempt: attempt,
          id: undefined,
          updated_at: new Date,
          game_id: req.params.gameId,
          user_id: req.locals.user.id
        }),
      ],
      'upsert-game-session'
    );

    const session = await getUserSession(req, req.locals.user.id)


    if (session.turn == 32) {
      const friendships = await req.locals.select('SELECT target_id FROM friendships WHERE source_id=$1', [req.locals.user.id], 'find-friend-ids');
      await Promise.all(friendships.map((friendship) => {
        return app.locals.sendNotification(req, friendship.targetId, {
          title: 'New score on the leaderboard',
          body: `${req.locals.user.name.split(' ')[0]} just finished their game of Paper Chase and scored $${numberWithCommas(parseInt(session.scores.total))}`,
          link: '/games/paper-chase'
        })
      }))
    }

    const competition = await getSessionCompetition(req, session);

    return { session, competition }
  });


  app.getAsync('/games/:gameId', app.locals.userOnly, async (req, res) => {
    const query = app.locals.SELECT("games", {
      attributes: ['id', 'name', 'description', 'image', 'is_enabled'],
      where: {
        id: { param: 1 }
      }
    });
    const game = await req.locals.selectOne(
      query,
      [req.params.gameId],
      'find-game'
    );
    return { game };
  });

  app.deleteAsync('/games/:gameId/sessions/:userId', app.locals.selfOnly, async (req, res) => {
    return req.locals.query(`
    UPDATE game_sessions 
    SET is_finished = true
    WHERE game_id=$1 
      AND user_id=$2
      AND is_finished = false`, [req.params.gameId, req.params.userId])
  })


}