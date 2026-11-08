export default (app, req) => {
  const findVideoQuery = app.locals.SELECT('videos', {
    attributes: ['id', 'scheduled_at', 'published_at', 'name', 'content_html', 'footer_html', 'summary_html', 'slugs', 'expert_ids', 'image', 'image_sizes'],
    
    experts: {
      attributes: ['id', 'name', 'email', 'avatar', 'avatarSizes', 'role', 'companyId', 'bio_html' ],
      foreign: 'expert_ids',
      table: 'users'
    },

    questions: {
      attributes: ['id', 'content', 'seconds', 'slugs', 'transcription_html', 'video_id', 'is_important'],
    },

    where: {
      1: 1
    },

    sort: {
      published_at: 'desc nulls first',
      scheduled_at: 'desc'
    },

    page: {
      param: 1
    },
    limit: '$2'
  })

  app.postAsync('/videos/:videoId?', app.locals.writerOnly, app.locals.upload.single('video[image]'), async (req, res) => {
    const video = await req.locals.selectOne(
      app.locals.UPSERT('videos', ['expert_ids', 'scheduled_at', 'published_at', 'name', 'content_html', 'summary_html', 'footer_html', 'slugs', 'image', 'image_sizes'], undefined, ['image', 'image_sizes']),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.video,
        id: req.params.videoId || null,
        scheduledAt: req.body.video.scheduledAt || null,
        publishedAt: req.body.video.publishedAt || null,
        slugs: req.body.video.slugs ? req.body.video.slugs.split(/\s*[,;]\s*/).filter(Boolean) : [],
        expertIds: req.body.video.expertIds || [],
      }))],
      'upsert-video'
    );

      // rename image attachment
      if (video && req.file) {
        const newLocation = `videos/new/${video.id}/image.${req.file.mimetype.split('/')[1].split('+')[0]}`;
        const sizes = await app.locals.s3uploadResponsive(req.file, newLocation);
        await req.locals.query(
          "UPDATE videos SET image = $1, image_sizes = $2 WHERE id = $3", 
          [sizes.default, sizes, video.id]);
        video.imageSizes = sizes
        video.image = sizes.default
      }
      
    return { video }
  });

  app.postAsync('/videos/:videoId/questions/:questionId?', app.locals.userOnly, async (req, res) => {
    // Anyone can ask; only the asker or a writer can edit a question, and only
    // writers can answer it (transcription, timestamp, "important").
    const isWriter = app.locals.isWriter(req.locals.user);
    if (req.params.questionId) {
      const existing = await req.locals.selectOne(
        'SELECT author_id FROM questions WHERE id = $1',
        [req.params.questionId],
        'find-question-author'
      );
      if (!existing) throw new app.locals.NotFound('Question is not found');
      if (!isWriter && existing.authorId !== req.locals.user.id) throw new app.locals.Forbidden;
    }
    if (!isWriter) {
      for (const key of ['transcriptionHtml', 'transcription_html', 'seconds', 'isImportant', 'is_important']) {
        delete req.body.question[key];
      }
    }


    const question = await req.locals.selectOne(
      app.locals.UPSERT('questions', [ 'video_id', 'content', 'slugs', 'seconds', 'transcription_html', 'author_id', 'is_important'], undefined, [],
        // A non-writer editing their question keeps the writer's answer intact.
        isWriter ? ['author_id'] : ['author_id', 'transcription_html', 'seconds', 'is_important']),
      [JSON.stringify(app.locals.underscoreObject({
        ...req.body.question,
        id: req.params.questionId || null,
        slugs: req.body.question.slugs ? req.body.question.slugs.split(/\s*[,;]\s*/).filter(Boolean) : [],
        videoId: req.params.videoId,
        authorId: req.locals.user.id,
        seconds: req.body.question.seconds || null
      }))],
      'upsert-question'
    );

    if (question.authorId != req.locals.user.id && (question.transcriptionHtml || question.seconds)) {
      await req.locals.app.locals.sendNotification(req, question.authorId, {
        title: `${req.locals.user.name.split(' ')[0]} answered your question`,
        body: question.transcriptionHtml ? question.transcriptionHtml.replace(/<[^>]+>/g, '') : 'Watch the video',
        link: `/videos/${req.params.videoId}?success=question/` + question.id,
      }, '1 year');
    }

    return { question }
  });


  app.getAsync('/videos', async (req, res) => {
    const videos = await req.locals.selectAndCount(
      findVideoQuery,
      [req.query.page, 20],
      'find-videos'
    );

    if (req.accepts('html')) {
      return app.locals.renderedStaticPage(app, {
        title: "Videos",
        type: 'article',
        content: `<h1><a href="${process.env.APP_URL}">Archimedes Finance</a></h1>
        <p>Become a better investor</p>
        ${videos.map((video) => `
          <h2><a href="/videos/${video.slugs && video.slugs[0] || video.id}/">${video.name}</a></h2>
          ${video.image ? app.locals.responsiveImage(video.image, video.imageSizes) : ''}
          ${video.summaryHtml && `<div class="expert chapter">${video.summaryHtml}</div>` || ''}
          ${video.contentHtml && `<div class="expert chapter">${video.contentHtml}</div>` || ''}
          ${video.footerHtml && `<div class="expert chapter">${video.footerHtml}</div>` || ''}
          ${video.experts.map((expert) => {
            return '<div class="author">By ' + expert.name + '</div>'
          })}
          
          ${video.questions.map((question) => {
            return `<div class="question">
              <h2>${question.content}</h2>
              ${question.transcriptionHtml}
            </div>` 
          })}

          <hr />
          <br />
          <br />
          <br />
        `)}
        `
      })
    }
    return { videos }
  });


  app.getAsync('/videos/:videoId', async (req, res) => {
    const video = await req.locals.selectOne(
      findVideoQuery.replace('1 = 1', `CASE WHEN regexp_match($3, '[^\\d]') is null THEN id = $3::integer ELSE slugs && Array[$3]::text[] END`),
      [1, 20, req.params.videoId],
      'find-video-by-id'
    );
    if (!video) throw new app.locals.NotFound('Video is not found')

    if (req.accepts('html')) {
      return app.locals.renderedStaticPage(app, {
        title: video.name,
        description: video.summarHtml,
        image: video.image,
        type: 'article',
        content: `<h1><a href="${process.env.APP_URL}">Archimedes Finance</a></h1>
        <p>Become a better investor</p>
        <h2>${video.name}</h2>
        ${video.image ? app.locals.responsiveImage(video.image, video.imageSizes) : ''}
        ${video.summaryHtml && `<div class="expert chapter">${video.summaryHtml}</div>` || ''}
        ${video.contentHtml && `<div class="expert chapter">${video.contentHtml}</div>` || ''}
        ${video.footerHtml && `<div class="expert chapter">${video.footerHtml}</div>` || ''}
        ${video.experts.map((expert) => {
          return '<div class="author">By ' + expert.name + '</div>'
        })}
        ${video.questions.map((question) => {
          return `<div class="question">
            <h2>${question.content}</h2>
            ${question.transcriptionHtml}
          </div>` 
        })}`
      })
    }

    return { video }
  });



  app.deleteAsync('/videos/:videoId/questions/:questionId', app.locals.writerOnly, async (req, res) => {
    const query = "DELETE FROM questions WHERE id = $1 RETURNING *";
    const question = await req.locals.selectOne(
      query,
      [req.params.questionId],
      'delete-question'
    );
    return { question }
  });

  app.deleteAsync('/videos/:videoId', app.locals.writerOnly, async (req, res) => {
    const query = "DELETE FROM videos WHERE id = $1 RETURNING *";
    const video = await req.locals.selectOne(
      query,
      [req.params.videoId],
      'delete-video'
    );
    return { video }
  });

}