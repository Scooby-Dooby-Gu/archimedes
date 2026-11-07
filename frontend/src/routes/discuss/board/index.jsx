import { usePrecache, useCallback, useFetchedData, useMemo, useStore } from '/lib/hooks/index.jsx'
import { Page, Button, Search, Grid, Icon } from '/components/index.jsx'
import * as formatters from '/lib/formatters';

export default function ({query, boardId, topicId, success}) {
  if (boardId === 'new') {
    boardId = '1';
  }
  const [{board}, boardsRequest, reloadBoards] = useFetchedData(`/boards/${boardId}`, { invalidate: success });
  const user = useStore('auth.user');
  const canManage = useStore('auth.canManage');

  const [{company}, companyRequest, reloadCompany] = useFetchedData(`/companies/${user.companyId}`, { immediate: !!user.companyId });
  
  const navigation = useMemo(() => ({
    requests: [boardsRequest],
    nav: <div class="block-vertical-padding">
      {!(import.meta.env.NODE_ENV === 'production' && !canManage) && <Grid 
        type="tabs" 
        class="main" 
        headers={[
          {name: 'Link', type: 'link'},
          {name: 'Name'}
        ]} 
        rows={[[
          "/boards/1",
          "Public",
          {class: boardId == 1 && 'selected'}
        ]].concat(user.companyId ? [[
          "/boards/2",
          company ? company.name : 'Workplace',
          {class: boardId == 2 && 'selected'}
        ]] : [])
        .concat([[
          "/boards/3",
          "Paper Chase",
          {class: boardId == 3 && 'selected'}
        ]])} />}
      <Search url='/boards/search/' query={query} placeholder="Search discussions" />
    </div>,
    pageTheme: 'gray',
    headerTheme: 'white',
    scrollSelector: boardId ? `a[href$="/boards/${boardId}/topics/${topicId}"]` : false,
  }), [boardId, boardsRequest.error, company.name, topicId])

  usePrecache((precache) => board.topics.forEach((topic) => {
    precache[`/boards/${board.id}/topics/${topic.id}`] = {topic: {...topic, board}}
  }), [board]);
  

  const [, moveCourseRequest, moveCourse] = useFetchedData('/', {
    method: 'post',
    immediate: false,
    headers: {
      'Content-Type': 'application/json'
    },
    onSuccess: () => {
      reloadBoards();
    }
  });

  const onSort = useCallback(canManage ? (url, index) => {
    moveCourse({
      order: index
    }, url);
  } : null, []);

  //<Button.Link href={`/boards/${board.id}/topics/new`}>New topic</Button.Link>

  const content = useMemo(() => <>
    {formatters.markdown(board.description)}
    <br />
    <Grid 
      type="list"
      class="separate"
      headers={[
        {name: "Link", type: 'link'},
        {name: "Handle", type: 'drag'},
        {name: "Icon", type: 'icon'},
        {name: "Name"},
        {name: "Action", type: 'action'},
      ]}
      rows={[canManage && [
        `/boards/${board.id}/topics/all`,
        null,
        null,
        <h3>New discussions</h3>,
        <Icon.ChevronRight class="forward icon" />,
        {
          class: topicId == 'all' && 'selected'
        }
      ],canManage && [
        `/boards/${board.id}/topics/requests`,
        null,
        null,
        <h3>Assistance requests</h3>,
        <Icon.ChevronRight class="forward icon" />,
        {
          class: topicId == 'requests' && 'selected'
        }
      ]].concat(board.topics.map((topic) => topic.isHidden && !canManage ? null : [
        `/boards/${board.id}/topics/${topic.id}`,
        onSort && <a class="handle"href={`/boards/${boardId}/topics/${topic.id}/move`}><Icon.DragHandle /></a>,
        topic.icon,
        <h3>{topic.name}</h3>,
        <Icon.ChevronRight class="forward icon" />,
        {
          class: [
            topicId == topic.id && 'selected',
            topic.isHidden ? 'hidden' : null
          ].join(' ')
        }
      ])).concat(canManage ? [[
        `/boards/${board.id}/topics/new`,
        null,
        null,
        'New topic',
        <Icon.Add class="forward icon" />,
        {
          class: topicId == 'new' ? 'selected' : null
        }
      ]] : []).filter(Boolean)}
      onSort={onSort}
    />
  </>, [topicId, board.topics])

  return useMemo(() => <Page id="boards" navigation={navigation}>
    {content}
  </Page>, [content, navigation])
}