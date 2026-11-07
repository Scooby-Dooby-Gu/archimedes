import request from 'request';

export function findUsersInLimbo(req) {
  return req.locals.select(`
  SELECT * FROM private.users
  WHERE first_used_at is NULL
    AND verified_at <= now() - '1 week'::interval
    AND verified_at > '2020-07-27'
    AND users.role = 'user' AND users.email NOT LIKE '%demo%'
    AND NOT EXISTS(
      SELECT 1 
      FROM logs
      WHERE type = 'email' 
        AND category = 'Reminder'
        AND action = 'Limbo'
        AND label = '1 week'
        AND user_id = users.id)
  `)
}

export default (app) => {
  app.postAsync('/notifications/manual', app.locals.adminOnly, async(req, res) => {
    const subscribers = await req.locals.select(
      'SELECT DISTINCT user_id FROM private.devices', 
      //'SELECT id as user_id FROM private.users', 
      [], 
      'select-subscribed-user-manual'
    );

    const notifications = subscribers.map((s) => {
      return [
        s.userId, 
        {
          ...req.body.notification,
          key: 'manual'
        },
        '1 hour'
      ]
    })

    await Promise.all(notifications.map((args) => {
      return app.locals.sendNotification(req, ...args)
    }))

    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `Sent broadcast notification:\n${JSON.stringify(JSON.stringify(req.body.notification))}`
      },
      json: true,
    })
  });

  // NOT USED ANYMORE. HERE FOR FUTURE GENERATIONS
  app.getAsync('/notifications/daily', async(req, res) => {
    const subscribers = await req.locals.select(
      'SELECT DISTINCT user_id FROM private.devices', 
      //'SELECT id as user_id FROM private.users', 
      [], 
      'select-subscribed-user'
    );
    const ids = subscribers.map((s) => s.userId)
    
    const results = await req.locals.select(`
      SELECT items.user_id, (NOW()::date at time zone 'utc' - '8 hours'::interval)::date - (date at time zone 'utc')::date as index, count(NULLIF(type = 'lesson', false)) as lessons, count(NULLIF(type = 'year', false)) as years
      FROM (
        SELECT 'year' as type, game_sessions.user_id, (created_at at time zone 'utc' - '8 hours'::interval)::date as date
          FROM game_sessions
          WHERE created_at >= NOW() - '8 days'::interval
          and user_id = ANY($1)
          AND turn > 0
        UNION ALL
        SELECT 'lesson' as type, submissions.user_id, (created_at at time zone 'utc' - '8 hours'::interval)::date as date
          FROM submissions
          WHERE created_at >= NOW() - '8 days'::interval
          and user_id = ANY($1)
          AND is_complete
          and type = 'lesson'
      ) items
      GROUP BY 1, 2
      ORDER BY 1, 2`,
      [ids],
      'progress-for-ids'
    );

    const users = await req.locals.select(`
      SELECT id, name, first_used_at, related_user_ids
      FROM private.users
      WHERE id = ANY($1)`,
      [ids],
      'friends-for-ids'
    );
    const sentTrivias = await req.locals.select(`
      SELECT user_id, action, created_at
      FROM logs
      WHERE category = 'Investment trivia'
        AND user_id = ANY($1)
      ORDER BY created_at DESC
      `,
      [ids],
      'trivias-for-ids'
    )

    /*const friendsOfFriends = req.locals.select(
      `SELECT source_id, array_agg(target_id)
      FROM friendships
      WHERE source_id = ANY($1)
      GROUP BY 1`,
      [ids],
      'find-friends-ids-for-ids'
    )*/
    
    const groups = {};
    results.map((result) => {
      if (!groups[result.userId]) groups[result.userId] = {};
      groups[result.userId][result.index] = result;
    })
    
    const getDayStatus = (day) => {
      if (!day) return null;
      if (day.years >= 1 && day.lessons >= 3) {
        return true
      } else {
        return false;
      }
    }

    const getCurrentStreak = (id) => {
      const days = groups[id];
      if (!days) return;
      const streak = 0;
      for (var i = 0; i < 7; i++) {
        if (getDayStatus(days[i])) {
          streak++;
        } else if (i !== 0) {
          break;
        }
      }
      return streak;
    }

    const notifications = []
    const trivias = [
      `Social security in the US is projected to run out of money by 2035.`,
      `If you invested into SPY, an S&P500 ETF, in 2010 and did nothing, you’d have more than 3x your investment today.`,
      `You need a 100% return just  to make up for a 50% loss.`,
      `From 1929 to 1949 (20 years) and from 1968 to 2009 (41 years), $1 invested in bonds was a better investment than in stock.`,
      `From 1985 to 2008, the probability of a negative return for the S&P 500 over any 1-year period was 20%.`,
      `From 1960 to 1980, the US savings rate was between 8% and 12%. The same savings rate was below 2% in 2007.`,
      `OTM or out of the money call options are cheap to buy because of how fast Theta decay eats into the value and the difficulty selling them if the stock does not hockey stick up.`,
      
      `Compounding works for learning too! If you increase your investing knowledge 1% (like passing one lesson on Archimedes) each day you’ll be 35% smarter after a month!`,
      `If you do not start saving until 45, you will need to save three times as much as if you start at 25.`,
      `0.75% in fees equates to a 20% smaller nest egg in just 30 years`,
      `As of January 2013, 16 people born in the 1800s were still alive, according to a research group. With dividends reinvested, US stocks increased 28,000-fold during their lifetimes.`,
      `Between 1928 and 2013, a broad index of US stocks increased 2,000-fold. However, 20 times they actually lost at least 20% of their value in that period.`,
      `Parents, at least 61% of them, prefer discussing investments with their advisors than their adult children.`,
      `Stocks rose 1,100-fold over the past 70 years.`,
      `The greatest returns seem to be after the biggest losses. The best three-year period of owning stocks was during the Great Depression. The next best started in 2009.`,
      `The Dow has compounded at less than 3 basis points a day since 1970. Since then it’s up more than 3,000%. Compounding is magic.`,
      `Legendary investor Warren Buffett once said, “You don’t need to be a rocket scientist. Investing is not a game where the guy with the 160 IQ beats the guy with 130 IQ.”`,
      `When held for at least 20 years, there has never been a period in history when the S&P500 produced an average annual loss. Patience = Positive returns.`,
      `Average doesn’t happen often. The S&P500’s average annual return was about 7% from 1871 to 2019 but only 28 years had a return between 0% and 10%.`,
      `Warren Buffett, one of the world’s most successful investors, made 99.6% of his $87.5 billion fortune after the age of 52`,
      `The highest-price stock currently sold is Berkshire Hathaway, Class A (NYSE: BRK-A), which sells for more than $380,000 per share.`,

    ]

    var stats = {
      streak2: 0,
      streak3: 0,
      trivia: 0,
      squad1: 0,
      squad: 0,
    };

    ids.map((id) => {
      const days = groups[id] || {};
      // dont ping engaged users
      if (getDayStatus(days[0]) != null) return;

      const user = users.find((u) => u.id == id);
      const streakingFriends = (user.relatedIds || []).filter(getCurrentStreak);
      const previousTrivias = sentTrivias.filter((t) => t.userId == id);
      // once per 3 days max
      const readyForTrivia = previousTrivias[0] ? new Date() - previousTrivias[0].createdAt > 60 * 60 * 24 * 2.8 * 1000 : true;
      const availableTrivias = trivias.filter((text) => !previousTrivias.find((t) => t.action == text));
      const randomTrivia = availableTrivias[Math.floor(Math.random() * availableTrivias.length)];
      /*
      // Motivation: Keep the streak going
      if (getDayStatus(days[1]) && getDayStatus(days[2]) ) {
        if (getDayStatus(days[3]) ) {
          stats.streak2++;
          notifications.push([id, {
            title: '3-peat',
            body: 'You’re on fire! Play Paper Chase and knock out lessons to maintain your streak.',
            link: '/rankings',
            key: 'daily',
          }])
        } else {
          stats.streak3++;
          notifications.push([id, {
            title: 'You’re warming up!',
            body: 'Game-winning free throws and your learning goals—great things happen in twos. Login to continue your streak.',
            link: '/rankings',
            key: 'daily'
          }])
        }

      // Motivation: Get back to the app
      } else if ((new Date() - user.firstUsedAt) > 60 * 60 * 24 * 6 * 1000 && !days[0] && !days[1] && !days[2] && !days[3] && !days[4] && !days[5] && !days[6] && !days[7] && readyForTrivia && randomTrivia) {
        stats.trivia++;
        notifications.push([id, {
          title: 'Investment trivia',
          body: randomTrivia,
          link: '/rankings',
        }])
        
      // Motivation: Keep up with friends
      } else if (streakingFriends.length > 0) {
        if (streakingFriends.length == 1) {
          stats.squad1++;
          const friend = users.find((u) => u.id == streakingFriends[0]);
          notifications.push([id, {
            title: 'Your squad’s progress',
            body: `${friend.name} is on a ${getCurrentStreak(friend.id)} day learning streak.`,
            link: '/rankings',
            key: 'daily'
          }])
        } else {
          stats.squad++;
          notifications.push([id, {
            title: 'Your squad’s progress',
            body: `${streakingFriends.length} of your friends have a learning streak.`,
            link: '/rankings',
            key: 'daily'
          }])
        }
      } */
    })

    console.log(`Sending ${notifications.length} notifications`, stats);
    if (req.query.dry != null) {
      console.log(notifications)
    } else {
      await Promise.all(notifications.map((args) => {
        return app.locals.sendNotification(req, ...args)
      }))
    }


    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `Sent daily notifications:\n${JSON.stringify(stats)}`
      },
      json: true,
    })
  })

  app.postAsync('/reminders/invites', async(req, res) => {
    const invites = await req.locals.select(`
      SELECT invites.id, jsonb_build_object(
        'id', invites.id,
        'email', invites.email,
        'token', invites.token,
        'inviter', associated_inviter.jsonb
      ) AS jsonb
      FROM invites
      
      INNER JOIN (
        SELECT users.id, jsonb_build_object(
          'id', users.id,
          'name', users.name,
          'email', users.email,
          'avatar', users.avatar
        ) AS jsonb
        FROM users)
      AS associated_inviter
      ON associated_inviter.id = invites.inviter_id

      WHERE invites.accepted_at is null
      AND NOT EXISTS(
        SELECT 1 
        FROM logs
        WHERE type = 'email' 
          AND category = 'Reminder'
          AND action = 'Invite'
          AND label = '1 week'
          AND value = invites.id)
    `, 
    [],
    'find-limbo-invites');
  
    const emails = invites.map((invite) => ({
      email: invite.email,
      name: invite.email,  
      data: {
        id: invite.id,
        url: `${process.env.APP_URL}/invites/${invite.token}?campaign=Email&action=InviteReminder`,
        inviter: {
          id: invite.inviter.id,
          name: invite.inviter.name,
          firstName: invite.inviter.name.split(' ')[0]
        }
      }
    }));

    await Promise.all(emails.map((email) => {
      return req.locals.query(
        `INSERT INTO logs(type, category, action, label, value, user_id) VALUES($1, $2, $3, $4, $5, $6)`,
        ['email', 'Reminder', 'Invite', '1 week', email.data.id, email.data.inviter.id],
        'insert-logs'
      )
    }))
      
    await app.locals.sendEmailsFromTemplate('d-f269e7da030442368f21e9ff289fe0b5', emails, app.locals.emailFrom())

    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `Sent invite reminders (${emails.length})`
      },
      json: true,
    })
    return;
    
  })
  app.postAsync('/reminders/limbo', async (req, res) => {
    //const users = await findUsersInLimbo(req);

    const users = process.env.NODE_ENV != 'production' 
      ? await req.locals.select('SELECT * FROM private.users WHERE id IN (1,2, 94)')
      : await findUsersInLimbo(req);

    const emails = users.map((user) => ({
      email: user.email,
      name: user.name,  
      data: {
        url: `${process.env.APP_URL}/?campaign=Email&action=Limbo&uid=` + user.id,
        user: {
          id: user.id,
          firstName: user.name.split(' ')[0]
        }
      }
    }));

    await Promise.all(emails.map((email) => {
      return req.locals.query(
        `INSERT INTO logs(type, category, action, label, value, user_id) VALUES($1, $2, $3, $4, $5, $6)`,
        ['email', 'Reminder', 'Limbo', '1 week', null, email.data.user.id],
        'insert-logs'
      )
    }))
    
    await app.locals.sendEmailsFromTemplate('d-325d976039f5408c87f947ab9f52a997', emails, app.locals.emailFrom())

    process.env.SLACK_WEBHOOK_URL && request({
      url: process.env.SLACK_WEBHOOK_URL,
      method: 'POST',
      body: {
        text: `Sent limbo reminders (${emails.length})}`
      },
      json: true,
    })
    
  })

}