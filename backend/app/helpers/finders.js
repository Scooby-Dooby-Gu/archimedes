
export function findUserQuery(req, extras) {
  return req.locals.app.locals.SELECT("users", {
    schema: 'private',
    attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes', 'companyId', 'facebookId', 'googleId',  'role', 'bornAt', 'phoneNumber', 'createdAt', 'updatedAt', 'settings', 'external', 'verificationToken', 'verifiedAt', 'firstUsedAt', 'apiKey', 'relatedUserIds', 'friendIds'],

    company: {
      schema: 'public',
      attributes: ['id', 'name', 'image', 'image_sizes', 'topicId'],
      table: 'companies',
      foreign: 'company_id'
    },

    ...extras
  })
}

export async function findUserByApiKey(req, apiKey) {
  return req.locals.selectOne(
    findUserQuery(req, {
      where: {
        api_key: { param: 1 }
      }
    }), 
    [apiKey],
    'find-user-by-api-key'
  );
}

function findCompanyQuery(req, extras) {
  return req.locals.app.locals.SELECT("companies", {
    attributes: ['id', 'wildcards',  'status', 'name', 'image', 'imageSizes', 'topicId', 'subdomain', 'description', 'url', 'plan401k', 'user_count', 'manager_ids'],
    ...extras
  });
}

export async function findLessonById(req, id) {
  const query = req.locals.app.locals.SELECT("lessons", {
    attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'content_html', 'difficulty', 'duration', 'questions', 'previous_lesson_id', 'course_id', 'published_at', 'slugs'],

    course: {
      required: true,
      attributes: ['id', 'name', 'description', 'icon', 'cover', 'color'],
      foreign: 'course_id'
    },

    author: {
      attributes: ['id', 'name', 'bio_html', 'email', 'avatar', 'avatarSizes', 'role', 'companyId' ],
      foreign: 'author_id',
      table: 'users'
    },

    where: {
      1: 1
    }
  });
  const lesson = await req.locals.selectOne(
    query.replace('1 = 1', `CASE WHEN regexp_match($1, '[^\\d]') is null THEN lessons.id = $1::integer ELSE slugs && Array[$1]::text[] END`),
    [
      id
    ],
    'find-shared-lesson'
  );
  if (!lesson) throw Error('Lesson not found');
  
  return lesson;
}

export async function findCompanyById(req, id) {
  return req.locals.selectOne(
    findCompanyQuery(req, {
      where: {
        id: { param: 1 }
      }
    }),
    [id],
    'find-company-by-id'
  );
}



export async function findCompany(req, res, next) {
  if (req.params.companyId) {
    try {
      req.locals.company = await findCompanyById(req, req.params.companyId)
    } catch(e) {
      return next(e)
    }
    if (!req.locals.company) {
      return next(new req.locals.app.locals.NotFound('Company not found'))
    }
  }
  next();
}

export async function possiblyUnverifiedUserOnly (req, res, next) {
  if (!req.locals.user) {
    next(new req.locals.app.locals.Unauthorized)
  } else {
    next();
  }
}

export async function userOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else {
    next();
  }
}

export async function managerOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else if (req.locals.user.role !== 'admin' && (!req.locals.company || !req.locals.company.managerIds.includes(req.locals.user.id))) {
    // Without a company in the URL this creates one, which only admins may do.
    next(new req.locals.app.locals.UnauthorizedManager)
  } else {
    next();
  }
}
export async function memberOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else if (req.locals.user.role !== 'admin' 
        && req.locals.user.companyId != req.params.companyId 
        && !req.locals.company.managerIds.includes(req.locals.user.id)) {
    next(new req.locals.app.locals.UnauthorizedMember)
  } else {
    next();
  }
}

export async function adminOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else if (req.locals.user.role !== 'admin') {
    next(new req.locals.app.locals.UnauthorizedAdmin)
  } else {
    next();
  }
}

export async function selfOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else if (req.locals.user.role !== 'admin' && req.params.userId != req.locals.user.id) {
    next(new req.locals.app.locals.UnauthorizedAdmin)
  } else {
    next();
  }
}

// Roles that may edit learning content (courses, lessons, videos, ambitions).
export function isWriter(user) {
  return !!user && ['writer', 'moderator', 'admin'].includes(user.role);
}
// Roles that may moderate the forum (edit or delete anyone's posts, manage topics).
export function isModerator(user) {
  return !!user && ['moderator', 'admin'].includes(user.role);
}
// True when the signed-in user is the given user, or an admin.
export function isSelfOrAdmin(req, userId) {
  const user = req.locals.user;
  return !!user && (user.role === 'admin' || String(user.id) === String(userId));
}

export async function moderatorOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else if (!isModerator(req.locals.user)) {
    next(new req.locals.app.locals.UnauthorizedAdmin)
  } else {
    next();
  }
}

export async function writerOnly (req, res, next) {
  if (!req.locals.user || !req.locals.user.verifiedAt) {
    next(new req.locals.app.locals.Unauthorized)
  } else if (!isWriter(req.locals.user)) {
    next(new req.locals.app.locals.UnauthorizedWriter)
  } else {
    next();
  }
}
// Scheduled jobs (daily notifications, reminder emails): allowed for admins,
// or for a scheduler that sends "Authorization: Bearer <CRON_SECRET>".
// Vercel Cron sends that header automatically when CRON_SECRET is set.
export async function cronOrAdmin (req, res, next) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.authorization || '';
  if (secret && secret.length >= 16 && header === `Bearer ${secret}`) {
    return next();
  }
  return adminOnly(req, res, next);
}
