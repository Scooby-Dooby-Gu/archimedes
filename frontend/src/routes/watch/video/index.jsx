import { videoState } from '/lib/states.js';
import { Button, FormField, Icon, Page, Img } from '/components/index.jsx';
import { useAsyncForm, useEffect, useFetchedData, useFormData, useMemo, useStore } from '/lib/hooks/index.jsx';
import VideoComponent from './video';
import style from './style.module.scss';

import { copyToClipboard } from '/lib/helpers';



const defaultQuestionFormData = {
  question: { 
    content: ''
  }
}
export default function Video({ success, videoId, goalId, ambitionId  }) {
  const [videoData, videoRequest, reloadVideo] = useFetchedData(`/videos/${videoId}`, { invalidate: success })
  const { video } = videoData;
  const canManage = useStore('auth.canManage');
  const user = useStore('auth.user');
  const submissions   = useStore('data.submissions');
  const glossary   = useStore('data.glossary');
  const maxWidth = useStore('app.maxWidth');

  useEffect(() => {
    dispatch('fetchCourses')
  }, [])

  const navigation = useMemo(() => ({
    scrollSelector: videoId ? `a[href$="/videos/${videoId}"]` : false,
    title: video.name,
    manageLink: canManage && `/videos/${video.id}/edit`,
    parentTitle: maxWidth > 784 && !goalId ? null : goalId ? 'To goal' : 'Back',
    parentLink: goalId ? `/ambitions/${ambitionId}/goals/${goalId}` : `/videos/`,
    actionLink: canManage && `/videos/${video.id}/edit`,
    requests: [videoRequest],
    titleNode: [],
    headerHidden: !canManage && maxWidth > 784,
    headerTheme: 'white',
    headerType: 'notch',
    headerClass: 'back-compact',
  }), [videoRequest, video.name, canManage, goalId])

  const [request, onSubmit] = useAsyncForm((response) => {
    updateFormData(defaultQuestionFormData);
    reloadVideo();
    //route(`/videos/${response.data.video.id}?success=question`);
  });
  const showForm = user && (canManage || videoState(video) === 'upcoming') && !video.isPlaceholder;
  const [questionData, updateFormData, formRef] = useFormData(defaultQuestionFormData, undefined, [showForm]);

  const content = useMemo(() => <>
    <VideoComponent submissions={submissions} glossary={glossary} class={style.singular} video={video} hideName={true} questions={video.questions} canManage={canManage}>
    </VideoComponent>
  </>, [video, glossary]);

  const playVideo = (e) => {
    const videoLink = e.target.closest('#video').querySelector('a.card-url[href*="youtube"]');
    if (videoLink) videoLink.click();
  }  
  return useMemo(() => 
    <Page id="video" navigation={navigation} class={style.page}>
      {user && <a class={`${style.play} ${style.badge} badge timestamp`} onClick={playVideo}>
        <Icon.Play class={`icon play`}  />
      </a>}
      <div class={style.header}>
        <div class={style.cover}><Img crossorigin={(video.image || '').match(/archimedes.*s3/) && 'anonymous'} src={video.image || 'https://s3.us-west-1.amazonaws.com/archimedes-user-uploads-production/videos/new/17/image@1024x500.png'} srcset={video.imageSizes}/></div>
      </div>
      <h1 class={style.bigtitle}>
        {video.slugs && video.slugs.length > 0 && <Icon.Share class={style.share} onClick={(e) => {
          const url = `${location.protocol}//${location.host}/videos/${video.slugs[0]}`;
          track('send', 'event', 'Video/Share', video.name)
          copyToClipboard(url);
          alert('The link to this video was copied to the clipboard and is ready for you to share');
          e.preventDefault();
          e.stopPropagation();
        }} />}
        {canManage && <a href={`/videos/${video.id}/edit`}>{video.name}</a>}
        {!canManage && video.name}
      </h1>
      {content}
      {!user && <div class={style.ask}>
        {videoState(video) === 'published' && <p>
          Join Archimedes for free access to expert content, lessons, and a game that help you become a better investor.
        </p>}
        {videoState(video) === 'upcoming' && <p>
          Join for free to suggest topics and ask questions.
        </p>}
        <div class={style.buttons}>
          {maxWidth > 784 && <Button.Link href="/signup" class="primary round">Sign up</Button.Link>}
          {maxWidth > 784 && <Button.Link href={import.meta.env.SITE_URL || "/"} class="round">About Archimedes</Button.Link>}
        </div>
      </div>}

      {showForm && <form class={style.ask} onSubmit={onSubmit} ref={formRef} action={`/videos/${video.id}/questions`} method="post">
        {videoState(video) === 'upcoming' && <h2>Experts are here to help - what do you want to know?</h2>}
        <FormField type="textarea" name="question[content]" placeholder="Your question in under 140 characters"></FormField>
        <Button.Submit class={`${style.submit} wide primary`} disabled={!questionData.question.content || request.loading} loading={request.loading}></Button.Submit>
      </form>}
    </Page>
  , [navigation, content, request.loading, questionData.question.content, showForm] );
}
