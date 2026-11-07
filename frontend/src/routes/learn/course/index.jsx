import { Page, Grid, Icon } from '/components/index.jsx';
import { usePrecache, useFetchedData, useEffect, useMemo, useCallback, useStore } from '/lib/hooks/index.jsx'
import * as formatters from '/lib/formatters';
import style from './style.module.scss';
import { Placeholder } from '/lib/request';
import { findSubmission, getCourseCompletedLessons } from '/lib/data';

const emptyCourse = Placeholder();
export default function Course({courseId, lessonId, title, success}) {
  const canManage           = useStore('auth.canManage');
  const submissions         = useStore('data.submissions');
  const courses             = useStore('data.courses');

  const coursesError        = useStore('requests.courses.error')
  const submissionsError    = useStore('requests.submissions.error');

  const course = courses.find((course) => course.id == courseId) || emptyCourse;
  
  const [, moveLessonRequest, moveLesson] = useFetchedData('/', {
    method: 'post',
    immediate: false,
    onSuccess: () => {
      dispatch('fetchCourses');
    }
  });
  const completeLessons = getCourseCompletedLessons(course, submissions);

  const navigation = useMemo(() => ({
    scrollSelector: lessonId ? `a[href$="/lessons/${lessonId}"]` : false,
    scrollOffset: -55,
    title: course.name,
    headerType: 'notch',
    headerTheme: course.color || 'blue',
    headerClass: 'action-compact back-compact full-width collapsible-title action-top back-top scaled-header',
    errors: [submissionsError],
    requests: [moveLessonRequest],
    parentTitle: 'Learn',
    parentLink: '/courses',
    manageTitle: 'Edit',
    manageLink: `/courses/${courseId}/edit`,
    actionLink: `/courses/${courseId}/lessons/new`,
    actionTitle: canManage && <Icon.Add />
  }), [courseId, course, lessonId, coursesError, submissionsError, moveLessonRequest.error])

  usePrecache((cache) => course.lessons.forEach((lesson) => {
    cache[`/courses/${course.id}/lessons/${lesson.id}`] = {lesson: {...lesson, course}};
  }), [course]);

  
  const onSort = useCallback(canManage ? (url, index) => {
    moveLesson({
      order: index
    }, url);
  } : null, [])

  const content = useMemo(() => <>
    <div class={`${style.header} cover theme-${course.color}`}>
      <img crossorigin={(course.icon || '').match(/archimedes.*s3/) && 'anonymous'} src={course.icon} />
      {canManage && <h1><a href={`/courses/${courseId}/edit`}>{course.name}</a></h1>}
      {!canManage && <h1>{course.name}</h1>}
    </div>

    <ul class="meta centered near-black">
      <li> 
        <span class="uppercase faint">{course.difficulty}</span>
      </li>
      {course.duration > 0 && <li>
        <span><Icon.Clock /> {formatters.duration(course.duration)}</span>
      </li>}
      {course.lessons.length > 0 && <li>
        <Icon.Pages /> {course.lessons.length}
      </li>}
      {completeLessons.length > 0 && <li>
        <span class="divider">
          <Icon.Checkmark class="status" />
          {completeLessons.length} completed
        </span>
      </li>}
      
    </ul>
    <br />
    <h2 class="tagline">Description</h2>
    <div class="summary">{course.description}</div>
    
    <Grid headers={[
      {name: "Before", type: 'before'},
      {name: 'Link', type: 'link'},
      {name: 'Drag', type: 'drag'},
      {name: "Completion", type: 'icon'},
      {name: "Name"},
      {name: "Action", type: 'action'},
    ]} rows={
      course.lessons.map((lesson, index) => {
        const submission = findSubmission(submissions, 'lesson', lesson.id);
        return [
          (!course.lessons[index - 1] || course.lessons[index - 1].difficulty !== lesson.difficulty) && !course.isPlaceholder && <h2 class="tagline">{lesson.difficulty}</h2>,
          `/courses/${course.id}/lessons/${lesson.id}`,
          onSort && <a class="handle" href={`/courses/${course.id}/lessons/${lesson.id}/move`}><Icon.DragHandle /></a>,
          <Icon.Checkmark class="icon checkmark"  />,
          <h3 class="larger">{lesson.name}</h3>,
          <Icon name={lesson.tags && lesson.tags.includes('Videos') ? 'Video' : 'ChevronRight'} class="forward icon" />,
          {
            id: 'lessons-' + lesson.id,
            class: `${lessonId == lesson.id && 'selected'} 
            ${submission && submission.isComplete && 'checked'}
            ${submission && !submission.isComplete && 'undetermined'}`
          }
        ]
      })
    }
    onSort={onSort}>
    </Grid>
  </>, [course, submissions, lessonId])

  return useMemo(() => <Page id={`course-${course.id}`} navigation={navigation}>
    {content}
  </Page>, [content, navigation]);

}