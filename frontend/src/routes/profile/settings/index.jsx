import { useStore, useEffect, useAsyncLink, useFetchedData, useMemo, useAsyncForm, useFormData, useState, useCallback } from '/lib/hooks/index.jsx';
import { Button, Form, FormField, Page, Avatar, Grid, Icon, Editor } from '/components/index.jsx';

import style from './style.module.scss';

export default function Settings ({section, success, userId}) {
  const {auth: {user, canManage }, notifications} = useStore();
  const [personData, personRequest, reloadPerson] = useFetchedData(`/users/${userId}`, { invalidate: success });
  if (!user) return;
  
  const person = personData.user;
  const [request, onSubmit] = useAsyncForm((response) => {
    if (response.data.user.id === user.id) {
      dispatch({type: 'fetchUser'})
      dispatch({type: 'login', user: response.data.user, redirect: `/users/${person.id}?success`});
    } else {
      route(`/users/${person.id}?success`)
    }
  })

  const [formData, updateFormData, formRef] = useFormData(personData)


  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    if (userId === person.id)
      route(`/signout`)
    else
      route('/?success')
  });


  const [snapshotRequest, onSnapshot] = useAsyncLink(() => {
    
  });
  const [userSigninRequest, onUserSignin] = useAsyncLink(({data: {user}}) => {
    location.href = '?api_key=' + user.apiKey;
  });


  const [restoreRequest, onRestore] = useAsyncLink(() => {
    clearLocalStorage();
  });

  const [deleteSubmissionsActionRequest, onDeleteSubmissionsAction] = useAsyncLink(() => {
    dispatch('setOnboarded', false)
    dispatch({type: 'fetchSubmissions'})
    route('/')
  });
  
  const navigation = useMemo(() => ({
    title: 'Settings',
    scrollSelector: '*',
    headerTheme: 'white',
    parentCache: person,
    parentLink: `/users/${person.id}`,
    parentTitle: 'Cancel',
    actionTitle: 'Save',
    actionRequest: request,
    actionHandler: () => {
      onSubmit(formRef.current);
    },
    requests: [snapshotRequest, restoreRequest, deleteActionRequest, deleteSubmissionsActionRequest]
  }), [person, personRequest, request.loading, snapshotRequest.error, restoreRequest.error, deleteActionRequest.error, deleteSubmissionsActionRequest.error])


  const readURL = file => {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = e => res(e.target.result);
        reader.onerror = e => rej(e);
        reader.readAsDataURL(file);
    });
  };

  const [attachedFile, setAttachedFile] = useState(false);

  useEffect(async () => {
    var img = document.querySelector('#avatar')
    if (attachedFile) {
      img.src = await readURL(attachedFile);
      img.removeAttribute('srcset');
    } else {
      img.src = person.avatar || '/assets/sample/avatar.png'
    }
  }, [attachedFile, person.avatar])


  const onIntroReset = (e) => {
    e.preventDefault()
    e.stopPropagation()
    localStorage.removeItem('introduced');
    route('/')
  }

  const onPushEnable = useCallback((e) => {
    if (notifications.status !== 'authorized' || !notifications.token) {
      dispatch('requestNotificationPermissionIfPossible')
    }
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [notifications.status])

  useEffect(() => {
    var app = document.querySelector('#app');
    const onClick = (e) => {
      if (attachedFile && e.target.closest('a[href]') && !e.target.closest('[index="action"]')) {
        if (!confirm('You need to hit "Save" to upload the chosen photo. Are you sure to leave the page without saving?')) {
          e.preventDefault()
          e.stopPropagation();
        }
      }
    };
    app.addEventListener('click', onClick)
    return () => {
      app.removeEventListener('click', onClick)
    }
  })

  const isMe = person.id == user.id;

  const wrapper = localStorage.wrapper ? '?wrapper=' + localStorage.wrapper : '';
  const settings = person.settings || {};
  const role = person.id == user.id ? person.role : formData.user.role;
  return <Page id="settings" class={`white ${style.settings}`} navigation={navigation}>
    <Form action={`/users/${person.id}/`} onSubmit={onSubmit} method="patch" encType="multipart/form-data" formRef={formRef}>
      <label class={style.avatar}>
        <Avatar user={person} class="huge" id="avatar" award={false} />
        <input type="file" accept="image/*"  name="user[avatar]" onInput={(e) => setAttachedFile(e.target.files[0])} />
        <Icon.Checkmark stroke="black" hidden={!attachedFile} />
      </label>

      <fieldset>
        <legend>General information</legend>
        <FormField type="text" name="user[name]" label="Full name" required />
        <FormField type="email" name="user[email]" label="Email" readOnly required />
        <FormField type="tel" pattern="\+?[0-9() -]+" name="user[phoneNumber]" label="Phone number" />
        <FormField type="date"  name="user[bornAt]" label="Date of birth" autocomplete="off"   />
        {canManage && person.id !== user.id && <FormField type="select" name="user[role]" label="Role">
          <select name="user[role]">
            <option value="user">User</option>  
            {/* <option value="visitor">Visitor</option>   */}
            <option value="manager">Manager</option>  
            <option value="writer">Writer</option>
            {/*<option value="moderator">Moderator</option>  */}
            <option value="admin">Admin</option>  
            <option value="demo">Demo</option>  
          </select>  
        </FormField>}
        {(role == 'admin' || role == 'writer') && 
          <FormField label="Bio and links" type="html">
            <Editor rows="5" name="user[bioHtml]" placeholder="Short author biography (2-3 lines)"></Editor>
          </FormField>}
      </fieldset>

      {canManage && <fieldset>
        <legend>Settings</legend>
        {canManage && <FormField type="select" label="App environment" autocomplete="off" >
          <select onChange={(e) => location.href = e.target.value}>
            <option selected={import.meta.env.NODE_ENV==='production'} value={`https://app.getmedes.com/${wrapper}`}>Production</option>
            <option selected={import.meta.env.NODE_ENV==='staging'} value={`https://staging.getmedes.com/${wrapper}`}>Staging</option>
            <option selected={import.meta.env.NODE_ENV==='development' || import.meta.env.NODE_ENV==='qa'} value={`http://192.168.1.100:8080/${wrapper}`}>Development</option>
          </select>
        </FormField>}
      </fieldset>}
      {/*<fieldset>
        <legend>Notification settings</legend>
        <FormField 
          type="checkbox"
          name="user[settings][sendNotifications]" 
          checked={notifications.status === 'authorized' ? true : false}
          disabled={notifications.status === 'authorized'}
          onClick={(e) => {
            if (notifications.status !== 'authorized') {
              onPushEnable()
            }
            e.preventDefault();
          }} label="Send me push notifications" />
        <FormField type="checkbox" name="user[settings][sendEmails]" default="off" label="Send me email notifications" />
      </fieldset>*/}

      <fieldset>
        <legend hidden>Actions</legend>
        <Grid 
          type="list" 
          headers={[
            {name: 'Link', type: 'link'},
            {name: 'Name'},
            {name: 'Prompt', type: 'action'},
          ]}
          rows={[].concat(
            isMe && notifications.status !== 'authorized' ? [[
              `/`,
              <strong>Enable push notifications</strong>,
              <Icon.ChevronRight class="forward icon" />,
              {onClick: onPushEnable}
            ]] : [],
            [[
              `/users/${person.id}/settings/password/edit`,
              "Change password",
              <Icon.ChevronRight class="forward icon" />,
              {class: section === 'password' ? 'selected' : null}
            ]],
            isMe ? [[
              `/signout`,
              "Sign out",
              <Icon.ChevronRight class="forward icon" />
            ]] : [],
            isMe ? [[
              `/games/paper-chase/reset`,
              "Reset game",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', onClick: (e) => {
                const seed = user.role === 'admin' ? prompt("Are you sure to reset game state? Enter seed for the game (integer)", Math.floor(Math.random() * 1000)) : Math.floor(Math.random() * 1000);
                if (seed == null) {
                  e.preventDefault();
                  e.stopPropagation();
                } else {
                  if (isNaN(parseInt(seed))) {
                    alert('Seed must be a number!')
                    e.preventDefault();
                    e.stopPropagation();
                  } else {
                    e.target.href = '/games/paper-chase/reset?seed=' + seed
                  }
                }
              }}
            ]] : [],
            isMe && user.role != 'user' ? [[
              `/users/${userId}/submissions`,
              "Reset passed lessons",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to reset lesson progress?", method: "delete", onClick: (e) => {
                if (prompt('Are you sure to reset learning progress? Type RESET LESSONS below.') == 'RESET LESSONS') {
                  onDeleteSubmissionsAction(e)
                }
                e.preventDefault();
                e.stopPropagation();
              }}
            ]] : []
          )} />

      </fieldset>
      {canManage && <fieldset>
        <legend>Staff</legend>
        <Grid 
          type="list" 
          headers={[
            {name: 'Link', type: 'link'},
            {name: 'Name'},
            {name: 'Prompt', type: 'action'},
          ]}
          rows={[].concat(
            [[
              `/admin/users`,
              "Admin page",
              <Icon.Admin class="forward icon" />
            ]],
            [[
              `/users/${userId}/signin`,
              "Sign in as this user",
              <Icon.ChevronRight class="forward icon" />,
              { method: 'get', onClick: onUserSignin }
            ]],
            [[
              `/users/${userId}`,
              "Delete user",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to delete this user? All their discussions and submissions will be deleted too!", method: "delete", onClick: onDeleteAction}
            ]]
          )} />
      </fieldset>}
      {(canManage || user.email.indexOf('+demo') > -1) && <fieldset>
        <legend>Demo</legend>
        <Grid 
          type="list" 
          headers={[
            {name: 'Link', type: 'link'},
            {name: 'Name'},
            {name: 'Prompt', type: 'action'},
          ]}
          rows={[].concat(
            [[
              `/users/${userId}/snapshots`,
              "Take snapshot",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to overwrite snapshot?", method: "post", onClick: onSnapshot}
            ]],
            [[
              `/users/${userId}/snapshots/restore`,
              "Restore snapshot",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to restore snapshot?", method: "post", onClick: onRestore}
            ]],
          )} />

      </fieldset>}
      {canManage && <p>Version: {import.meta.env.SOURCE_VERSION}</p>}
    </Form>
  </Page>
}