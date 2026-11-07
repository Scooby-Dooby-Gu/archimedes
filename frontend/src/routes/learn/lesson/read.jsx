import style from './style.module.scss';
import { PreactHTMLConverter } from '/lib/html';
import { useContext, useState, useRef, useEffect, loadScript, useScript } from '/lib/hooks/index.jsx'
import { createContext } from 'preact'
import { memo } from 'preact/compat' 
import { Embed, Youtube, Icon, Avatar, GlossaryDefinition, LocalizedDate, User, Button, Question } from '/components/index.jsx'
import { filterLessons, findSubmission, isLessonComplete } from '/lib/data';
import { markHTML } from '/lib/mark';
import { removeTimezone } from '/lib/helpers';
import Figure from '../../../components/figure';
const LessonContext = createContext({});

function enrichDefinitionMicrodata(html = '') {
  if (html.isPlaceholder) return html;
  return html.replace(/<figure ([^>]*type="definition"[^>]*)>(.*?)<\/figure>/gi, (m, attr, body) => {
    const content = body.replace(/(<figcaption[^>]+)>(.*?)(<\/figcaption>)/gi, (m, tag, body, close) => {
      return `${tag} itemprop="name"><span class="what-is">What is</span> ${body.replace(/<[^>]+>/g, '').split('/')[0].replace('*', '')}<span class="what-is">?</span>${close}`
    }).replace(/<div ([^>]*card-content[^>]*)>(.*?)<\/div>[\s]*$/, (m, attr, body) => {
      return `<div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
        <div ${attr} itemprop="text">${body}</div>
      </div>`
    });
    return `<figure ${attr} itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      ${content}
    </figure>`
  })
}


const QuestionWithIndex = (props) => {
  const questionIndex = parseInt(props['data-number']);
  const {user, discussion, lesson, submission, callbacks} = useContext(LessonContext);
  if (!user) return;
  const question = lesson.questions[questionIndex];
  if (!question) return;
  const answer = submission && 
                  submission.data && 
                  submission.data[questionIndex] && 
                  Object.keys(submission.data[questionIndex]).length > 0 
                    ? submission.data[questionIndex]
                    : null;
  const status = answer == null ? null : callbacks.isQuestionCorrect(questionIndex, submission) ? 'correct' : 'incorrect';


  return <Question {...question} status={status} onAnswer={(answer) => callbacks.onQuestionAnswered(answer, questionIndex)} className={status} index={questionIndex} answer={answer} lesson={lesson} discussion={discussion} name={`answer`} />
}

const converter = PreactHTMLConverter();
converter.registerComponent('question', QuestionWithIndex);
converter.registerComponent('oembed', Embed);
converter.registerComponent('figure', Figure);
converter.registerComponent('youtube', Youtube);

const convert = (text) => converter.convert(text
  .replace(/(<mark[^>]*question[^>]*>)/gi, '$1<span class="offset"></span>')
  .replace(/<iframe([^>]*youtu.?be.*?)\/iframe>/gi, '<youtube$1/youtube>')
  .replace(/<section([^>]*question[^>]*>.*?)<\/section>/g, '<question$1</question>'))

