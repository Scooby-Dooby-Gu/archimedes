import request from 'request';


export async function getFrontendEntryHTML(app) {
  //if (app.locals.frontendEntryHTML) return app.locals.frontendEntryHTML;


  var options = {
    method: 'GET',
    url: process.env.APP_URL + '/marketing.html',
    headers: {
      'Accept': 'text/html'
    },
  };

  return new Promise((success, failure) => {
    request(options, function (error, response, body) {
      if (error) failure(error)
      //console.log(body)
      app.locals.frontendEntryHTML = body;
      success(body)
    });
  })
}

export function responsiveImage(src, srcset) {
  if (!src) {
    return;
  }
  if (typeof srcset === 'object' && srcset) {
    var newset = [];
    var maxSize = 0;
    for (var property in srcset) {
      if (srcset[property] && property !== 'default' && property !== 'isPlaceholder') {
        maxSize = Math.max(parseInt(property), maxSize);
        newset.push(srcset[property] + ' ' + parseInt(property) + 'w');
      }
    }
    newset.push(srcset.default + ' ' + (maxSize + 1) + 'w')
    srcset = newset.join(',')
  }
  if (src) {
    const dimensions = src.match(/@(\d+)x(\d+)/);
    /*if (dimensions && !props.width) {
      var extras = {width: dimensions[1], height: dimensions[2]}
    }*/
    return `<img 
      src=${src} 
      ${src.match(/archimedes.*s3/) ? "crossorigin='anonymous'" : ''} 
      ${srcset ? `srcset="${srcset}"` : ''} 
      sizes="(min-width: 784px) calc(100vw - 400px), 100vw"/>`
  }
}

export async function renderedStaticPage(app, options) {
  var html = await app.locals.getFrontendEntryHTML(app);

  html = html.replace(/(src|href)="\.\//g, `$1="${process.env.APP_URL}/`)
  // marketing.html uses __APP_URL__ / __SITE_URL__ instead of a fixed domain
  // (normally filled in at build time; this covers the dev server).
  html = html.replace(/__APP_URL__/g, app.locals.appUrl())
             .replace(/__SITE_URL__/g, app.locals.siteUrl())

  if (options.type)
    html = html.replace('id="page"', 'id="page" type="' + options.type + '"')

  if (options.title)
    html = html.replace(/<title>.*?<\/title>/, '<title>' + options.title + '</title>')
          .replace(/(<meta property="og:title" content=")[^"]*([^>]*>)/, '$1' + options.title + '$2')

  if (options.description)
    html = html.replace(/(<meta property="(?:og:description|description)" content=")[^"]*("[^>]*>)/g, '$1' + options.description + '$2')

  if (options.image)
    html = html.replace(/(<meta property="og:image" content=")[^"]*("[^>]*>)/, '$1' + options.image + '$2')

  if (options.content)
    html = html.replace(/<!--\s*start\s*-->[\s\S]+<!--\s*end\s*-->/, options.content)
    
  return html
}