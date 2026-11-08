import { Img, Page, Button, FormField, Avatar, Form, User, LocalizedDate, LocalizedDateTime, Paginator, Icon, NotificationPrompt } from '/components/index.jsx';
import { useCallback, useStore, useFetchedData, useAsyncForm, useAsyncLink, usePagination, useStickyQueryValue, useMemo, useState, useEffect } from '/lib/hooks/index.jsx'

import style from './style.module.scss';
import * as formatters from '/lib/formatters';
import { getLocation } from '../../../lib/navigation';

export default function Discussion({boardId, topicId, discussionId, page = 1, success, from, testerror}) {
  const user = useStore('auth.user');
  const company = useStore('auth.company');
  const canManage = useStore('auth.canManage');

  page = useStickyQueryValue(page, 1);

  const [focusedReplyId, focusReplyId] = useState(null);


  const [{discussion}, discussionRequest, reloadDiscussion] = useFetchedData(
    `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}?page=${page}`,
    {invalidate: success}
  );

  const [, assistanceRequest, requestAssistance] = useFetchedData(
    `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}/assistance`,
    {
      invalidate: success, 
      immediate: false,
      observeRequest: true,
      method: 'put', 
      onSuccess: () => {
        route(location.pathname + '?success=discussion' + Math.random())
      }
    }
  );

  const [replies, setReplies] = useState([]);


  const [currentPage, lastPage] = usePagination(page, discussion.replyCount / 50);

  // jump to last page when on reply
  const [replyRequest, onReply] = useAsyncForm((response, form) => {
    form.reset();
    //reloadDiscussion().then(() => {
    if (replies.length > 0)
      setReplies([]);
    route(location.pathname + '?success=' + Math.random() + (from ? '&from=' + encodeURIComponent(from) : ''))
    //})
    //  if (lastPage === currentPage) {
    //    route(`/boards/${boardId}/topics/${topicId}/discussions/${discussionId}?page=${lastPage}`)
    //  };
    //})*/
      
  })

  const [voteRequest, onVote] = useAsyncLink(() => reloadDiscussion(), () => {
    route('/signin');
  });

  const [deleteRequest, onDelete] = useAsyncLink(() => reloadDiscussion(), () => {
  });

  const replyTo = useCallback((reply) => {
    setReplies((replies) => replies.find((r) => r.id == reply.id) ? replies : replies.concat(reply));
    const textarea = document.querySelector('form.' + style.respond + ' textarea');
    if (textarea) textarea.focus()
  }, [])

  const topic = discussion && discussion.topic;
  const board = topic && topic.board;
  const parentLocation = getLocation({from}) || {url: `/boards/${boardId}/topics/${topicId}`, title: 'Back'};
  
  const navigation = useMemo(() => ({
    scrollSelector: focusedReplyId ? '#reply-' + focusedReplyId : page ? `.${style.top}` : false,
    scrollBehavior: 'instant',
    scrollPosition: 'start',
    scrollDependency: discussionId + (focusedReplyId || 0),
    headerTheme: 'white',
    title: discussion.name,
    parentType: 'topic',
    parentCache: {topic},
    parentTitle: parentLocation.title,
    parentLink: parentLocation.url,
    manageCache: {discussion},
    manageTitle: 'Edit',
    manageLink: (canManage || discussion.user.id === user.id) && `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}/edit`,
    actionTitle: (canManage || discussion.user.id === user.id) && <Icon.Settings />,
    actionLink: (canManage || discussion.user.id === user.id) && `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}/edit`,
    requests: [discussionRequest, replyRequest, assistanceRequest]
  }), [discussion, discussionRequest.error, replyRequest.error, assistanceRequest.error, focusedReplyId])
  
  const onFocus = useCallback(() => {
    document.querySelector('#app').classList.add('footerHidden');
  }, [])
  const onBlur = useCallback(() => {
    document.querySelector('#app').classList.remove('footerHidden');
  }, [])

  if (testerror != null) {
    throw new Error('Yarik test' + testerror)
  }

  const [expanded, setExpanded] = useState(false);

  const content = useMemo(() => <>
    <div class={style.top}>
      <aside class={style.date}>
        <LocalizedDateTime date={discussion.createdAt} />  
      </aside>
      <User user={discussion.user} class="gray" />
      <div class={style.post}>
        <p>{formatters.userMarkdown(discussion.description)}</p>
        {discussion.image && !discussion.image.isPlaceholder && <Img onClick={() => setExpanded((e) => !e)} crossorigin={(discussion.image || '').match(/archimedes.*s3/) && 'anonymous'} srcset={discussion.imageSizes} src={discussion.image} class={expanded ? style.expanded : style.collapsed} />}
      </div>
    </div>

    {(company || canManage) && false && <div class={style.request}>
      {!discussion.assistanceRequestedAt && <>
        <p>Need an expert from Archimedes to help with your question?</p>
        <Button class="grey" disabled={assistanceRequest.loading} loading={assistanceRequest.loading} icon="Education" onClick={() => requestAssistance({state: 'request'})}>Request assistance</Button>
      </>}
      {discussion.assistanceRequestedAt && !discussion.assistanceProvidedAt && <>
        <p>The request for assistance was submitted on <LocalizedDateTime date={discussion.assistanceRequestedAt} /></p>
        <Button class="primary" disabled={assistanceRequest.loading} loading={assistanceRequest.loading} icon="Checkmark" onClick={() => requestAssistance({state: 'resolve'})}>Resolve</Button>
        &nbsp;
        <Button class="secondary" disabled={assistanceRequest.loading} loading={assistanceRequest.loading} icon="Close" onClick={() => requestAssistance({state: 'cancel'})}>Cancel request</Button>
      </>}
      {discussion.assistanceRequestedAt && discussion.assistanceProvidedAt && <>
        <p>The request for assistance was resolved on <LocalizedDateTime date={discussion.assistanceRequestedAt} />.</p>
        <Button class="grey" disabled={assistanceRequest.loading} loading={assistanceRequest.loading} icon="Education" onClick={() => requestAssistance({state: 'reset'})}>Request more assistance</Button>
      </>}
    </div>}
    <div class={style.bar}>
      <span class="uppercase small gray">
        Discussion
      </span>
      {discussion.closedAt && <aside class="small gray"> Closed on <LocalizedDate date={discussion.closedAt} /></aside>}
      {discussion.replyCount > 1 && <span class="smaller gray">{discussion.replyCount} replies</span>}
    </div>
    {(user.id == discussion.user.id || discussion.replies.some((r) => r.user.id == user.id)) && <NotificationPrompt closable class={style.prompt}>
      <p>Get notified when somebody replies</p>
    </NotificationPrompt>}
    {discussion.replies.length == 0 && <div class="empty-state">
      <Icon.Discussion />
      <h2>No replies yet</h2>  
    </div>}
    {discussion.replies.length > 0 && <ul class={style.replies}>
      {discussion.replies.map((reply) => <li class={`${style.reply} ${focusedReplyId == reply.id && style.focused}`} id={`reply-${reply.id}`}>
        <Avatar user={reply.user} />
        <div class={style.reply_body}>
          <ul class="meta">
            <li class="spacer">
              <User user={reply.user} avatar={false} class="smaller gray" />
            </li>
            <li>
              {canManage && <a method="delete" onClick={(e) => confirm('Are you sure to delete this reply?') && onDelete(e) || [e.preventDefault(), e.stopPropagation()]}  href={`/boards/${board.id}/topics/${topic.id}/discussions/${discussion.id}/replies/${reply.id}/`}>
                <Icon.Close class={style.delete} />
              </a>}
              <LocalizedDateTime date={reply.createdAt} class="smaller" />
            </li>
          </ul>
          {reply.targets && reply.targets.length > 0 && <p class={style.replying}>
            in reply to&nbsp;  
            
            {reply.targets.map((target, index) => {
              return <><a href="#" onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                focusReplyId(target.id);
              }}>{target.user.name}</a>{index == reply.targets.length - 1 ? '' : index == reply.targets.length - 2 ? ' and ' : ', '}</>
            })}
          </p>}
          {formatters.userMarkdown(reply.body)}
          {!replies.isPlaceholder && <a class={style.reply_link} href="#" onClick={(e) => {
            replyTo(reply);
            e.preventDefault();
            e.stopPropagation();
          }} disabled={replies.find((r) => r.id == reply.id)}>{replies.find((r) => r.id == reply.id) ? 'Replying' : 'Reply'}</a>}
        </div>
      
        <div class={style.votes}>
          <a onClick={onVote}
            class={reply.vote && reply.vote.score == 1 && style.active}
            method="post"
            href={`/boards/${board.id}/topics/${topic.id}/discussions/${discussion.id}/replies/${reply.id}/votes?score=1`}>
              <Icon.Up />
            </a>
          <span class={style.score}>{reply.score}</span>
          {false && <a onClick={onVote}
            class={reply.vote && reply.vote.score == -1 && style.active}
            method="post"
            href={`/boards/${board.id}/topics/${topic.id}/discussions/${discussion.id}/replies/${reply.id}/votes?score=-1`}>
              <Icon.Down />
            </a>}
        </div>


      </li>)}
    </ul>}

    <Paginator url={location.pathname} currentPage={currentPage} lastPage={lastPage} />

    {(canManage || !discussion.closedAt) && <Form class={style.respond} action={`/boards/${board.id}/topics/${topic.id}/discussions/${discussion.id}/replies`} method="post" onSubmit={onReply}>
      {replies.length > 0 && <p class={style.replying}>In reply to <span>{formatters.and(replies.map((r) => r.user.name))}</span>: <aside><a href="#" onClick={(e) => {
        setReplies([]);
        e.preventDefault();
        e.stopPropagation();
      }}>Cancel reply</a></aside></p>}
      {replies.length > 0 && replies.map((r) => <input type="hidden" name="reply[target_reply_ids][]" value={r.id} />)}
      
      <FormField name="reply[body]" placeholder="Write your reply..." required type="textarea" onFocus={onFocus} onBlur={onBlur} />
      <Button.Submit class="primary" loading={replyRequest.loading}>Send reply</Button.Submit>
    </Form>}
  </>, [discussion, replyRequest.loading, assistanceRequest.loading, replies, focusedReplyId])


  return useMemo(() => <Page id="discussion" navigation={navigation}>
    {content}
  </Page>, [navigation, content]);
}