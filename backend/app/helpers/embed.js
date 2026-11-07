import parseOpenGraph  from 'open-graph-scraper';
import util from 'util';
import fs from 'fs';
import stream from 'stream'
import fetch from 'node-fetch';
import entities from 'html-entities';
const streamPipeline = util.promisify(stream.pipeline)

export function parseYoutubeVideoID(url){
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  return (match&&match[7].length==11)? match[7] : false;
}


export async function extractOpenGraphFromUrl(url) {
  try {
    const { error, result, response } = await parseOpenGraph({
      url: url.trim(),
      //timeout: 4000,
      peekSize: 20000,
      headers: {
        "user-agent": url.includes('twitter.com') ? "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" : `Mozilla/5.0 (iPhone; CPU iPhone OS 13_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.4 Mobile/15E148 Snapchat/10.84.0.52 (like Safari/604.1)`,
      },
    });
    if (error) throw new Error('Could not embed url: ' + url);

    var image = result.ogImage || result.twitterImage;
    if (!image) {
      const youtubeId = parseYoutubeVideoID(url);
      if (youtubeId) {
        var head = await fetch(`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`, {
          method: 'head'
        });
        // some youtube videos dont output maxresdefault
        if (head.status == 404) {
          image = { url: `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` }
        } else {
          image = { url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` }
        }
      }
    }
    const values = { 
      type: url.match(/\.(pdf|xls|doc)|docs.google/) ? 'document' : 'page',
      title: result.ogTitle ? entities.decode(result.ogTitle) : null,
      description: result.ogDescription ? entities.decode(result.ogDescription) : null,
      image: image ? image.url : null,
      response: result
    };
    return values;
  } catch(e) {
    console.log(e)
    if (url.match(/\.(gif|png|jpe?g)/)) {
      return { type: 'image', url: url, image: url }
    } else if (url.match(/\.(pdf|xls|doc)/)) {
      return { type: 'document', url: url, title: url.split('/').pop().split('?').shift()}
    }
    throw e
  }
}


export async function fetchToFile (destination, url, options) {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type');
  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
  await streamPipeline(response.body, fs.createWriteStream(destination))
  if (contentType && contentType.includes('image')) {
    return contentType.split('/').pop();
  } else  {
    const extension = url.toLowerCase().split('?')[0].split('/').pop().split('.').pop();
    if (extension == 'png' || extension == 'gif' || extension == 'jpeg' || extension == 'jpg' || extension == 'webm') {
      return extension;
    }
  }
}