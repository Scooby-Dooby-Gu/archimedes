import Embed from "./components/embed/";
import Youtube from "./components/youtube/";
import Figure from "./components/figure/";
import Icon from "./components/icon/";
import Question from "./components/question/";
import GlossaryDefinition from "./components/glossary_definition";
import { PreactHTMLConverter } from '/lib/html';
import { copyToClipboard } from '/lib/helpers';
import { markHTML } from '/lib/mark';
import { render } from "preact";
import { useFetchedData } from '/lib/hooks/request';
import { useRef, useEffect, useState, useMemo, useContext } from "preact/hooks";
import { generateGlossary } from '/lib/data';
import '/lib/scroll';
import '/lib/hacks'
import { createContext } from 'preact'
import { getLessonById } from "./lib/data";
import { Placeholder } from "./lib/request";

track('create', import.meta.env.GOOGLE_MARKETING_TRACKING_CODE, 'auto');

const LessonContext = createContext({});

const QuestionWithIndex = (props) => {
  const questionIndex = parseInt(props['data-number']);
  const {discussion, lesson, submission, callbacks}  = useContext(LessonContext);;
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
converter.registerComponent('oembed', Embed);
converter.registerComponent('figure', Figure);
converter.registerComponent('youtube', Youtube);
converter.registerComponent('question', QuestionWithIndex);

const convert = (text) => converter.convert(text
  .replace(/<iframe([^>]*youtu.?be.*?)\/iframe>/gi, '<youtube$1/youtube>')
  .replace(/<section([^>]*question[^>]*>.*?)<\/section>/g, '<question$1</question>'))

  
function findSubmission(id, isComplete) {
  if (localStorage['submission/' + id]) {
    const submission = JSON.parse(localStorage['submission/' + id]);
    if (isComplete == null || submission.isComplete == inComplete) {
      return submission
    }
  }
}

function saveSubmission(lessonId, submission) {
  localStorage['submission/' + lessonId] = JSON.stringify(submission);
  if (submission.isComplete) {
    document.querySelector('#page').classList.add('complete')
  }
}




function markLessonLinks (element, url, courses, lessonId) {
  const lessonLinks = element.querySelectorAll('a[href*="/lessons/"]');
  for (var i = 0; i < lessonLinks.length; i++) {
    var link = lessonLinks[i];
    if (link && link.hostname === location.hostname) {
      const m = link.getAttribute('href').match(/\/lessons\/([^\/?#]+)/);
      if (m && m[1] != lessonId && !link.closest('[class*="question"]')) {
        if (!link.closest('[class*="card-url"],[class*="card-cta"]')) {
          link.classList.add('lesson');
          if (findSubmission(m[1], true)) {
            link.classList.add('passed');
          }
        }
        link.setAttribute('href', link.pathname.split('?')[0] + '?from=' + encodeURIComponent(url));
      }
    }
  }

  const lessonFigures = element.querySelectorAll('figure.card[type="card"]');
  for (var i = 0; i < lessonFigures.length; i++) {
    const link = lessonFigures[i].querySelector('a.card-url');
    const href = link && link.getAttribute('href');
    if (href) {
      const figureSlug = extractSlug(href);
      const figureLesson = getLessonById(figureSlug, courses);
      if (!figureLesson) return;
      const figureSubmission = findSubmission(figureLesson.id);
      if (figureSubmission) {
        if (figureSubmission.isComplete) {
           lessonFigures[i].classList.add('complete')
        } else {
           lessonFigures[i].classList.add('started')
        }
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

var submission = {};

const extractSlug = (url) => {
  return url.match(/([^\/]+)\/?$/)[1];
}

export function Article({html, user, discussion}) {
  const pack = location.pathname.match(/\/for-[^\/]+/) || '';
  const lessonId = extractSlug(location.pathname)
  const prefix = pack || '/lessons';
  const course = { }

  const [ {courses} ] = useFetchedData('/courses');
  const lesson = getLessonById(lessonId, courses) || Placeholder()
  
  submission = findSubmission(lesson.id) || submission;
  saveSubmission(lesson.id, submission)


  const callbacks = useRef();
  callbacks.isQuestionCorrect = (i, submission) => {
    if (!submission || !submission.data) {
      return false;
    }
    return !(!submission.data[i] || Object.keys(submission.data[i] ).length == 0 ||  (submission.data[i].correction && submission.data[i].correction != 'false'));
  }
  
  callbacks.onNextQuizStep = () => {
    for (var i = 0; i < lesson.questions.length; i++) {
      if (!callbacks.isQuestionCorrect(i, submission)) {
        const q = document.querySelector('#lesson-question-' + i);
        if (q) {
          const notch = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || 0);
          
          q.scrollIntoViewCustom({
            block: 'start',
            behavior: 'smooth',
            offsetTop: - 75 - notch,
          })
        }
        return i;
      }
    }
  }

  callbacks.onQuestionAnswered = (answer, questionIndex) => {
    const oldData = submission.data || lesson.questions.map(() => null);
    const data = oldData.slice();
    data[questionIndex] = answer;
    const newSubmission = {
      ...submission,
      type: 'lesson',
      lessonId: lesson.id,
      ref: lesson.id,
      data
    };
    newSubmission.isComplete = data.every((q, i) => callbacks.isQuestionCorrect(i, newSubmission))
    submission = newSubmission;
    saveSubmission(lesson.id, submission);
  }

  const questionsTotal = lesson.questions ? lesson.questions.filter((q) => q.options && q.options.length > 1).length : 0;



  const glossary = useMemo(() => {
    return generateGlossary(courses || [])
  }, [courses]);
  
  var instances = [];
  const [currentTermElement, setCurrentTermElement] = useState();

  var instances = [];

  function processHTML(html) {
    if (html && html.indexOf && html.indexOf('█') > -1) return html;
    var filteredGlossary = {};
    for (var term in glossary) {
      if (glossary[term].some((t) => t.lesson.id == lesson.id)) continue;
      filteredGlossary[term] = glossary[term];
    }
    html = html.replace(/open[^ ]* expandable/g, 'expandable')


    return convert(markHTML(html, filteredGlossary, instances))
  }
  

  useEffect(() => {

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

    const articleElement = document.querySelector('.article');
    if (articleElement) {
      markLessonLinks(articleElement, `${prefix}/${lesson.id}/`, courses, lesson.id)
      markTimestampLinks(articleElement, course.id, lesson.id)

      if (!articleElement.querySelector('.share')) {
        const shareButton = document.createElement('button');
        shareButton.classList.add('share');
        shareButton.addEventListener('click', () => {
          copyToClipboard(location.href);
          track('send', 'event', 'Lesson/Share', lesson.name)
          alert('The link to this lesson was copied to the clipboard and is ready for you to share');
        })
        render(<Icon.Share />, shareButton);
        articleElement.querySelector('h1').appendChild(shareButton)
      }
    }
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
    }
  }, [courses]);
  
  const embeddedQuestions = (html && html.match(/<section([^>]*question[^>]*>.*?)<\/section>/gi) || []).length;
  
  const formatTermUrl = (url) => {
    return `${prefix}/${url.split('/lessons/')[1]}`
  }
  return <LessonContext.Provider key="lesson" value={{lesson, callbacks, submission}}>
    <GlossaryDefinition.fromElement from={location.pathname} onClose={() => setCurrentTermElement()} element={currentTermElement} glossary={glossary} formatUrl={formatTermUrl} />
    
    {processHTML(html)}
    {embeddedQuestions < questionsTotal && !lesson.isPlaceholder && <section class={`content article`}>
      {lesson.questions.map((q, i) => {
        return i >= embeddedQuestions && <QuestionWithIndex key={"question-" + i} data-number={i} />
      })}
    </section>}
  </LessonContext.Provider>
        
}


Icon.load(new URL('./assets/atlas/index.svg', import.meta.url).href)


const article = document.querySelector('.article');
if (article) {

  const html = article.innerHTML;
  render(<Article html={html} />, article)
  
}

const onNavigate = () => {
  requestAnimationFrame(() => {
    const menu = document.querySelector('#menu');
    const active = menu.querySelectorAll('.active');
    for (var i = 0; i < active.length; i++)
      active[i].classList.remove('active');
    if (location.hash == '#deals-for-you' || location.pathname.match('/partnerships')) {
      menu.querySelector('.deals-for-you').classList.add('active')
    } else if (location.pathname.match('/for-')) {
      menu.querySelector('.starter-packs').classList.add('active')
    } else if (location.hash == '#starter-packs') {
      menu.querySelector('.starter-packs').classList.add('active')
    } else {
      menu.querySelector('.about-app').classList.add('active')
    }
  })
}

window.addEventListener('hashchange', onNavigate, false);

requestAnimationFrame(() => {
  const menu = document.querySelector('#menu');
  if (menu) {
    const breadcrumbs  = document.querySelector('.breadcrumbs');
    if (breadcrumbs) {
      const observer = new IntersectionObserver( 
        ([e]) => e.target.toggleAttribute('stuck', e.intersectionRatio < 1),
        {threshold: [1]}
      );
      observer.observe(breadcrumbs);
    }

    onNavigate();
  }
})

document.addEventListener('mousedown', (e) => {
  const link = e.target.closest('a');
  if (link && link.hostname && !link.hostname.match(/getmedes.com|192|heroku/) && !link.getAttribute('bypass')) {
    if (link.closest('#app-buttons')) {
      const href = link.getAttribute('href');
      const type = href.match('google') ? 'Android' : 'IOS';
      track('send', 'event', 'Download', type, 'footer');
    }
    link.classList.add('loading');
    track('send', 'event', 'Outgoing', link.hostname.toLowerCase().replace('www.', ''), link.pathname).then(() => {
      const a = document.createElement('a');
      a.href = link.href;
      a.setAttribute('bypass', true);
      //a.setAttribute('target', '_blank');
      document.body.appendChild(a);
      a.click();
    })
    setTimeout(() => {
      link.classList.remove('loading');
    }, 1200)
    e.preventDefault()
    e.stopPropagation()
  }
}, true);





track('send', 'pageview', {
  'page': location.pathname,
  'title': document.title
});

const locationSearch = location.search; 
const campaign = (locationSearch && locationSearch.match(/campaign=([^&]+)/) || [])[1];
const action = (locationSearch && locationSearch.match(/action=([^&]+)/) || [])[1];
const label = (locationSearch && locationSearch.match(/label=([^&]+)/) || [])[1];
const uid = (locationSearch && locationSearch.match(/uid=([^&]+)/) || [])[1];
if (campaign) {
track('send', 'event', campaign, action, label, undefined, uid)
}

export default Article;