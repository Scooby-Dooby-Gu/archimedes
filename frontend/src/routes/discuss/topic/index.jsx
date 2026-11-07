import { Button, Avatar, Icon, Page, Paginator, Grid, Img } from '/components/index.jsx';
import { usePrecache, useFetchedData, useStickyQueryValue, usePagination, useMemo, useStore } from '/lib/hooks/index.jsx'
import * as formatters from '/lib/formatters';
import style from './style.module.scss';

export default function ({boardId, topicId, discussionId, page = 1, success}) {
  page = useStickyQueryValue(page, 1, discussionId);

  const user            = useStore('auth.user');
  const company         = useStore('auth.company');
  const openDiscussions = !company && useStore('app.openDiscussions');
  const canManage       = useStore('auth.canManage');

  const [{topic}, topicRequest, reloadTopic] = useFetchedData(`/boards/${boardId}/topics/${topicId}?page=${page}`, { invalidate: success })
  
  const [currentPage, lastPage] = usePagination(page, topic.discussionCount / 10);

  usePrecache((cache) => topic.discussions.forEach((discussion) => {
    cache[`/boards/${topic.board.id}/topics/${topic.id}/discussions/${discussion.id}`] = { discussion: {...discussion, topic } }
  }), [topic]);
  
  const navigation = useMemo(() => ({
    scrollSelector: discussionId ? `a[href$="/discussions/${discussionId}"]` : false,
    title: company ? 'Discussions' : topic.name,
    headerTheme: 'white',
    manageLink: canManage && `/boards/${topic.board.id}/topics/${topic.id}/edit`,
    parentTitle: 'Back',
    parentLink: openDiscussions && `/boards/${topic.board.id}`,
    actionTitle: <Icon.Add />,
    actionLink: `/boards/${topic.board.id}/topics/${topic.id}/discussions/new`,
    requests: [topicRequest]
  }), [topic, discussionId, topicRequest.error])

  const content = useMemo(() => <>
    <div class="summary">
      <Img src={topic.cover} class="cover" />
      <p>{formatters.markdown(topic.description)}</p>
    </div>

    {topic.discussions.length === 0 && <div class="empty-state">
      <Icon.Discussion />
      <h2>No discussions yet</h2>  
      {!location.href.match(/\/new/) && <Button.Link class="primary" href={`/boards/${topic.board.id}/topics/${topic.id}/discussions/new`}>Start discussion</Button.Link>}
    </div>}
    {topic.discussions.length > 0 && <Grid 
      type="list"
      headers={[
        {name: "Link", type: 'link'},
        {name: "Icon", type: 'icon'},
        {name: "Author", type: 'meta'},
        {name: "Spacer", type: 'meta'},
        {name: "Replies", type: 'meta'},
        {name: "Action", type: 'meta'},
        {name: "Name"},
      ]}
      rows={topic.discussions.map((discussion) => [
        `/boards/${boardId}/topics/${topicId}/discussions/${discussion.id}`,
        <Avatar user={discussion.user} />,
        discussion.user.name,
        '',
        discussion.replyCount + ' replies',
        discussion.assistanceRequestedAt && !discussion.assistanceProvidedAt ? 
          <Icon.Question class="forward icon" /> : 
        discussion.assistanceProvidedAt ? 
          <Icon.Checkmark class="forward icon" /> :
          <Icon.ChevronRight class="forward icon" />,
        <h3 class="normal">{discussion.name}</h3>,
        {
          class: [
            discussionId == discussion.id && 'selected',
            discussion.pinnedAt && style.pinned,
            discussion.closedAt && style.closed
          ].filter(Boolean).join(' ')
        }
      ])}
    />}
    <Paginator url={`/boards/${topic.board.id}/topics/${topic.id}`} currentPage={currentPage} lastPage={lastPage} />
  </>, [topic, discussionId])

  return useMemo(() => <Page id="boards" navigation={navigation}>
    {content}
  </Page>, [navigation, content])
}