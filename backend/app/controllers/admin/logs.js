export async function getUserAnalytics(req, interval = 'week', startSignup = '2021-03-01', endSignup = '2030-01-01') {
  var start = '2020-07-27';
  var end = '2030-01-01';

  // select ambitions.name, count(user_id) FROM (select distinct on (user_id) user_id, ref from submissions where type='ambitionQuestion' order by user_id, id asc) u LEFT JOIN ambitions on u.ref::integer = ambitions.id GROUP BY 1 order by 2 desc
  const logs = await req.locals.select(
    `
      WITH 
        achievements as (
          SELECT created_at as date, user_id, count(*) OVER(partition by user_id order by created_at asc)
          FROM user_achievements
          WHERE created_at >= $2::date and created_at <= $3::date
          GROUP BY user_id, created_at
        ), 

      ambitionQuestions as (
        SELECT distinct on(user_id) user_id, name, submissions.created_at as date
        FROM submissions 
        LEFT JOIN ambitions on ref=ambitions.id::text 
        WHERE submissions.type = 'ambitionQuestion' and previous_ambition_id is null
        ORDER BY 1, submissions.created_at asc
      ),

      data as (SELECT 
        id,
        'Users signed up' as type, 
        id as user_id,
        created_at as date
      FROM private.users
      WHERE created_at >= $2::date and created_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Users signed up/Not verified' as type, 
        id as user_id,
        created_at as date
      FROM private.users
      WHERE created_at >= $2::date and created_at <= $3::date and verified_at is null

      UNION ALL

      SELECT 
        id,
        'Users signed up/Via friends' as type, 
        id as user_id,
        created_at as date
      FROM private.users
      WHERE created_at >= $2::date and created_at <= $3::date and verified_at is not null and invite_id is not null

      UNION ALL

      SELECT 
        id,
        'Users verified' as type, 
        id as user_id,
        verified_at as date
      FROM private.users
      WHERE verified_at >= $2::date and verified_at <= $3::date
      
      UNION ALL

      SELECT 
        id,
        'Users verified/First signin' as type, 
        id as user_id,
        first_used_at as date
      FROM private.users
      WHERE first_used_at >= $2::date and first_used_at <= $3::date


      UNION ALL

      SELECT 
        id,
        'Discussions/Created' as type, 
        user_id,
        created_at as date
      FROM discussions
      WHERE created_at >= $2::date and created_at <= $3::date
      
      UNION ALL

      SELECT 
        id,
        'Discussions/Replied' as type, 
        user_id,
        created_at as date
      FROM replies
      WHERE created_at >= $2::date and created_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Invites' as type, 
        inviter_id,
        created_at as date
      FROM invites
      WHERE created_at >= $2::date and created_at <= $3::date and email is not null

      UNION ALL 

      SELECT 
        id,
        'Invites/Accepted' as type, 
        inviter_id,
        accepted_at as date
      FROM invites
      WHERE accepted_at >= $2::date and accepted_at <= $3::date and email is not null

      UNION ALL 

      SELECT 
        id,
        'Invites/Unaccepted' as type, 
        inviter_id,
        created_at as date
      FROM invites
      WHERE created_at >= $2::date and created_at <= $3::date and accepted_at is null and email is not null

      UNION ALL

      SELECT 
        id,
        'Lessons attempted' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type = 'lesson' and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Lessons attempted/Passed' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type = 'lesson' and is_complete and updated_at >= $2::date and updated_at <= $3::date
      
      UNION ALL

      SELECT 
        id,
        'Lessons attempted/Abandoned' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type = 'lesson' and is_complete = false and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Questions answered' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE (type = 'question' or type= 'ambitionQuestion') and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Questions answered/Goals' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type = 'question'  and updated_at >= $2::date and updated_at <= $3::date
      
      UNION ALL

      SELECT 
        id,
        'Questions answered/Ambitions' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type='ambitionQuestion' and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        submissions.id,
        'Questions answered/Contingent ambitions' as type, 
        submissions.user_id,
        submissions.updated_at as date
      FROM submissions
      LEFT JOIN ambitions ON ambitions.id = ambition_id
      WHERE submissions.type='ambitionQuestion' and submissions.updated_at >= $2::date and submissions.updated_at <= $3::date
        AND ambitions.previous_ambition_id is not null
        UNION ALL
  
      SELECT 
        submissions.id,
        'Questions answered/2nd ambition' as type, 
        submissions.user_id,
        submissions.updated_at as date
      FROM submissions
      WHERE submissions.type='ambitionQuestion' and submissions.updated_at >= $2::date and submissions.updated_at <= $3::date
        AND EXISTS (SELECT 1
        FROM submissions o
        WHERE o.type = 'ambition'
        AND o.ambition_id != submissions.ambition_id
        AND o.user_id = submissions.user_id)

      UNION ALL

      SELECT 
        id,
        'Things completed' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE (type='goal' or type = 'ambition' or (type = 'lesson' and is_complete)) and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Things completed/Goals' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type='goal' and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Things completed/Goals (2+)' as type, 
        user_id,
        updated_at as date
      FROM submissions

      WHERE type='goal' and updated_at >= $2::date and updated_at <= $3::date
      AND EXISTS (SELECT 1
        FROM submissions o
        WHERE o.type = 'goal'
        AND o.goal_id != submissions.goal_id
        AND o.user_id = submissions.user_id)

      UNION ALL

      SELECT 
        id,
        'Things completed/Lessons' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type='lesson' and is_complete=true AND updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Things completed/Intro videos' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type='youtube' and is_complete=true AND updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Things completed/Lessons in goal' as type, 
        user_id,
        updated_at as date
      FROM submissions s
      WHERE type='lesson' and is_complete=true AND updated_at >= $2::date and updated_at <= $3::date
      AND EXISTS(
        SELECT 1
        FROM submissions
        WHERE user_id = s.user_id 
        AND type IN ('ambitionQuestion')
        LIMIT 1
      )
      UNION ALL

      SELECT 
        id,
        'Things completed/Lessons in goal (2+)' as type, 
        user_id,
        updated_at as date
      FROM submissions s
      WHERE type='lesson' and is_complete=true AND updated_at >= $2::date and updated_at <= $3::date
      AND EXISTS(
        SELECT 1
        FROM submissions
        WHERE user_id = s.user_id 
        AND type IN ('ambitionQuestion')
        LIMIT 1
      )
      AND EXISTS (SELECT 1
        FROM submissions o
        WHERE o.type = 'lesson'
        AND is_complete
        AND o.lesson_id != s.lesson_id
        AND o.user_id = s.user_id)


      UNION ALL

      SELECT 
        id,
        'Things completed/Ambitions' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type='ambition' and updated_at >= $2::date and updated_at <= $3::date

      UNION ALL

      SELECT 
        id,
        'Things completed/Ambitions (2+)' as type, 
        user_id,
        updated_at as date
      FROM submissions
      WHERE type='ambition' and updated_at >= $2::date and updated_at <= $3::date
      AND EXISTS (SELECT 1
        FROM submissions o
        WHERE o.type = 'ambition'
        AND o.ambition_id != submissions.ambition_id
        AND o.user_id = submissions.user_id)

      UNION ALL

      SELECT 
        submissions.id,
        'Things completed/Ambitions (contingent)' as type, 
        submissions.user_id,
        submissions.updated_at as date
      FROM submissions
      LEFT JOIN ambitions ON ambitions.id = ambition_id
      WHERE submissions.type='ambition' and submissions.updated_at >= $2::date and submissions.updated_at <= $3::date
        AND ambitions.previous_ambition_id is not null
  
      UNION ALL


      SELECT
        user_id,
        'Users signed up/Reached' as type,
        user_id,
        verified_at as date
        FROM logs
        LEFT JOIN private.users on users.id = user_id
        WHERE type = 'email' 
          AND category = 'Reminder'
          AND action = 'Limbo'
          AND label = '1 week'
      UNION ALL

      SELECT
        logs.id,
        'Logins' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Login'
          
      UNION ALL

      SELECT
        logs.id,
        'Logins/Android' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Login'
          AND action = 'android'

      UNION ALL

      SELECT
        logs.id,
        'Logins/iOS' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Login'
          AND action = 'ios'

      UNION ALL

      SELECT
        logs.id,
        'Logins/Desktop' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Login'
          AND action = 'desktop'

      UNION ALL

      SELECT
        logs.id,
        'Logins/Mobile' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Login'
          AND action = 'mobile'

      UNION ALL

      SELECT
        user_id,
        'Users signed up/Recovered' as type,
        user_id,
        verified_at as date
        FROM logs
        LEFT JOIN private.users on users.id = user_id
        WHERE type = 'email' 
          AND category = 'Reminder'
          AND (action = 'Limbo' OR action='Invite')
          AND label = '1 week'
          AND users.first_used_at is not null

      UNION ALL

      SELECT
        id,
        'Game turns' as type,
        user_id,
        created_at as date
      FROM game_sessions
      WHERE created_at >= $2::date and created_at <= $3::date

          
      UNION ALL
      
      SELECT DISTINCT
        id,
        'Push subscriptions' as type,
        user_id,
        created_at as date
      FROM private.devices
      
      UNION ALL
      
      SELECT
        id,
        'Push subscriptions/Notifications sent' as type,
        user_id,
        created_at as date
      FROM logs
        WHERE type = 'notification'
    
      UNION ALL
      
      SELECT
        id,
        'Public lesson visits' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Lesson/Share'

      UNION ALL
      
      SELECT
        id,
        'Public lesson visits/Shared' as type,
        user_id,
        created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Lesson/Visit'

      UNION ALL
      
      SELECT
        id,
        'Emails sent' as type,
        user_id,
        created_at as date
      FROM logs
      WHERE type = 'email' 
        --AND category = 'Reminder'
        --AND action = 'Limbo'
        --AND label = '1 week'

      UNION ALL
      
        SELECT
          id,
          'Emails clicked' as type,
          user_id,
          created_at as date
        FROM logs
        WHERE type = 'event' 
          AND category = 'Email'
      )
      SELECT type, 
            date_trunc($1, date)::date as date, 
            count(1) as count, 
            array_agg(DISTINCT user_id) as unique

      FROM (
        SELECT * 
          FROM data
              
          UNION ALL

          SELECT
            id,
            'Game turns/ 1' as type,
            user_id,
            created_at as date
          FROM game_sessions
          WHERE turn = 0 and created_at >= $2::date and created_at <= $3::date
          UNION ALL

          SELECT
            id,
            'Game turns/ 2+' as type,
            user_id,
            created_at as date
          FROM game_sessions
          WHERE turn >= 2 and created_at >= $2::date and created_at <= $3::date

          UNION ALL

          SELECT
            id,
            'Game turns/ 5+' as type,
            user_id,
            created_at as date
          FROM game_sessions
          WHERE turn >= 5 and created_at >= $2::date and created_at <= $3::date
          UNION ALL

          SELECT
            id,
            'Game turns/10+' as type,
            user_id,
            created_at as date
          FROM game_sessions
          WHERE turn >= 10 and created_at >= $2::date and created_at <= $3::date
          
          UNION ALL
          SELECT
            id,
            'Game turns/20+' as type,
            user_id,
            created_at as date
          FROM game_sessions
          WHERE turn >= 20 and created_at >= $2::date and created_at <= $3::date
          UNION ALL

          SELECT
            id,
            'Game turns/30+' as type,
            user_id,
            created_at as date
          FROM game_sessions
          WHERE turn >= 30 and created_at >= $2::date and created_at <= $3::date

          UNION ALL

          SELECT 
            id,
            'Page views' as type, 
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'pageview' and created_at >= $2::date and created_at <= $3::date

          UNION ALL

          SELECT 
            id,
            'Page views (users)' as type, 
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'pageview' and created_at >= $2::date and created_at <= $3::date and user_id is not null
          UNION ALL

          SELECT 
            id,
            'Page views (guest)' as type, 
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'pageview' and created_at >= $2::date and created_at <= $3::date and user_id is null

          UNION ALL

          SELECT user_id, 'Achievements' as type, user_id, date
            FROM achievements
          
          UNION ALL
              
          SELECT user_id, 'Achievements/ 3+' as type, user_id, date
          FROM achievements
          WHERE count >= 3

          UNION ALL
              
          SELECT user_id, 'Achievements/ 5+' as type, user_id, date
          FROM achievements
          WHERE count >= 5

          UNION ALL
              
          SELECT user_id, 'Achievements/10+' as type, user_id, date
          FROM achievements
          WHERE count >= 10
          
          UNION ALL

          SELECT user_id, 'Initial ambitions' as type, user_id, date FROM ambitionQuestions

          UNION ALL

          SELECT user_id, 'Initial ambitions/' || name as type, user_id, date FROM ambitionQuestions

          UNION ALL
          
          SELECT id, 'Users verified/Active' as type, user_id, date
            FROM data
            WHERE type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
          
          UNION ALL
          
          SELECT user_id, 'Users verified/First active' as type, user_id, min(date)
            FROM data
            WHERE type IN ('Game turns', 'Things completed/Intro videos', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
            GROUP BY user_id
          
          UNION ALL
        
          SELECT * FROM (
            SELECT data.user_id as id, 'Users verified/Retained (3d)' as type, data.user_id, min(date) as date
              FROM data
              WHERE type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
              GROUP BY user_id
          ) q WHERE EXISTS(
            SELECT 1 
            FROM data d
            WHERE d.type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
              AND d.user_id = q.user_id
              AND d.date > q.date + '3 days'::interval
          )

          UNION ALL
        
          SELECT * FROM (
            SELECT data.user_id as id, 'Users verified/Retained (1wk)' as type, data.user_id, min(date) as date
              FROM data
              WHERE type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
              GROUP BY user_id
          ) q WHERE EXISTS(
            SELECT 1 
            FROM data d
            WHERE d.type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
              AND d.user_id = q.user_id
              AND d.date > q.date + '1 week'::interval
          )

          UNION ALL
          
          SELECT id, 'Discussions' as type, user_id, date
          FROM data
          WHERE type IN ('Discussions/Created', 'Discussions/Replied')

          UNION ALL

          SELECT d1.id, 'Users signed up/In limbo (1wk+)' as type, d1.user_id, d1.date
          FROM data d1
          LEFT JOIN private.users on d1.user_id = users.id
          WHERE d1.type = 'Users verified' AND first_used_at is null
          AND d1.date <= now() - '1 week'::interval

          UNION ALL

          SELECT d1.id, 'Users signed up/Unreached' as type, d1.user_id, d1.date
          FROM data d1
          LEFT JOIN private.users on d1.user_id = users.id
          WHERE d1.type = 'Users verified' AND first_used_at is null
          AND d1.date <= now() - '1 week'::interval
          AND NOT EXISTS(SELECT 1 FROM logs 
            WHERE type = 'email' 
              AND category = 'Reminder'
              AND action = 'Limbo'
              AND label = '1 week'
              AND user_id = users.id)


          UNION ALL

          SELECT d1.id, 'Users verified/First signin (1wk+)' as type, d1.user_id, u.first_used_at
          FROM data d1
          LEFT JOIN private.users u on d1.user_id = u.id
          WHERE d1.type = 'Users verified'
          AND d1.date + '1 week'::interval <= u.first_used_at

          UNION ALL 
          
          SELECT d1.id, 'Users verified/Never active (1wk+)' as type, d1.user_id, d1.date
          FROM data d1
          LEFT JOIN private.users on d1.user_id = users.id
          WHERE first_used_at is NOT null
          AND d1.type = 'Users verified'
          AND d1.date <= now() - '1 week'::interval
          AND NOT EXISTS(SELECT 1 FROM data d2 WHERE d2.user_id = d1.user_id
          AND type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied'))

          UNION ALL

          SELECT id,
            'External sources' as type,
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'event' and created_at >= $2::date and created_at <= $3::date
            AND category = 'Source'

          UNION ALL

          SELECT id,
            'External sources/' || coalesce(action, '?') || '/' || coalesce(label, '?') as type,
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'event' and created_at >= $2::date and created_at <= $3::date
            AND category = 'Source'

          UNION ALL

          SELECT id,
            'External targets' as type,
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'event' and created_at >= $2::date and created_at <= $3::date
            AND category = 'Outgoing'

          UNION ALL

          SELECT id,
            'External targets/' || coalesce(action, '?') || coalesce(label, '?') as type,
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'event' and created_at >= $2::date and created_at <= $3::date
            AND category = 'Outgoing'
            
          UNION ALL

          SELECT id,
            'External targets/App Store/' || coalesce(action, '?') as type,
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'event' and created_at >= $2::date and created_at <= $3::date
            AND category = 'Download'
            
          UNION ALL

          SELECT 
            id,
            'Events' as type, 
            user_id,
            created_at as date
          FROM logs
          WHERE type = 'event' and created_at >= $2::date and created_at <= $3::date
          
          UNION ALL

          SELECT 
            items.user_id as id, 
            'Daily goal' as type, 
            items.user_id,
            date
          FROM (
            SELECT 'year' as type, game_sessions.user_id, (created_at at time zone 'utc' - '8 hours'::interval)::date as date
              FROM game_sessions
              WHERE turn > 0
            UNION ALL
            SELECT 'lesson' as type, submissions.user_id, (created_at at time zone 'utc' - '8 hours'::interval)::date as date
              FROM submissions
              WHERE type = 'lesson' and is_complete
          ) items
          GROUP BY 1, 4
          HAVING count(NULLIF(type = 'lesson', false)) >= 3
             AND count(NULLIF(type = 'year', false)) >= 1
          
          UNION ALL

          SELECT 
            items.user_id as id, 
            'Daily goal/Lessons (3+)' as type, 
            items.user_id,
            date
          FROM (
            SELECT 'lesson' as type, submissions.user_id, (created_at at time zone 'utc' - '8 hours'::interval)::date as date
              FROM submissions
              WHERE type = 'lesson' and is_complete
          ) items
          GROUP BY 1, 4
          HAVING count(NULLIF(type = 'lesson', false)) >= 3
          
          UNION ALL


          SELECT 
            items.user_id as id, 
            'Daily goal/Game (1turn+)' as type, 
            items.user_id,
            date
          FROM (
            SELECT 'year' as type, game_sessions.user_id, (created_at at time zone 'utc' - '8 hours'::interval)::date as date
              FROM game_sessions
              WHERE turn > 0
          ) items
          GROUP BY 1, 4
          HAVING count(NULLIF(type = 'year', false)) >= 1
        
          UNION ALL

          SELECT id, 
            'Retention/' || date_trunc($1, first_used_at) as type, 
            id as user_id, 
            date_trunc($1, week) as date
          FROM private.users, generate_series(
            date_trunc($1, $2::date), 
            date_trunc($1, $3::date), 
            ('1 ' || $1)::interval
          ) as week
          WHERE first_used_at is not null
          AND EXISTS(
            SELECT 1
            FROM data
            WHERE user_id = users.id 
            AND type IN ('Game turns', 'Lessons attempted', 'Discussions/Created', 'Discussions/Replied')
            AND date_trunc($1, date) = week
            LIMIT 1
          )
      ) dataset
      LEFT JOIN private.users on user_id = users.id
      
      WHERE (users.id is NULL 
        OR (users.role = 'user'
        AND users.verified_at >= $4::date AND users.verified_at < $5::date))
        AND date >= $4::date 
      GROUP BY GROUPING SETS ((1, 2), (1))
    `,
    [
      interval,
      start, end,
      startSignup, endSignup,
    ],
    'compute-user-analytics'
  );

  const sessions = await req.locals.select(
    `WITH user_logs as (

      SELECT user_id,
        created_at,
        SUM(is_new_session) OVER (ORDER BY user_id, created_at) AS global_session_id,
        SUM(is_new_session) OVER (PARTITION BY user_id ORDER BY created_at) AS user_session_id
        FROM (
        SELECT *, CASE WHEN created_at - last_event >= interval::interval OR last_event IS NULL 
          THEN 1 
          ELSE 0 
        END AS is_new_session
        FROM (
          SELECT user_id,
            logs.created_at,
            LAG(CASE WHEN (category ~ '/lessons/' or category ~ '/videos/.') 
              THEN '25 minutes'
              ELSE '5 minutes'
            END, 1) OVER (PARTITION BY user_id ORDER BY logs.created_at) AS interval,
            LAG(logs.created_at,1) OVER (PARTITION BY user_id ORDER BY logs.created_at) AS last_event
          FROM logs
          LEFT JOIN private.users ON users.id = user_id
          WHERE verified_at < logs.created_at
          AND type in ('pageview')
          AND users.role = 'user' and users.email NOT LIKE '%demo%'
          AND users.verified_at >= $2::date AND users.verified_at < $3::date
        ) last
        ORDER BY user_id, created_at
      ) final),
        
    user_sessions AS (
      SELECT global_session_id,
            user_id, 
            DATE_TRUNC($1, min(created_at))::date as date,
            count(*) as pageviews,
            max(created_at),
            min(created_at),
            (MAX(created_at) - MIN(created_at)) AS length,
            ntile(4)  over (order by MAX(created_at) - MIN(created_at)) as quartile
      FROM user_logs session
      GROUP BY 1, 2
      HAVING MAX(created_at) - MIN(created_at) > '30 seconds'::interval
      ORDER BY 1, 2, 3),

    
    global_session_stats AS (
      SELECT quartile,
            date,
            extract('epoch' from MIN(length)) * (CASE WHEN date is null OR date < '2021-12-01' or date > '2021-12-31' THEN 1 ELSE 2 END) as min,
            extract('epoch' from AVG(length)) * (CASE WHEN date is null OR date < '2021-12-01' or date > '2021-12-31' THEN 1 ELSE 2 END) AS count,
            extract('epoch' from MAX(length)) * (CASE WHEN date is null OR date < '2021-12-01' or date > '2021-12-31' THEN 1 ELSE 2 END) as max,
            array_agg(DISTINCT user_id) as unique,
            AVG(pageviews)::integer AS avg_pageviews
      FROM user_sessions agg
      WHERE length != '0 seconds'::interval
      GROUP BY GROUPING SETS((1), (1, 2), (), (2))
      ORDER BY 1
    )
    
    SELECT * FROM global_session_stats`,
    [
      interval,
      startSignup, endSignup,
    ],
    'compute-session-analytics'
  )

  return logs.concat(sessions.map(({quartile, date, unique, min, max, count}) => {
    return {date, unique, min, max, count, type: quartile ? 'Session duration/' + (quartile - 1) * 25 + '%': 'Session duration'}
  }).concat(sessions.map(({avgPageviews, date, quartile, unique}) => {
    return {
      count: avgPageviews,
      date,
      quartile,
      unique,
      type: quartile ? 'Session page views/' + (quartile - 1) * 25 + '%': 'Session page views'
    }
  })));
}

