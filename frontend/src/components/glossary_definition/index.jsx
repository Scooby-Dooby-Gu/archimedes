import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Icon } from '/components/index.jsx';
import style from './style.module.scss';
export default function GlossaryDefinition({onClose, formatUrl, from, hidden, top, left, term}) {

    const html = term.map(({ content, url, lesson } ) => {
        const formattedUrl = formatUrl ? formatUrl(url) : url;
        const finalUrl = from ? `${formattedUrl}?from=${encodeURIComponent(from)}` : formattedUrl;
        return content.replace(/(.*)</, '$1' + ` <a href="${finalUrl}" class=${style.link}>${lesson.name}</a></`);
    });

    return <div hidden={hidden} class={`article ${style.wrapper}`} style={{top: top}}>
        <Icon.Close onClick={onClose} class={style.close} />
        <h3><Icon.SymbolsCharacterBookClosedFill /> {term[0].canonical}</h3>
        <div dangerouslySetInnerHTML={{__html: html}}>
        </div>
        <div class={style.tip} style={{left: left}}></div>
    </div>
}


GlossaryDefinition.fromElement = function({element, glossary, onClose, from, formatUrl}) {

    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        setHidden(!element);
    }, [element])
    /*useEffect(() => {
        const onScroll = (e) => {
            onClose()
        };
        document.addEventListener('scroll', onScroll, {passive: true})
        return () => {
            document.removeEventListener('scroll', onScroll, {passive: true})
        }
    }, [])*/
    
    const elementRef = useRef()
    if (element) {
        elementRef.current = element;
    }
    if (!elementRef.current) return;


    const term = glossary[elementRef.current.getAttribute('term')];
    if (!term) return;
    var top = 0;
    var left = 0;
    for (var p = elementRef.current; p;) {
        top += p.offsetTop;
        left += p.offsetLeft;
        p = p.offsetParent
        if (p && p.classList && !p.classList.contains('card')) break;
    }
    return <div class={style.holder}>
        <GlossaryDefinition formatUrl={formatUrl} hidden={hidden} onClose={onClose} term={term} from={from} top={top} left={Math.max(40, left)} />
    </div>
}