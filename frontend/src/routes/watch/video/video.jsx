import style from './style.module.scss';
import QuestionComponent from './question';


import { markHTML } from '/lib/mark';
import { markLessonLinks, markTimestampLinks } from '../../learn/lesson/read';
import { useEffect, useRef, useState } from '/lib/hooks/index.jsx';
import * as formatters from '/lib/formatters';
import { GlossaryDefinition, Avatar, User, LocalizedDate, Button } from '/components/index.jsx';
import { playFirstVideoAt } from '/lib/interactions';
import { removeTimezone } from '/lib/helpers';
import { Embed, Youtube, Icon, Figure } from '../../../components';
import { getSlug } from '/lib/slugs';




export default function Video ({video, onlyThumbnail, className, hideName, hideContent, maxQuestions=Infinity, glossary, canManage, children, isQuestionListStatic, submissions}) {
  const elementRef = useRef()

  const [currentTermElement, setCurrentTermElement] = useState();
  
  useEffect(() => {
    markLessonLinks(elementRef.current, `/videos/${getSlug(video)}`, submissions)
    markTimestampLinks(elementRef.current.parentNode)
  }, [video, submissions])

  const onClick = (e) => {
    if (e.target.closest('mark[term]')) {
      setCurrentTermElement(e.target);
      const notch = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
      
      e.target.scrollIntoViewCustom({
        block: 'start',
        behavior: 'smooth',
        offsetTop: - 70 - notch,
      })
    } else if (e.target.closest('a.timestamp')) {
      const link = e.target.closest('a.timestamp');
      playFirstVideoAt(e.target.closest('.page'), link.hash.replace('#', ''))
      e.preventDefault();
      e.stopPropagation();
    }
  }


  var instances = [];
  function processHTML(html, options = {}) {
    if (html && html.indexOf && html.indexOf('█') > -1) return html;
    if (options.glossary !== false) {
      var filteredGlossary = {};
      for (var term in glossary) {
          filteredGlossary[term] = glossary[term];
      }
    }
    return formatters.html(markHTML(html, filteredGlossary, instances))
  }
  const [isExpanded, setIsExpanded] = useState(video.questions.length < maxQuestions);

  const questionLimit = isExpanded ? Infinity : maxQuestions

  const questions = video.questions.slice().sort((a, b) => {
    return (isQuestionListStatic ? b.isImportant - a.isImportant : 0)
      || ((a.seconds == null ? Infinity : a.seconds) - (b.seconds == null ? Infinity : b.seconds))
      || (b.id - a.id)
  }).slice(0, questionLimit);
  

  return <>

    <div class={style.meta}>
      {video.experts.length > 0 && 
      <ul class={style.experts}>
        {video.experts.map((expert) => <li>
          <Avatar user={expert} />
          {expert && <div class={style.user}>
            <div class={`${style.bio} chapter`}>
              <User avatar={false} user={expert} />
     
              {video.experts.length == 1 ? processHTML(expert.bioHtml || '<p>Archimedes expert</p>', {glossary: false}) : null}
            </div>
          </div>}
        </li>)}
      </ul>}
      {(video.publishedAt || video.scheduledAt) && <div class={style.calendar}>
        <LocalizedDate date={removeTimezone(video.publishedAt || video.scheduledAt)} />
      </div>}
    </div>

    <section onClick={onClick} ref={elementRef} class={`${style.video} ${className} ${video.image && style.withImage}`}>
      {!hideName && <h1 class={style.title}>
        {video.name}
      </h1>}
    <GlossaryDefinition.fromElement onClose={() => setCurrentTermElement()} element={currentTermElement} glossary={glossary} />
      
      {video.summaryHtml && <section class="chapter article">
        {processHTML(video.summaryHtml)}
      </section>}

      {video.contentHtml && !hideContent && <section class="chapter article">
        {processHTML(video.contentHtml)}
      </section>}
    </section>

    <ul onClick={onClick} class={style.questions}>
      {questions.map((question) => 
        <QuestionComponent 
        video={video} 
        question={question} 
        isEditable={canManage} 
        transcriptionHtml={processHTML(question.transcriptionHtml)} 
        isExpandable={!isQuestionListStatic} />)}
    </ul>

    {!isExpanded && video.questions.length > maxQuestions && <Button class={style.more} onClick={() => setIsExpanded(true)}><Icon.Down /> {video.questions.length - maxQuestions} more topics</Button>}

    {video.footerHtml && !hideContent && <section class="chapter article footer">
      {processHTML(video.footerHtml)}
    </section>}

    {children}


  </>
}

