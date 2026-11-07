import Footer from './footer'
import style from './style.module.scss';
import { useStore } from '/lib/hooks/index.jsx'
import { Column } from '/components/index.jsx';

export default function MobileLayout({children, ...props}) {
  const user = useStore('auth.user');
  const layout = useStore('app.layout');

  return [
    <main {...props} class={style.main}>
      <Column id="column-fullscreen">
        {children}
      </Column>
    </main>,
    layout !== 'minimal' && user && <Footer class={style.footer}></Footer>,
    layout !== 'minimal' && !user && <Footer.Guest class={style.footer}></Footer.Guest>,
  ]
}