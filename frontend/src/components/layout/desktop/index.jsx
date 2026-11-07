import Header from './header'
import { useStore } from '/lib/hooks/index.jsx'
import style from './style.module.scss';
import { Column } from '/components/index.jsx';

export default function DesktopLayout({children, ...props}) {
  const user = useStore('auth.user');
  const layout = useStore('app.layout');

  const panes = children.reduce(function(groups, child) {
    if (child) {
      const column = child.props.column || 'fulscreen';
      (groups[column] = groups[column] || []).push(child);
    }
    return groups;
  }, {});

  const routers = [];
  
  for (let property in panes) {
    routers.push(<Column id={`column-${property}`}> 
      {panes[property]}
    </Column>)
  }

  return <main {...props} class={style.main}>
    {layout !== 'minimal' && user && user.verifiedAt && <Header class={style.header} />}
    <div class={`${style.columns} columns`}>
      {routers}
    </div>
  </main>
}
