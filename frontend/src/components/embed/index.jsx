import { useStore, useEffect, useRef, useScript } from "/lib/hooks";
import { filterLessons } from "/lib/data";
import Img from "../img";
import { useFetchedData, useState } from "../../lib/hooks";
import Icon from "../icon";
import { Placeholder } from "../../lib/request";
import { ownLessonSlug } from "../../lib/hosts";

export default function Embed({ url }) {
  const lessonLink = ownLessonSlug(url);
  if (lessonLink) {
    return <Embed.Lesson url={url} />  
  } else {
    return <Embed.External url={url} />
  }
  
}

Embed.Lesson = ({url}) => {
  const courses = useStore('data.courses');
  const lessonId = ownLessonSlug(url);
  const lesson = filterLessons((lesson) => lesson.id == lessonId || (lesson.slugs || []).includes(lessonId), courses)[0]
  if (!lesson) return;
  return <div class="lesson-embed">
    <a href={url} class={"embed"}>
      <Img src={lesson.image} srcset={lesson.imageSizes} />
    </a>
    <a href={url} class="lesson-embed-meta">
      <span class="lesson-embed-title">{lesson.name}</span>
      <p>
        {lesson.description}
      </p>
    </a>
  </div>
  
}


Embed.External = ({url}) => {
  const ref = useRef();
  const canManage = useStore('auth.canManage');


  const endpoint = '/embeds?url=' + encodeURIComponent(url);
  const [data, request, fetchEmbed] = useFetchedData(endpoint, {
    observeRequest: true
  });

  const reload = (...args) => {
    const img = ref.current.querySelector('img');
    if (img) {
      img.parentNode.removeChild(img)
      // clear up the cache
      for (var prop in data.imageSizes) {
        fetch(data.imageSizes[prop], {
          headers: {
            'Cache-Control': 'no-cache'
          },
          method: 'get'
        });
      }
    }
    ref.reloading = true;
    fetchEmbed(...args);
  }
  const onRefresh = () => {
    reload({refresh: true}, endpoint, {method: 'put'});
  };
  const onEdit = () => {
    var title = prompt('Enter title', data.title || '');
    if (title == '') title = null
    else if (title == null) title = data.title;
    var description = prompt('Enter description', data.description || '');
    if (description == '') description = null
    else if (description == null) description = undefined;
    var image = prompt('Enter image url');
    if (!image) image = undefined;
    
    reload({embed: {title, description, image}}, undefined, {method: 'put'});
  };

  const maxSize = parseInt(Object.keys(data.imageSizes || {}).sort().filter((k) => k != 'default')[0]);

  const isProcessing = ref.reloading && request.loading;

  return <div class={`external-embed ${maxSize <= 400 && data.type != 'image' ? 'compact' : ''}`} ref={ref}>
    {data.image && <a href={url} class={"embed"} target="_blank">
      <Img src={data.image} srcset={data.imageSizes} />
    </a>}


    {(data.title || data.description) && <a href={url} class="external-embed-meta" target="_blank">
      {data.title && <span class="external-embed-title">
        {data.type == 'document' && <Icon.Pages />}
        {data.title}
      </span>}
      {data.description && <p>
        {data.description}
      </p>}
    </a>}
    {canManage && !isProcessing && <div>
      <a class={"external-embed-action"} href="#" onClick={(e) => { onEdit(); e.preventDefault(); }}>Edit</a>
      <a class={"external-embed-action"} href="#" onClick={(e) => { onRefresh(); e.preventDefault(); }}>Recrawl</a>
    </div>}
    {canManage && isProcessing && <Icon.Spinner />}
    {!data.isPlaceholder && data.error && <p>Error: {data.error}</p>}
  </div>
}