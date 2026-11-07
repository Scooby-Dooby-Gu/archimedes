import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Grid, Button, Page } from '/components/index.jsx';
import { useStore } from "/lib/state";
import { Icon } from '/components/index.jsx';
import style from './style.module.scss';
import { useCallback, useFetchedData } from "/lib/hooks";
import { getCourseCompletedLessons } from "/lib/data";
import * as formatters from "/lib/formatters";

export default function Courses({lessonId, courseId}) {
  const canManage        = useStore('auth.canManage');
  const submissions      = useStore('data.submissions');
  const courses          = useStore('data.courses');
  const coursesError     = useStore('requests.courses.error')
  const submissionsError = useStore('requests.submissions.error');


  const navigation = useMemo(() => ({
    scrollSelector: courseId ? `.course-list a[href$="courses/${courseId}"]` : false,
    scrollOffset: -10,
    titleNode: <span>Courses</span>,
    title: 'Explore topics',
    headerTheme: 'blue',
    pageTheme: 'gray',
    actionTitle: canManage ? <Icon.Add /> : null,
    actionLink: canManage ?'/courses/new' : null,
    errors: [submissionsError, coursesError],
  }), [coursesError, courseId, canManage, submissionsError])


  const [, moveCourseRequest, moveCourse] = useFetchedData('/', {
    method: 'post',
    immediate: false,
    onSuccess: () => {
      dispatch({type: 'fetchCourses'});
    }
  });
  const onSort = useCallback(canManage ? (url, index) => {
    moveCourse({
      order: index
    }, url);
  } : null, []);

  const sortedCourses = courses.isPlaceholder || canManage ? courses : courses.slice().sort((a, b) => {
    return  getCourseCompletedLessons(b, submissions).length 
          - getCourseCompletedLessons(a, submissions).length 
  });
  const firstPrivateIndex = sortedCourses.map((c, index) => c.state === 'preview' ? index : null)
                                         .filter((index) => index != null)[0];
  
  const content = useMemo(() => <>
    <Button.Link disabled={courseId == 'terms'} icon="ChevronRight" href="/courses/terms" class="icon-right">Browse glossary</Button.Link>
    <Grid 
      type='cards'
      class="course-list"
      headers={[
      {name: "Before", type: 'before'},
      {name: "Link", type: 'link'},
      {name: "Drag", type: 'drag'},
      {name: "Name"},
      {name: "Difficulty", type: 'meta'},
      {name: "Duration", type: 'meta'},
      {name: "Lessons", type: 'meta'},
      {name: "Progress", type: 'meta'},
      {name: "Action", type: 'after'},
      {name: "Icon", type: 'icon'},
    ]} rows={
      sortedCourses
        .map((course, index) => {
          if (course.state == 'hidden' && !canManage) return;
          const completeLessons = getCourseCompletedLessons(course, submissions)
          return [
            index === 0  && 
              <div class="hgroup">
                <span class="tagline">Start learning today</span>
                <h2>Available topics</h2>
              </div> ||
            firstPrivateIndex === index && 
              <div class="hgroup">
                <span class="tagline">Additional learning</span>
                <h2>Upcoming topics</h2>
              </div>,
            (canManage || course.state === 'public') ? `/courses/${course.id}` : null,
            onSort && <a class="handle" href={`/courses/${course.id}/move`}><Icon.DragHandle /></a>,
            <h3>{course.name}</h3>,
            <span class="uppercase faint">{course.difficulty}</span>,
            course.duration > 0 && <span><Icon.Clock /> {formatters.duration(course.duration)}</span>,
            course.lessons.length > 0 && [
              <Icon.Pages />,
              course.lessons.length
            ],
            completeLessons.length > 0 ? <span class="divider">
              <Icon.Checkmark class="status inverted" />
              {completeLessons.length}
            </span> : null,
            [
              <Button.Link class="transparent round" href={course.state == 'preview' && !canManage ? '' : `/courses/${course.id}`}>
                {completeLessons.length > 0 && completeLessons.length == course.lessons.length > 0 ? 'Revisit topic'  : 
                completeLessons.length > 0 ? 'Continue topic' :
                course.state === 'preview' ? 'Coming soon' :
                course.state === 'hidden' ? 'Hidden' : 'Start topic'}
              </Button.Link>,
              completeLessons.length > 0 && <progress class={style.progress} max={course.lessons.length} value={completeLessons.length} />,
            ],
            course.icon,
            {
              id: 'courses-' + course.id, 
              class: `fixed course ${courseId == course.id && 'selected'} cover theme-${course.color} ${course.state !== 'public' ? 'preview' : 'public'}`,
            }
          ]
      }).filter(Boolean)
    }
    onSort={onSort} />
  </>, [courses, courseId]);


  return <Page id="levels" navigation={navigation} class={style.page}>
    {content}
  </Page>
  
}