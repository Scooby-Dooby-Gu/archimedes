import { useFetchedData, usePrecache, useMemo } from '/lib/hooks/index.jsx'
import style from './style.module.scss';
import { Search, Grid, Page, Icon } from '/components/index.jsx';

export default function Companies({ success, query, companyId }) {
  const [companies, companiesRequest, companiesReload] = useFetchedData('/companies/', { invalidate: success });

  const navigation = useMemo(() => ({
    scrollSelector: `a[href$="/companies/${companyId}"]`,
    title: 'All companies',
    pageTheme: 'gray',
    actionTitle: <Icon.Add />,
    actionLink: '/companies/new',
    nav: <div class="block-vertical-padding">
      <Grid 
        type="tabs" 
        class="main" 
        headers={[
          {name: 'Link', type: 'link'},
          {name: 'Name'},
          {name: 'Action', type: 'right'},
        ]} 
        rows={[[
          "/admin/users",
          "Users",
          null,
          {}
        ], [
          "/companies",
          "Companies",
          <a href="/companies/new"><Icon.Add /></a>,
          {class: 'selected'}
        ]]} />
      <Search url='/companies/search/' query={query} placeholder="Search companies" />
    </div>,
  }), [companyId]);

  usePrecache((cache) => companies.forEach((company) => {
    cache[`/companies/${company.id}`] = { company };
  }), [companies]);

  return <Page id="companies" navigation={navigation}>
    <Grid 
      type="list"
      headers={[
        {name: 'Link', type: 'link'},
        {name: 'Name'},
        {name: 'Status', type: 'icon'},
        {name: 'Website', type: 'text'},
        {name: 'Users', type: 'right'},
        {name: 'Action', type: 'action'},
      ]} 
      rows={companies.map((company) => [
        `/companies/${company.id}`,
        company.name,
        <span class={`status ${company.status}`} />,
        <span class="small gray">{company.url}</span>,
        <a class={`${style.users_link} nowrap`} href={`/companies/${company.id}/users`}>{company.userCount} users</a>
        ,
        <Icon.ChevronRight class="forward icon" />,
        {class: companyId == company.id ? 'selected' : ''}
      ])} />
  </Page>
}