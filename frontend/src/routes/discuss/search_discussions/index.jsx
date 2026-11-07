import { Avatar, Page, Icon, User, LocalizedDate, Paginator, Search } from '/components/index.jsx';
import { useMemo, useStickyQueryValue, useFetchedData, usePagination, useRef } from '/lib/hooks/index.jsx'
import { PreactHTMLConverter } from '/lib/html';
import style from './style.module.scss';
const converter = PreactHTMLConverter();
const convert = (text) => converter.convert(text)

export default function ({query, page = 1, boardId}) {
  const searchRef = useRef()
  page = useStickyQueryValue(page, 1, boardId);
  query = useStickyQueryValue(query, null, boardId);

  const [discussions, discussionRequest, reloadDiscussions] = useFetchedData(`/discussions/?query=${query}&page=${page}`)

  const totalCount = parseInt(discussions[0] ? discussions[0].totalCount : 0);
  const [currentPage, lastPage] = usePagination(page, totalCount / 20, reloadDiscussions);

  if (searchRef.current  && searchRef.current != query) {
    reloadDiscussions();
  }
  searchRef.current = query;

  const navigation = useMemo(() => ({
    title: 'Search',
    parentAlwaysShow: true,
    parentTitle: 'Boards',
    parentLink: '/boards/1'
  }), [])

  return <Page id="search" navigation={navigation}>
    <Search url='/boards/search/' query={query} class={style.form}>
      {totalCount > 0 && <h3 class={style.tagline}>Discussions found: <aside>{totalCount}</aside></h3>}
    </Search>
    <ul class={style.list}>
      {discussions.map((discussion) => <li>
        <a class="background" href={`/boards/search/${discussion.topic.board.id}/topics/${discussion.topic.id}/discussions/${discussion.id}`}></a>
        <div class={style.meta}>
          <a href={`/boards/${discussion.topic.board.id}/topics/${discussion.topic.id}`}><Icon.Discussion /></a>
          <a class={style.topic} href={`/boards/search/${discussion.topic.board.id}/topics/${discussion.topic.id}/discussions/${discussion.id}`}>{convert(discussion.name)}</a>
          <aside>
            <LocalizedDate date={discussion.createdAt} />
            <strong> {discussion.replyCount} replies</strong>
            <Icon.ChevronRight />
          </aside>
        </div>

        <Avatar user={discussion.user} class={style.avatar} />
        <div class={style.content}>
          <User user={discussion.user} avatar={false} process={convert} class={style.user} />
          {convert(discussion.description)}
        </div>
      </li>)}
    </ul>

    <Paginator url={`/boards/search/?query=${query}`} currentPage={currentPage} lastPage={lastPage} />
  </Page>
}