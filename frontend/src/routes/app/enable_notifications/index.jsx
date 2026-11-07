import { Icon, Page, Button } from '/components/index.jsx';
import { useMemo } from "/lib/hooks";
import style from './style.module.scss';

export default function GetApp({origin}) {
  const navigation = useMemo(() => ({
    menuHidden: true,
    parentLink: origin,
    title: 'Enabling notifications',
  }), [])

  return <Page navigation={navigation}>
    {localStorage.wrapper !== 'ios' && <ol class={style.directions}>
      <li>Tap the <strong>Settings</strong> icon on your home screen.</li>
      <li>Tap <strong>Notifications</strong>.</li>
      <li>Select <strong>Archimedes</strong> from the list of installed applications.</li>
      <li>Tap <strong>Show Notifications</strong>.</li>
    </ol>}
    {localStorage.wrapper === 'ios' && <ol class={style.directions}>
      <li>Tap the <strong>Settings</strong> icon on your home screen.</li>
      <li>Tap <strong>Notifications</strong>.</li>
      <li>Select <strong>Archimedes</strong> from the list of installed applications.</li>
      <li>Tap <strong>Allow Notifications</strong>.</li>
    </ol>}
  </Page>
}