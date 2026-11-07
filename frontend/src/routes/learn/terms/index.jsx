import { Page } from '/components/index.jsx';
import { useMemo, useStore, useState } from '/lib/hooks/index.jsx'
import style from './style.module.scss';
import { Icon, Grid, GlossaryDefinition } from '/components/index.jsx';


export function MiniGlossaryDefinition({onClose, from, hidden, content, url, lesson, top, left}) {
    return [
        <div class={style.bar}>Introduced in <a href={`/courses/terms/lessons/${url.split('/lessons/')[1]}`}>{lesson.name}</a>:</div>,
        <div class={`article ${style.wrapper}`} style={{top: top}}>
            <div dangerouslySetInnerHTML={{__html: content.replace(/<h3>.*?<\/h3>/i, '')}}>
            </div>
        </div>
    ]
}

export default function Terms({  }) {
  const user = useStore('data.user');
  const glossary = useStore('data.glossary');

  const navigation = useMemo(() => ({
    headerTheme: 'blue',
    title: "Glossary",
    parentLink: '/courses',
  }), [])

  const [openTerms, setOpenTerms] = useState([]); 



  return useMemo(() => <Page id="terms" class={style.tags} navigation={navigation}>
      <Grid 
        type='list'
        class={style.lessons}
        headers={[
        {name: "Link", type: 'link'},
        {name: "Name"},
        {name: "Action", type: 'action'},
        ]} rows={Object.keys(glossary)
        .sort()
        .filter((name, index) => glossary[name].filter((d) => !d.alias).length > 0)
        .map((name, index) => {
            const definitions = glossary[name].filter((d) => !d.alias)
            return [
                openTerms.includes(name) ? null : '#',
                [
                    <h3 class="larger">{name.replace(/\s*\*/, '')}</h3>,
                    openTerms.includes(name) && definitions.map((term) => {
                        return <MiniGlossaryDefinition from={location.pathname} {...term} />
                    })
                ],
                openTerms.includes(name) ? null : <Icon.Down />,
                {
                    id: 'term-' + name,
                    class: openTerms.includes(name) && style.open,
                    onClick: (e) => {
                        if (e.target.closest('a[href*="#"')) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!openTerms.includes(name)) {
                                setOpenTerms(openTerms.concat(name))
                            }
                        }
                    }
                }
            ]
        })} />
  </Page>, [openTerms, glossary, navigation])
}