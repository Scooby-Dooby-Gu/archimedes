import { findLessonById } from "../../helpers/finders.js";

function enrichDefinitionMicrodata(html = '') {
  if (html.isPlaceholder) return html;
  return html.replace(/<figure ([^>]*type="definition"[^>]*)>(.*?)<\/figure>/gi, (m, attr, body) => {
    const content = body.replace(/<figcaption/gi, (m) => {
      return m + ' itemprop="name"'
    }).replace(/(<figcaption[^>]+)>(.*?)(<\/figcaption>)/gi, (m, tag, body, close) => {
      return `${tag} itemprop="name"><span class="what-is">What is</span> ${body.replace(/<[^>]+>/g, '').split('/')[0].replace('*', '')}<span class="what-is">?</span>${close}`
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

  app.getAsync('/sitemap.xml', async (req, res) => {
    const query = app.locals.SELECT("lessons", {
      attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'content_html', 'difficulty', 'duration', 'questions', 'previous_lesson_id', 'course_id', 'slugs', 'author_id', 'updated_at', 'published_at'],
  
      where: {
        1: 1
      }
    });
    const lessons = await req.locals.select("SELECT * from lessons WHERE slugs is not null and slugs != ARRAY[]::text[]");
    const videos = await req.locals.select("SELECT * from videos WHERE slugs is not null and slugs != ARRAY[]::text[]");
    
    res.setHeader('Content-Type', 'application/xml');
  
    const forceRecrawl = new Date('2022-01-04');
  
  
    return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
      <loc>${app.locals.siteUrl()}/videos/</loc>
    </url>
    ${lessons.map((lesson) => 
      !String(lesson.slugs[0]).startsWith('for-') && lesson.slugs.map((slug) => `<url>
        <loc>${app.locals.siteUrl()}/lessons/${slug}</loc>
        <lastmod>${new Date(Math.max(forceRecrawl, new Date(lesson.updatedAt))).toISOString().split('T')[0]}</lastmod>
          ${lesson.imageSizes && lesson.imageSizes.default ? `<image:image>
            <image:loc>${lesson.imageSizes.default}</image:loc>
          </image:image>` : ''}
        </url>
      `)).flat().filter(Boolean).join('')}
    ${'' && videos.map((video) => 
      video.slugs.map((slug) => `<url>
        <loc>${app.locals.appUrl()}/videos/${slug}</loc>
        <lastmod>${new Date(Math.max(forceRecrawl, new Date(video.updatedAt || video.scheduledAt || video.publishedAt || new Date))).toISOString().split('T')[0]}</lastmod>
          ${video.imageSizes && video.imageSizes.default ? `<image:image>
            <image:loc>${video.imageSizes.default}</image:loc>
          </image:image>` : ''}
        </url>
      `)).flat().join('')}
    </urlset>`
  });
  
  
  app.getAsync('/sitemap.html', async (req, res) => {
    const query = app.locals.SELECT("lessons", {
      attributes: ['id', 'name', 'description', 'image', 'image_sizes', 'created_at', 'content_html', 'difficulty', 'duration', 'questions', 'previous_lesson_id', 'course_id', 'slugs', 'author_id', 'updated_at', 'published_at'],
  
      where: {
        1: 1
      }
    });
    const lessons = await req.locals.select("SELECT * from lessons WHERE slugs is not null and slugs != ARRAY[]::text[]");
    const videos = await req.locals.select("SELECT * from videos WHERE slugs is not null and slugs != ARRAY[]::text[]");
    
    res.setHeader('Content-Type', 'text/html');
  
  
    return `<html>
    <title>Archimedes - Sitemap</title>
    <h1>Archimedes - Your personal investment coach</h1>
    <h2>Sitemap</h2>
    <ul>
    <li>
      <a href="${app.locals.appUrl()}/">Sign in</a>
    </li>
    <li>
      <a href="/">Learn more about Archimedes</a>
    </li>
    </ul>
    <h2>Lessons</h2>
    <ul>
    ${lessons.map((lesson) => 
      !String(lesson.slugs[0]).match(/for-|blog/) && lesson.slugs.map((slug) => `<li>
          <a href="/lessons/${slug}">
            <h2>${lesson.name}</h2>
            <!--
            <p>${lesson.description}</p>
            ${lesson.imageSizes && lesson.imageSizes.default ? `<img style="max-width: 200px; height: auto; margin-bottom: 50px;" src="${lesson.imageSizes.default}" />` : ''}
            -->
          </a>
        </li>
      `)).flat().filter(Boolean).join('')}
    </ul>
    <h2>Videos</h2>
    <ul>
    ${'' && videos.map((video) => 
      video.slugs.map((slug) => `<li>
          <a href="/videos/${slug}">
            <h2>${video.name}</h2>
            <!--
            <p>${video.summaryHtml}</p>
            ${video.imageSizes && video.imageSizes.default ? `<img style="max-width: 200px; height: auto; margin-bottom: 50px;" src="${video.imageSizes.default}" />` : ''}
            -->
          </a>
        </li>
      `)).flat().join('')}
    </ul>
    </html>`
  });
  

  app.getAsync('/lessons/:lessonId', async (req, res) => {
    const lesson = await findLessonById(req, req.params.lessonId);

    if (req.accepts('html')) {
      return renderLesson(app, lesson, undefined, 'lesson');
    }

    return { lesson }
  })



  function renderLesson(app, lesson, pack, type) {
    const prefix = pack ? `/${pack.slugs[0]}/` : type == 'pack' || type == 'blog' ? `/${lesson.slugs[0]}/` : '/'
    var html = lesson.contentHtml || '';
    html = html.replace(/<figure([^>]+?)expandable([^>]+?)>/g, '<figure$1open expandable$2>')
    html = enrichDefinitionMicrodata(html);

    // Links to lessons on our own site (old getmedes.com links, or the
    // configured site/app hosts) become relative; other sites stay as they are.
    const ownHosts = [app.locals.siteUrl(), app.locals.appUrl()]
      .map((u) => u.replace(/^https?:\/\//, '')).filter(Boolean);
    html = html.replace(/"([^"]*?)\/lessons\/([^"]*?)"/g, (m, before, after) => {
      if (before.match('//') && !before.match('getmedes') && !ownHosts.some((h) => before.includes(h))) return m;
      return `${prefix}${after}`
    })

    return app.locals.renderedStaticPage(app, {
      title: lesson.name + ' | Archimedes',
      description: lesson.description,
      image: lesson.image,
      type: type,
      content: `<main id="content" class="page-${type}">
        <div itemscope itemtype="https://schema.org/ScholarlyArticle" class="article chapter">
          ${pack && type == 'lesson' && `<a href="/${pack.slugs[0]}" class="breadcrumbs">
            ${pack.slugs[0] == 'partnerships' ? `<strong>All partnerships</strong>` : `<strong>${pack.name}</strong>`}
          </a>` || ''}
          ${!pack && (type == 'lesson' || type == 'pack') && `<a href="/#starter-packs" class="breadcrumbs">
            ${lesson.slugs[0] == 'partnerships' || type != 'pack'  ? 'Back' : `Try another start pack`}
          </a>` || ''}
          ${type == 'blogpost' && `<a href="/blog" class="breadcrumbs">
            All posts
          </a>` || ''}
          ${type == 'blog' && `<a href="/" class="breadcrumbs">
            Back
          </a>` || ''}
          <header class="header">   
            ${lesson.image ? app.locals.responsiveImage(lesson.image, lesson.imageSizes).replace(`<img`, '<img itemprop="image"') : ''}
            <h1 itemprop="headline">${lesson.name}</h1>
            ${type == 'lesson' && `<p><small><span itemprop="learningResourceType">Lesson</span>
            in
              <span itemprop="educationalAlignment"
              itemscope itemtype="https://schema.org/AlignmentObject">
                <meta itemprop="alignmentType" content="educationalSubject" />
                <span itemprop="educationalFramework">Course</span>:
                <span itemprop="targetName">${lesson.course.name}</span>
                <link itemprop="targetUrl" href="${process.env.APP_URL}/courses/${lesson.course.id}">
              </span>
              <meta itemprop="datePublished" content="${(new Date(lesson.publishedAt || lesson.createdAt)).toISOString()}" />
            
              (<span itemprop="educationalLevel"
                itemscope itemtype="https://schema.org/DefinedTerm"><span itemprop="name">${lesson.difficulty}</span></span>, 
                <span itemprop="duration" content="PT${lesson.duration}min">${lesson.duration}min</span>)
            </small></p>` || ''}
            ${type != 'pack' && `<p itemprop="abstract">${lesson.description}</p>` || ''}  
          </header>
          <section class="content"  itemprop="description">
            ${html}
          </section>
        </div>
        ${lesson.author ? '<div class="author" itemprop="author">By ' + lesson.author.name + '</div>': ''}
      </main>`
    })
  }


  app.getAsync('/privacy-policy', async (req, res) => {
    const lesson = await findLessonById(req, 'privacy-policy');
    if (req.accepts('html')) {
      return renderLesson(app, lesson, undefined, 'page');
    }
    return { lesson }
  })
  app.getAsync('/privacy', async (req, res) => {
    const lesson = await findLessonById(req, 'privacy-policy');
    if (req.accepts('html')) {
      return renderLesson(app, lesson, undefined, 'page');
    }
    return { lesson }
  })
  app.getAsync('/terms-of-service', async (req, res) => {
    const lesson = await findLessonById(req, 'terms-of-service');
    if (req.accepts('html')) {
      return renderLesson(app, lesson, undefined, 'page');
    }
    return { lesson }
  })
  app.getAsync('/terms', async (req, res) => {
    const lesson = await findLessonById(req, 'terms-of-service');
    if (req.accepts('html')) {
      return renderLesson(app, lesson, undefined, 'page');
    }
    return { lesson }
  })
  app.getAsync('/for-:packId', async (req, res) => {
    const pack = await findLessonById(req, 'for-' + req.params.packId);
    if (req.accepts('html')) {
      return renderLesson(app, pack, undefined, 'pack');
    }
    return { lesson }
  })
  app.getAsync('/blog', async (req, res) => {
    const pack = await findLessonById(req, 'blog');
    if (req.accepts('html')) {
      return renderLesson(app, pack, undefined, 'blog');
    }
    return { lesson }
  })
  app.getAsync('/blog/:lessonId', async (req, res) => {
    const pack = await findLessonById(req, 'blog');
    const lesson = await findLessonById(req, req.params.lessonId);

    if (req.accepts('html')) {
      return renderLesson(app, lesson, pack, 'blogpost');
    }

    return { lesson }
  })
  app.getAsync('/partnerships', async (req, res) => {
    const pack = await findLessonById(req, 'partnerships');
    if (req.accepts('html')) {
      return renderLesson(app, pack, undefined, 'pack');
    }
    return { lesson }
  })
  app.getAsync('/partnerships/:lessonId', async (req, res) => {
    const pack = await findLessonById(req, 'partnerships');
    const lesson = await findLessonById(req, req.params.lessonId);

    if (req.accepts('html')) {
      return renderLesson(app, lesson, pack, 'lesson');
    }

    return { lesson }
  })
  app.getAsync('/for-:packId/:lessonId', async (req, res) => {
    const pack = await findLessonById(req, 'for-' + req.params.packId);
    const lesson = await findLessonById(req, req.params.lessonId);

    if (req.accepts('html')) {
      return renderLesson(app, lesson, pack, 'lesson');
    }

    return { lesson }
  })
}