export function markLessonLinks (element, url, submissions, lessonId) {
  const lessonLinks = element.querySelectorAll('a[href*="/lessons/"]');
  for (var i = 0; i < lessonLinks.length; i++) {
    var link = lessonLinks[i];
    if (link && link.hostname === location.hostname) {
      const m = link.getAttribute('href').match(/\/lessons\/([^\/?#]+)/);
      if (m && m[1] != lessonId && !link.closest('[class*="question"]')) {
        if (!link.closest('[class*="card-url"],[class*="card-cta"]')) {
          link.classList.add('lesson');
          if (findSubmission(submissions, 'lesson', m[1], true)) {
            link.classList.add('passed');
          }
        }
        link.setAttribute('href', link.pathname.split('?')[0] + '?from=' + encodeURIComponent(url));
      }
    }
  }
}

export function markTimestampLinks (element, courseId, lessonId, submissions) {
  const timestampLinks = element.querySelectorAll('a[href*=":"][href*="#"]');
  for (var i = 0; i < timestampLinks.length; i++) {
    var link = timestampLinks[i];
    if (link.hash.match(/#\d/)) {
      link.classList.add('timestamp');
    }
  }
}

export function Read({questionsLeft, goalId, ambitionId, courseId, questionsTotal, user, submissions, discussion, course, lesson, callbacks, glossary, submission, company, hasQuiz, isLessonComplete, hint}) {
  const elementRef = useRef()
  const prefix = location.href.includes('/terms/') ? '/courses/terms' : goalId ? `/ambitions/${ambitionId}/goals/${goalId}` : courseId ? `/courses/${courseId}` : '';
  useEffect(() => {
    markLessonLinks(elementRef.current, `${prefix}/lessons/${lesson.id}/`, submissions, lesson.id)
    markTimestampLinks(elementRef.current, course.id, lesson.id)
  }, [lesson.id, submissions])

  var instances = [];
  const [currentTermElement, setCurrentTermElement] = useState();


  function processHTML(html) {
    if (html && html.indexOf && html.indexOf('█') > -1) return html;
    var filteredGlossary = {};
    for (var term in glossary) {
      if (glossary[term].some((t) => t.lesson.id == lesson.id)) continue;
      filteredGlossary[term] = glossary[term];
    }
    return convert(markHTML(html, filteredGlossary, instances))
  }
  
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
      const iframe = e.target.closest('.page').querySelector('iframe[player]');
      if (iframe && iframe.player) {
        iframe.player.seekToTimestamp(link.hash.replace('#', ''));
        const notch = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
        
        iframe.scrollIntoViewCustom({
          block: 'start',
          behavior: 'smooth',
          offsetTop: - 70 - notch,
        })
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const embeddedQuestions = (lesson.contentHtml && lesson.contentHtml.match(/<section([^>]*question[^>]*>.*?)<\/section>/g) || []).length;
  const formatTermUrl = (url) => {
    return `${prefix}/lessons/${url.split('/lessons/')[1]}`
  }

  
  return <div class={style.read}>
    <LessonContext.Provider key="lesson" value={{user, lesson, callbacks, submission, discussion}}>
      <GlossaryDefinition.fromElement from={location.pathname} onClose={() => setCurrentTermElement()} element={currentTermElement} glossary={glossary} formatUrl={formatTermUrl} />
      <p class={`gray ${style.description}`}>
        {lesson.publishedAt && !lesson.author && <aside class={`${style.calendar} ${style.date}`}>
          <LocalizedDate date={removeTimezone(lesson.publishedAt)} />
        </aside>}
        {lesson.description}
      </p>
      <div ref={elementRef} onClick={onClick}>
        {(lesson.author && !lesson.author.isPlaceholder) && <section class={`${style.meta} content article information`} key="author">
          {lesson.publishedAt && <span class={style.date}>
            <LocalizedDate date={removeTimezone(lesson.publishedAt)} />
          </span>}
          {<Avatar user={lesson.author} />}
          {<div class={style.user}>By <User avatar={false} user={lesson.author} /></div>}
          { processHTML(lesson.author.bioHtml)}
        </section>}
        <section class={`content article ${hint ? 'hint-' + hint : ''}`} key="content">
          {processHTML(enrichDefinitionMicrodata(lesson.contentHtml))}
        </section>
        {user && hasQuiz && embeddedQuestions < questionsTotal && !lesson.isPlaceholder && <section class={`content article`}>
          {lesson.questions.map((q, i) => {
            return i >= embeddedQuestions && <QuestionWithIndex data-number={i} />
          })}
        </section>}
      </div>
    </LessonContext.Provider>
  </div>;
}

export default memo(Read)