import { Icon, Page, Button } from '/components/index.jsx';
import { useMemo, useStore } from "/lib/hooks";
import style from './style.module.scss';

export default function GetApp({from = ''}) {
  const navigation = useMemo(() => ({
    menuHidden: true,
    title: 'Hooray!',
    titleNode: <Icon.LogosArchimedes style="width: auto; height: auto;" />,
  }), []);

  return <Page class={`${style.page} centered`} navigation={navigation}>
    <h1>Just one last step</h1>
    <br />
    <p>We're almost at the finish line! Download <strong>Archimedes Finance</strong> in the App store or Play store on your mobile device today to start investing confidently.</p>

    <div class={style.buttons}>
      <a href="https://play.google.com/store/apps/details?id=com.getmedes.app.twa"><img src="/assets/images/buttons/android.png"/></a>
      <a href="https://apps.apple.com/us/app/archimedes-finance/id1498817872?mt=8"><img src="/assets/images/buttons/apple.png" /></a>
    </div>

    
  </Page>
}