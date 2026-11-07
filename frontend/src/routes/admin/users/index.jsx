import { useAsyncForm, useState, usePagination, useStickyQueryValue, useFetchedData, usePrecache, useAsyncLink, useMemo } from '/lib/hooks/index.jsx'
import style from './style.module.scss';
import { Paginator, Search, Grid, Page, Button, Icon, Avatar, Form, FormField} from '/components/index.jsx';
import Header from '../header';

export default function User({ success, query, userId, ids, page = 1, type = '' }) {
  page = useStickyQueryValue(page, 1, userId);
  type = useStickyQueryValue(type, '', userId);
  ids = useStickyQueryValue(ids, '', userId);

  const [users, usersRequest, usersReload] = useFetchedData('/users/?verified=' + type + '&page=' + page + '&ids=' + (ids || ''), { invalidate: success });

  const [approveRequest, onApprove] = useAsyncLink(() => {
    usersReload();
  })

  const totalCount = parseInt(users[0] ? users[0].totalCount : 0);
  const [currentPage, lastPage] = usePagination(page, totalCount / 20);

  const [shouldShowPush, showPush] = useState(false);

  const [formSubmissionRequest, onSubmit] = useAsyncForm(({data}) => {
    alert('Successfully sent push notification')
    showPush(false);
  });

  const notificationForm = useMemo(() => {
    const onBeforeSubmit = (e) => {
      if (prompt("Type in \"SORRY FOR SPAM\" if you are sure you want to send out this notification.") == "SORRY FOR SPAM") {
        onSubmit(e);
      }
      e.preventDefault();
      e.stopPropagation();
    }
    if (!shouldShowPush) {
      return <Button onClick={() => showPush(true)}>Send push notification</Button>
    }
    return <Form onSubmit={onBeforeSubmit} method="post" action="/notifications/manual">
      <FormField type="text" name="notification[title]" placeholder="Title" />
      <FormField type="textarea" name="notification[body]" placeholder="Body" />
      <FormField type="text" name="notification[link]" placeholder="Link" />
      <Button.Submit>Push it good</Button.Submit>
    </Form>
  }, [shouldShowPush])

  
  const navigation = useMemo(() => ({
    title: 'All users',
    pageTheme: 'gray',
    actionTitle: <Icon.Add />,
    actionLink: '/companies/new',
    nav: <div class="block-vertical-padding">
      <Header />
      {notificationForm}
      {/*<Search url='/companies/search/' query={query} placeholder="Search users" />*/}
    </div>,
  }), [userId, notificationForm]);

  usePrecache((cache) => users.forEach((user) => {
    cache[`/users/${user.id}`] = { user };
  }), [users]);


  return <Page id="users" navigation={navigation}>
    <select onChange={(e) => route('/admin/users/?type=' + e.target.value)}>
      <option value="">All users</option>
      <option value="true">Approved users</option>
      <option value="false">Unapproved users</option>
    </select>
    <br />
    <Grid 
      type="list"
      headers={[
        {name: 'Link', type: 'link'},
        {name: 'Name'},
        {name: 'Status', type: 'icon'},
        {name: 'Email', type: 'text'},
        {name: 'Action', type: 'action'},
      ]} 
      rows={users.map((user) => [
        `/admin/users/${user.id}`,
        user.name,
        user.verifiedAt ? <Avatar user={user} /> : <a onClick={onApprove} href={`/users/${user.id}/approve`} method="put" confirm={`Are you sure to approve ${user.name} (${user.email})?`} class={style.approve}><Icon.Checkmark /></a>,
        [
          <span class="small gray ellipsis">{user.email}</span>,
          user.answers && <dl>
            {user.answers.areas && [
              <dt>Interested in</dt>,
              <dd class="">{user.answers.areas.map((area) => [area, <br />])}</dd>
            ]}
            {user.answers.areas && [
              <dt>Investing?</dt>,
              <dd class="">{user.answers.platform || user.answers.investingExcuse || user.answers.investing}</dd>
            ]}
          </dl>
        ],
        <Icon.ChevronRight class="forward icon" />,
        {class: userId == user.id ? 'selected' : ''}
      ])} />

    <Paginator url={`/admin/users/?type=${type}&ids=${(ids || '')}`} currentPage={currentPage} lastPage={lastPage} />
  </Page>
}