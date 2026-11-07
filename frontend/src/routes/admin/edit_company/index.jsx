import { useMemo, useAsyncLink, useAsyncForm, useFetchedData, useFormData, useCallback, useStore } from '/lib/hooks/index.jsx';

import { Grid, Icon, Form, FormField, Button, Page } from '/components/index.jsx';
import update from '/lib/immutability';

export default function EditCompany({ companyId = '' }) {

  const [companyData] = useFetchedData(companyId ? `/companies/${companyId}` : null);

  const [{ company = {} }, updateFormData, formRef] = useFormData(companyData);

  const [formSubmissionRequest, onSubmit] = useAsyncForm(({data: { company: companyResult }}) => {
    dispatch('fetchUser');
    dispatch('setCompany', companyResult)
    route(location.pathname.includes('/rankings') ? '/rankings/leaderboard' : `/companies/${companyResult.id}?success`)
  });

  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    dispatch('fetchUser');
    route(location.pathname.includes('/rankings') ? '/rankings/leaderboard' : `/companies`)
  });

  const user = useStore('auth.user');

  const subdomain = company.name && company.name.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-') || undefined;

  const match1 = company.plan401k && 
      company.plan401k.companyMatch && 
      company.plan401k.companyMatch[0] && 
      company.plan401k.companyMatch[0].enabled;

  const match2 = match1 &&
      company.plan401k.companyMatch[1] && 
      company.plan401k.companyMatch[1].enabled;

  const onWildcardAdd = useCallback((e) => {
    updateFormData((data) => update(data, {
      company: {
        wildcards: (w) => w ? w.concat('') : ['']
      }
    }));
    e.preventDefault()
  }, [])


  const navigation = useMemo(() => ({
    title: companyId ? 'Edit' : 'New Company',
    parentAlwaysShow: true,
    parentTitle: 'Cancel',
    parentCache: company,
    parentLink: location.pathname.includes('/rankings') ? '/rankings' : companyId ? `/companies/${companyId}` : '/companies',
    actionHandler: () => onSubmit(formRef.current),
    actionRequest: formSubmissionRequest,
    actionTitle: companyId ? 'Save' : 'Create'
  }), [company, companyId, formSubmissionRequest, formRef.current])

  const wildcards = company.wildcards && !company.wildcards.isPlaceholder ? company.wildcards : []
  return <Page id="edit_company" navigation={navigation}>
    <Form method="post" action={`/companies/${companyId}`} formRef={formRef} onSubmit={onSubmit} encType="multipart/form-data">
      <fieldset>
        {user.role == 'admin' && false && <legend>General information</legend>}
        <FormField name="company[name]" label="Name of a group" required />
        <FormField name="company[description]" placeholder="Description of a company" type="textarea" required />
        <FormField label="Website" name="company[url]" placeholder="official-website.com"/ >
        <FormField name="company[image]" type="file" label="Logo" />
      </fieldset>
      <br />
      {user.role === 'admin' && [
        <fieldset>
          <legend>Internal settings (Admin-only)</legend>
          <FormField name="company[status]" label="Enabled?" type="checkbox" value="enabled" />

          <FormField label="Subdomain" placeholder={subdomain || 'subdomain'} id="company[subdomain]" name="company[subdomain]" required />

          {wildcards.map((w, index) =>
            <FormField name="company[wildcards][]" label={index === 0 ? 'Corporate email domain' : null} placeholder="email-domain.com" value={w} before="everybody@" />
          )}
          {wildcards.every((w) => w.trim().length) &&
            <Button class="compact" onClick={onWildcardAdd}>Add another domain</Button>}

        </fieldset>,
        <br />,
        <fieldset>
          <legend>401k information</legend>
          <FormField name="company[plan401k][benefitsProvider]" placeholder="Benefits provider" required />
          <FormField name="company[plan401k][benefitsProviderUrl]" placeholder="Benefits provider portal url" required />

          <br />
          <FormField name="company[plan401k][contactName]" placeholder="Name of Point of contact for question" required />
          <FormField name="company[plan401k][contactEmail]" placeholder="Email of Point of contact for question" required />

          <br />
          <br />
          <FormField name="company[plan401k][companyMatch][0][enabled]" type="checkbox" label="Company match" />
          {match1 && <div class="row space-between">
            <div class="field row number">
              <input step="0.01" name="company[plan401k][companyMatch][0][basis]" type="number" placeholder="Basis" required />
              :1
            </div>
            <div class="field row number">
              up to&nbsp;
              <input step="0.01" name="company[plan401k][companyMatch][0][limit]" type="number" placeholder="Limit" required />
              %
            </div>
          </div>}
          <br />
          <br />
          {match1 && <FormField name="company[plan401k][companyMatch][1][enabled]" type="checkbox" label="Additional match" />
          }
          {match2 && <div class="row space-between">
            <div class="field row number">
              <input step="0.01" name="company[plan401k][companyMatch][1][basis]" type="number" placeholder="Basis" required />
              :1
            </div>
            <div class="field row number">
              up to&nbsp;
              <input step="0.01" name="company[plan401k][companyMatch][1][limit]" type="number" placeholder="Limit" required />
              %
            </div>
          </div>}
        </fieldset>
      ]}
      
      
      <fieldset>
        <Grid 
          type="list" 
          headers={[
            {name: 'Link', type: 'link'},
            {name: 'Name'},
            {name: 'Prompt', type: 'action'},
          ]}
          rows={companyId ? [
            [
              '/rankings/leaderboard/invites?companyId=' +companyId + '&from=' + encodeURIComponent(location.pathname),
              'Invite people',
              <Icon.ChevronRight class="forward icon" />,
            ],
            [
              `/companies/${companyId}`,
              "Delete group",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to delete this group? All discussions will be deleted, and all members will be turned into regular users", method: "delete", onClick: onDeleteAction}
            ]
          ] : []} />
      </fieldset>
    </Form>
  </Page>
}