import { findLessonById } from '../../helpers/finders.js';

function enrichDefinitionMicrodata(html = '') {
  if (html.isPlaceholder) return html;
  return html.replace(/<figure ([^>]*type="definition"[^>]*)>(.*?)<\/figure>/gi, (m, attr, body) => {
    const content = body.replace(/<figcaption/gi, (m) => {
      return m + ' itemprop="name"'
    }).replace(/<div ([^>]*card-content[^>]*)>(.*?)<\/div>[\s]*$/, (m, attr, body) => {
      return `<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
        <div ${attr} itemprop="text">${body}</div>
      </div>`
    });
    return `<figure ${attr} itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      ${content}
    </figure>`
  })
}


export default (app, req) => {

  app.postAsync('/courses/:courseId/lessons/:lessonId?', app.locals.userOnly, app.locals.upload.single('lesson[image]'), async (req, res) => {
    const image = req.file
    const lesson = await req.locals.selectOne(
      app.locals.UPSERT('lessons', ['course_id', 'previous_lesson_id', 'name', 'description', 'image', 'image_sizes', 'duration', 'difficulty', 'content_html', 'glossary_terms','questions', 'author_id', 'slugs', 'published_at'], undefined, ['image', 'image_sizes']),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.lesson,
        previousLessonId: req.body.lesson.previousLessonId || null,
        trackId: req.body.lesson.trackId || null,
        id: req.params.lessonId || null,
        course_id: req.body.lesson.courseId || req.params.courseId,
        author_id: req.body.lesson.authorId || null,
        publishedAt: req.body.lesson.publishedAt || null,
        slugs: req.body.lesson.slugs ? req.body.lesson.slugs.split(/\s*[,;]\s*/).filter(Boolean) : [],
        questions: req.body.lesson.questions || null
      }))],
      'upsert-lesson'
    );

    // rename image attachment
    if (lesson && req.file) {
      const newLocation = `lessons/new/${lesson.id}/image.${req.file.mimetype.split('/')[1].split('+')[0]}`;
      const sizes = await app.locals.s3uploadResponsive(req.file, newLocation);
      await req.locals.query(
        "UPDATE lessons SET image = $1, image_sizes = $2 WHERE id = $3", 
        [sizes.default, sizes, lesson.id]);
      lesson.imageSizes = sizes
      lesson.image = sizes.default
    }
    
    return { lesson };
  })


  app.deleteAsync('/courses/:courseId/lessons/:lessonId', app.locals.userOnly, async (req, res) => {
    const query = "DELETE FROM lessons WHERE id = $1 RETURNING *";
    const lesson = await req.locals.selectOne(
      query,
      [req.params.lessonId],
      'delete-lesson'
    );
    return { topic: lesson }
  });

  app.postAsync('/courses/:courseId/lessons/:lessonId/move', app.locals.userOnly, async (req, res) => {
    return req.locals.query(
      app.locals.MOVE('lessons', 'id', ['course_id']),
      [req.params.courseId, req.params.lessonId, req.body.order],
      'move-course-lesson'
    );
  });

  app.getAsync('/courses/:courseId/lessons/:lessonId', app.locals.userOnly, async (req, res) => {
    
    const query = app.locals.SELECT("lessons", {
      attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'content_html', 'difficulty',  'duration', 'questions', 'previous_lesson_id', 'course_id', 'slugs', 'author_id', 'published_at'],

      course: {
        required: true,
        attributes: ['id', 'name', 'description', 'icon', 'cover', 'color'],
        foreign: 'course_id'
      },

      author: {
        attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes', 'role', 'companyId' ],
        foreign: 'author_id',
        table: 'users'
      },

      where: {
        'id': { param: 1 }
      }
    });
    const lesson = await req.locals.selectOne(
      query,
      [
        req.params.lessonId
      ],
      'find-lesson-in-course'
    );
    if (!lesson) throw Error('Lesson not found');

    return { lesson }
  })


  app.getAsync('/lessons/:lessonId/discussion', /*app.locals.userOnly, */async (req, res) => {

    var query = app.locals.SELECT("discussions", {
      attributes: ['id', 'name', 'description', 'image', 'topic_id', 'image_sizes', 'created_at', 'reply_count', 'closed_at', 'pinned_at'],

      replies: {
        attributes: ['body', 'created_at', 'score'],

        user: {
          foreign: 'user_id',
          attributes: ['id', 'name', 'avatar', 'avatarSizes']
        },

        sort: {
          score: 'desc'
        },
        limit: 1
      },

      where: {
        lesson_id: { param: 1 }
      }
    })
    const discussion = await req.locals.selectOne(
      query,
      [req.params.lessonId],
      'find-lesson-discussion'
    );


    return { discussion }
  })

  app.postAsync('/lessons/images', app.locals.writerOnly, app.locals.upload.single('upload'), async (req, res) => {
    const sha1 = await app.locals.sha1FromFile(req.file.path);
    const key = `lessons/embeds/${sha1}.${req.file.mimetype.split('/')[1].split('+')[0]}`;
    const sizes = await app.locals.s3uploadResponsive(req.file, key);
    return {
      uploaded: true,
      urls: sizes
    }
  })

  app.getAsync('/embeds', async (req, res) => {
    return fetchEmbed(req, req.query.url);
  })

  app.putAsync('/embeds', async (req, res) => {
    return fetchEmbed(req, req.query.url, true, req.body.embed)
  });

  async function fetchEmbed (req, url, refresh, overrides) {
    const query = "SELECT * FROM embeds WHERE url=$1";
    var embed = await req.locals.selectOne(query, [url], 'find-embed-by-url');
    var error;
    if (!embed || refresh) {
      try {
        var data = await app.locals.extractOpenGraphFromUrl(url);
      } catch(e) {
        error = 'Failed fetching url';
      }
      const result = {url, ...data, ...overrides};
      var upsertQuery = app.locals.UPSERT('embeds', ['title', 'type', 'image', 'description', 'url', 'response', 'image_sizes'], 'url', ['image', 'image_sizes']);
      var embed = await req.locals.selectOne(upsertQuery, [JSON.stringify(result)], 'upsert-embed-by-url');
        
      if (result.image && (overrides && overrides.image || !embed.imageSizes || refresh)) {
        const path = '/tmp/img-' + embed.id;
        try {
          const ext = await app.locals.fetchToFile(path, result.image) || 'png';
          const key = `embeds/${embed.id}.${ext}`;
          const sizes = await app.locals.s3uploadResponsive({path: path, mimetype: 'image/' + ext}, key);
          embed.image = sizes.default;
          embed.imageSizes = sizes;
          embed = await req.locals.selectOne(upsertQuery, [JSON.stringify(app.locals.underscoreObject(embed))], 'upsert-embed-by-url');
        } catch(e) {
          upsertQuery = app.locals.UPSERT('embeds', ['title', 'type', 'image', 'description', 'url', 'response', 'image_sizes'], 'url');;
          embed.image = null;
          embed.imageSizes = null;
          error = 'Failed processing image';
          embed = await req.locals.selectOne(upsertQuery, [JSON.stringify(app.locals.underscoreObject(embed))], 'upsert-embed-and-image-by-url');
        }
      }
    }

    if (error) {
      return {...embed, error}
    }
    return embed;
  }
}