export default (app) => {


  app.postAsync('/logs', async (req, res) => {
    return await req.locals.query(
      `INSERT INTO logs(type, category, action, label, value, user_id) VALUES($1, $2, $3, $4, $5, $6)`,
      // Events are attributed to the signed-in user only (the body's uid used
      // to be trusted, so anyone could log events as anyone).
      [req.body.type, req.body.category, req.body.action, req.body.label, req.body.value].map((v) => v == null ? null : String(v).slice(0, 255))
        .concat(req.locals.user ? req.locals.user.id : null),
      'insert-logs'
    )
  })

  app.getAsync('/logs', app.locals.adminOnly, async (req, res) => {
    const logs = await getUserAnalytics(req, req.query.interval, req.query.start || undefined, req.query.end || undefined)    

    return { logs };
  })

  app.getAsync('/trends', app.locals.adminOnly, async (req, res) => {
    const query = `
      WITH questions as (
        SELECT name as context, 'ambitionQuestion' as type, id::text as ref, question ->'title' as question, question->'options' as options
        FROM ambitions
        UNION ALL
        SELECT name as context, 'question' as type, id::text, question->'title' as question, question->'options' as options
        FROM goals
      ), stats as (
        SELECT type::text, ref::text, data as answer, count(*), array_agg(user_id) as users
        FROM submissions
        WHERE data::text != '"on"' --filter 14 old submissions
        -- submissions.created_at >= $4::date AND submissions.created_at < $5::date
        GROUP BY 1, 2, 3
      ), answers as (
        SELECT * from stats
        INNER JOIN questions
        on questions.type = stats.type 
          AND questions.ref = stats.ref
          AND options  @> stats.answer
      )
      SELECT * FROM answers;
    `
    const trends = await req.locals.select(query);

    return { trends };
  })

}
