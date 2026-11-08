import { Button, Img, Page, Icon } from '/components/index.jsx';
import { useMemo, useFetchedData, useState, useStore, useEffect, useRef, useScript, loadScript } from '/lib/hooks/index.jsx'
import style from './style.module.scss';

import Read from './read';
import { Placeholder } from '/lib/request';
import { copyToClipboard } from "/lib/helpers";
import { findSubmission, getLessonById } from '/lib/data';
import { getLocation, getNextLocation } from '/lib/navigation';
import { NotFound } from '../../../lib/exceptions';
import { LocalizedDateTime, User } from '../../../components';
import * as formatters from '/lib/formatters';
const emptySubmission = {};
const emptyCourse = Placeholder();
export default function Lesson ({lessonId, courseId, goalId, ambitionId, from, hint}) {
  const user         = useStore('auth.user');
  const company      = useStore('auth.company');
  const canManage    = useStore('auth.canManage');
  const courses      = useStore('data.courses');
  const glossary     = useStore('data.glossary');
  const coursesError = useStore('requests.courses.error');
  const userSubmissions = useStore('data.submissions');
  const ambitions = useStore('data.ambitions');
  const submissions  = user ? userSubmissions : [];
  const [{lesson}, lessonRequest, reloadLesson] = useFetchedData(
    `/lessons/${lessonId}`,
    { placeholderState: { lesson: Placeholder(getLessonById(lessonId, courses) || {}) } }
  );
  if (lessonRequest.error && lessonRequest.error.toString().includes('not found'))
    throw new NotFound(lessonRequest.error.toString());

  useEffect(() => {
    if (!user) dispatch('fetchCourses')
  }, [user])

  const course = courses.find((course) => course.id == lesson.courseId) || emptyCourse;

  const [{discussion} = {}, discussionRequest, reloadDiscussion] = useFetchedData(
    lesson.isPlaceholder ? null : `/lessons/${lesson.id}/discussion`,
  );
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
    dispatch('sendSubmission', { submission: newSubmission })
  }

  const submission = findSubmission(submissions, 'lesson', lesson.id) || emptySubmission;
  const isLessonComplete = submission && submission.isComplete;
  const hasQuiz = lesson.questions && lesson.questions[0] && lesson.questions[0].options.length > 1;
  const questionsLeft = hasQuiz && lesson.questions.filter((q, index) => !callbacks.isQuestionCorrect(index, submission)).length || 0
  const questionsTotal = hasQuiz && lesson.questions.length || 0;

  if (callbacks.wasLessonComplete == null) {
    callbacks.wasLessonComplete = isLessonComplete || false;
  }

  const parentLocation = getLocation({ambitionId, goalId, from, courseId}) || (user ? {url: `/courses/${course.id}`, title: 'To course'} : {url: `/`, title: 'Back'});
  const nextLocation = getNextLocation({ambitionId, goalId, from, courseId, lessonId: lesson.id}, ambitions, courses, submissions);

  const parentLink = !callbacks.wasLessonComplete && isLessonComplete ? parentLocation.url + '?success=lesson-submission/' + lesson.id : parentLocation.url + '?fromLesson=' + lesson.id;
  const navigation = useMemo(() => ({
    title: lesson.name,
    titleNode: [ 
    ],
    scrollSelector: hint ? '.question-' + hint + ' .offset' : '*',
    scrollDependency: lessonId,
    scrollPosition: 'start',
    scrollDelay: 100,
    headerType: 'notch',
    headerTheme: 'white',
    //headerHidden: maxWidth > 784,
    headerFaded: false,
    parentTitle: parentLocation.title,
    parentLink: parentLink,
    actionHandler: (e) => callbacks.onNextQuizStep(e),
    actionTitle: user && hasQuiz && questionsLeft  ? (questionsLeft == questionsTotal ? 'Skip to quiz' : 'Next question') :  null,
    manageTitle: `edit`,
    manageLink: canManage && `/courses/${course.id}/lessons/${lesson.id}/edit`,
    requests: [lessonRequest,  discussionRequest],
    errors: coursesError,
    ...(user ? {} : {
      parentLink: null,
      actionTitle: !user && <Icon.Login />,
      actionLink: `/signup?from=${encodeURIComponent(location.pathname)}`,
      titleNode: <a class={style.logo} href={import.meta.env.SITE_URL || "/"}><Icon.LogosArchimedes /></a>,
    })
  }), [ parentLocation, course, lesson, submission, hasQuiz, isLessonComplete, coursesError, discussionRequest.error, lessonRequest.error, hint, from]);


  const feedbackPrompt = `* Did you find anything confusing?
* Were there any mistakes or typos?
* Do you have any suggested supplementary materials?

Please let us know! We're here to help.`
  return <Page id="lesson" navigation={navigation} class={`${style.page} ${!user && style.public}`}>
    {user && <div class={`${style.completion} ${style.badge} badge`}>
      <Icon.Checkmark class={`icon checkmark ${submission.isComplete ? 'checked' : ''}`} onClick={(e) => !submission.isComplete && callbacks.onNextQuizStep(e)}  />
    </div>}
    <div class={style.header}>
      {!user && <a class={style.logo} href={import.meta.env.SITE_URL || "/"}><Icon.LogosArchimedes /></a>}
      {lesson.image && <div class={style.cover}>
        <Img crossorigin={(lesson.image || '').match(/archimedes.*s3/) && 'anonymous'} src={lesson.image} srcset={lesson.imageSizes}/>
      </div>}
      <h1>
        {lesson.slugs && lesson.slugs.length > 0 && <Icon.Share class={style.share} onClick={(e) => {
          const url = `${import.meta.env.SITE_URL}/lessons/${lesson.slugs[0]}`;
          track('send', 'event', 'Lesson/Share', lesson.name)
          copyToClipboard(url);
          alert('The link to this lesson was copied to the clipboard and is ready for you to share');
          e.preventDefault();
          e.stopPropagation();
        }} />}
        {canManage && <a href={`/courses/${course.id}/lessons/${lesson.id}/edit`}>{lesson.name}</a>}
        {!canManage && lesson.name}
      </h1>
    </div>
    <Read {...{questionsLeft, ambitionId, goalId, courseId, questionsTotal, user, course, company, lesson, discussion, glossary, submissions, callbacks, submission, hasQuiz, isLessonComplete, hint, from}} />
    {user && <section class={style.next}>
      {parentLocation && <Button.Link class="green round" icon="ChevronLeft"  href={parentLink}>
        {parentLocation.title}
      </Button.Link>}
      {questionsLeft > 0 && <Button class="transparent round icon-right" icon="Up" onClick={callbacks.onNextQuizStep}>
        {questionsLeft} {questionsLeft == 1 ? 'question' : 'questions'} left
      </Button>}
      {questionsLeft == 0 && nextLocation && <Button.Link class="green round icon-right" icon="ChevronRight" href={nextLocation.url}>
        {nextLocation.title}
      </Button.Link>}
      {questionsLeft == 0 && !nextLocation && <Button.Link class="green round icon-right" icon="Checkmark"  disabled>
        {goalId ? 'Goal complete!' : 'Course complete!'}
      </Button.Link>}
    </section>}
    {user && discussion && !discussion.isPlaceholder && <footer key="questions" class={`${style.footer} ${style.discussion}`}>
      <p>
        Did you find anything confusing?<br />
        Were there any mistakes or typos?<br />
        Do you have any suggested supplementary materials?
      </p>
      <Button.Link href={`/boards/3/topics/${discussion.topicId}/discussions/${discussion.id}?from=${encodeURIComponent(location.pathname)}`} class="wide" icon="Discussion">Provide feedback {discussion.replyCount > 0 && `(${discussion.replyCount})`}</Button.Link>
      {discussion.replies.length > 0 && <a class={style.reply} href={`/boards/3/topics/${discussion.topicId}/discussions/${discussion.id}?from=${encodeURIComponent(location.pathname)}`} >
        {discussion.replies.map((reply) => [
          <span class={style.score}><Icon.Approve />{reply.score}</span>,
          <aside>
            <LocalizedDateTime date={reply.createdAt} />
          </aside>,
          <User user={reply.user} />,
          formatters.userMarkdown(reply.body)
        ])}
      </a>}
    </footer>}
    {/* Only admins/moderators can fix a missing feedback thread, so only they see this. */}
    {user && canManage && !discussion && <footer key="questions2" class={style.footer}>
      <p>Admin: this lesson doesn't have a feedback thread yet.</p>
      <Button.Link href={`/boards/3/topics/0/discussions/new?name=${encodeURIComponent("Feedback for " + lesson.name)}&lessonId=${lesson.id}&description=${encodeURIComponent(feedbackPrompt)}`} class="wide" icon="Discussion">Start feedback page</Button.Link>
    </footer>}
    {!user && <footer class={`${style.footer} ${style.signup}`}>
      <p>At Archimedes, our goal is to make investment literacy accessible and free for everyone.</p>
      <p>Join our investment learning hub for more free lessons like this, connect with our trusted community, and get hands-on experience by playing a game!</p>
      
      <Button.Link class="primary icon-right wide" icon="ChevronRight" href={`/signup?from=${encodeURIComponent(location.pathname)}`}>Sign up for Archimedes</Button.Link>
    </footer>}
  </Page>
}