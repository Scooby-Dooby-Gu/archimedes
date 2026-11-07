import { Avatar, User, Img, Icon, Grid,  Page} from '/components/index.jsx';
import { useFetchedData, useState, useCallback, useMemo } from '/lib/hooks/index.jsx'
import style from './style.module.scss';

export default function ({companyId, section, userId}) {

  const [{company}, companyRequest, reloadCompany] = useFetchedData(
    `/companies/${companyId}`
  );
  
  const navigation = useMemo(() => ({
    title: company.name,
    parentTitle: 'Companies',
    parentLink: `/companies`,
    manageTitle: 'Edit',
    manageCache: company,
    manageType: 'company',
    manageLink: `/companies/${companyId}/edit`,
  }), [company])

  const [showDescription, setDescriptionVisibility] = useState(false);
  const [showUsers, setUsersVisibility] = useState(section == 'users');

  const [users, usersRequest, reloadUsers] = useFetchedData(
    `/companies/${companyId}/users`,
    { immediate: !!userId || showUsers}
  );
  const toggleUsersVisibility = useCallback(() => {
    if (usersRequest.initial) {
      reloadUsers();
    }
    setUsersVisibility((showUsers) => !showUsers)
  }, [])
  const toggleDescriptionVisibility = useCallback(() => {
    setDescriptionVisibility((showDescription) => !showDescription)
  }, [])

  return <Page id="company" navigation={navigation}>
    {company.image && <Img srcset={company.imageSizes} crossorigin={(company.image || '').match(/archimedes.*s3/) && 'anonymous'} src={company.image} class={style.logo} />}
    <dl class="dictionary">
      <dt>Name</dt>
      <dd>{company.name}</dd>
      <dt>Description</dt>
      <dd onClick={toggleDescriptionVisibility}>
        {!showDescription && <span class="ellipsis">{company.description}</span>}
          
        <a>
          <Icon name={showDescription ? 'up' : 'down'} class="smaller gray" />
        </a>
      </dd>
      {showDescription && <dd class="full-width">
        {company.description}
      </dd>}
      <dt>Status</dt>
      <dd><span class={`status ${company.status}`}></span>{company.status}</dd>
      <dt>Website</dt>
      <dd><a href={`http://${company.url}`}>{company.url}</a></dd>
      {company.userCount > 0 && [
        <dt>Users</dt>,
        <dd onClick={toggleUsersVisibility}>
          <a>
            {company.userCount} users 
            <Icon name={showUsers ? 'up' : 'down'} class="smaller gray" />
          </a>
        </dd>,
        showUsers && <dd class="full-width">
          <br />
          <Grid 
            type="list"
            headers={[
              {name: 'Link', type: 'link'},
              {name: 'Avatar', type: 'icon'},
              {name: 'Person', important: true},
              {name: 'Prompt', type: 'action'},
            ]} 
            rows={users.map((user) => [
              `/companies/${company.id}/users/${user.id}`,
              <Avatar user={user} />,
              user.name,
              <Icon.ChevronRight class="forward icon" />,
              {class: `${userId == user.id && 'selected'} ${company.managerIds.includes(user.id) && 'important'}`}
            ])} />
        </dd>
      ]}
      
      <dt>Email domains</dt>
      <dd>{company.wildcards && !company.wildcards.isPlaceholder &&  company.wildcards.map((w) => '@' + w).join(', ')}</dd>
    </dl>

    <br />
    <br />
    <Grid 
      type="list" 
      headers={[
        {name: 'Link', type: 'link'},
        {name: 'Name'},
        {name: 'Prompt', type: 'action'},
      ]}
      rows={[
        /*[
          `/rankings`,
          "See company scope",
          <Icon.ChevronRight class="forward icon" />,
          {class: 'dangerous', onClick: (e) => dispatch('setCompany', company)}
        ],*/
        [
          `/companies/${company.id}/invites/new`,
          "Invite people",
          <Icon.ChevronRight class="forward icon" />,
          {class: section === 'invites' ? 'selected' : ''}
        ],
        [
          ``,
          "Privacy Policy",
          <Icon.ChevronRight class="forward icon" />
        ]
      ]} />
  </Page>
}