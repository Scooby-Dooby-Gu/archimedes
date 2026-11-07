import { Paginator, Icon, Img, Button, Page } from '/components/index.jsx';
import { useStickyQueryValue, useEffect, usePagination, useCallback, useFetchedData, useMemo, useStore } from '/lib/hooks/index.jsx';
import style from './style.module.scss';
import Video from '../video/video';


export default function Videos({ success, page = 1, videoId }) {
  page = useStickyQueryValue(page, 1, videoId);


  const [{videos}, videosRequest, reloadVideos] = useFetchedData(`/videos?page=${page}`, { invalidate: success })

  const totalCount = parseInt(videos[0] ? videos[0].totalCount : 0);
  const [currentPage, lastPage] = usePagination(page, totalCount / 20);

  const canManage = useStore('auth.canManage');
  const user = useStore('auth.user');
  const maxWidth = useStore('app.maxWidth');
  const submissions = useStore('data.submissions');
  const glossary = useStore('data.glossary');

  const navigation = useMemo(() => ({
    scrollSelector: videoId ? `a.icon-right[href*="/videos/${videoId}/"]` : '*',
    scrollDependency: [videoId, page],
    //title: 'Videos',
    headerTheme: 'blue',
    manageLink: canManage && `/videos/new`,
    //titleNode: <a href={import.meta.env.SITE_URL || "/"}><Icon.LogosArchimedes  class={style.logo} /></a>,
    headerHidden: false,//!canManage,
    actionTitle: canManage && <Icon.Add />,
    actionLink: canManage && `/videos/new`,
    requests: [videosRequest],
    titleNode: <a class={style.logo} href={import.meta.env.SITE_URL || "/"}><Icon.LogosArchimedes /></a>,
  }), [videosRequest.error, videoId, page, maxWidth]);

  const onVideoClick = useCallback((e) => {
    const link = e.target.closest('a, button');
    if (!link) e.target.closest('li.' + style.video).querySelector('.button[href]').click()
  }, []);

  useEffect(() => {
    if (!videoId && maxWidth > 784 && page == 1 && videos[0] && !videos[0].isPlaceholder) {
      const timeout = setTimeout(() => {
        const button = document.querySelector('.' + style.video + ' .button[href]');
        if (button) button.click();
      }, 350)
      return () => clearTimeout(timeout)
    }
  }, [maxWidth, videoId])

  const content = useMemo(() => <>
    <header class={`${style.header} cover theme-blue`}>
      {false && <a href={import.meta.env.SITE_URL || "/"}  class={style.logo}><Icon.LogosArchimedes  class={style.logo} /></a>}
      Learn by watching videos from your favorite experts. Ask questions and suggest topics that interest you for each episode!
    </header>
    <ul class={style.videos}>
      {videos.map((video) => <li class={`${videoId == video.id || video.slugs.includes(videoId) && 'active'} ${style.video}`} onClick={onVideoClick}>
        {/*video.image && <div class={style.cover}><Img crossorigin={(video.image || '').match(/archimedes.*s3/) && 'anonymous'} src={video.image} srcset={video.imageSizes}/></div>*/}
        <Video onlyThumbnail={true} video={video} glossary={glossary} maxQuestions={3} isQuestionListStatic={true} hideContent={true} submissions={submissions} >
          <div class={style.actions}>
            {!video.publishedAt && <Button.Link href={`/videos/${video.slugs[0]}/?action=ask`} icon="ChevronRight" class="icon-right">
              Suggest topic or ask question
            </Button.Link>}
            {video.publishedAt && <Button.Link href={`/videos/${video.slugs[0]}/`} icon="ChevronRight" class="icon-right transparent round">
              Watch the video
            </Button.Link>}
          </div>
        </Video>
      </li>)}
    </ul>
    <Paginator url={`/videos/`} currentPage={currentPage} lastPage={lastPage} />

    {!user && <div class={style.footer}>
      <p>See what else we have to offer at Archimedes, the investment learning hub.</p>
      <div class={style.buttons}>
        {maxWidth > 784 && <Button.Link href="/signup" class="primary round">Sign up</Button.Link>}
        {maxWidth > 784 && <Button.Link href={import.meta.env.SITE_URL || "/"} class="round">About Archimedes</Button.Link>}
      </div>
    </div>}
  </>, [videos, videoId, submissions])

  return useMemo(() => 
    <Page navigation={navigation} class={style.page}>{content}</Page>, 
    [navigation, content]
  );
}

