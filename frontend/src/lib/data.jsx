import { shuffle, seed } from "./math";
import { useRef } from "./hooks";
import { matchSlug } from "./slugs";


export const tracks = [
  {
    title: "Stock trader 1",
    lessons: [78, 86, 71, 64]
  },
  {
    title: "Stock trader 2",
    lessons: [75, 98, 85, 89]
  },
  {
    title: "Stock trader 3",
    lessons: [154, 155]
  },
  {
    title: "Economist 1",
    lessons: [151, 145, 141, 150]
  },,
  {
    title: "Economist 2",
    lessons: [138, 148, 139, 152]
  },
];

export function getSkills(submissions = [], courses) {
  const skillLevels = tracks.map((track) => {
    const bits = track.title.match(/^(.*?)\s*(\d+)$/);
    if (bits) {
      const name = bits[1];
      const level = parseInt(bits[2]);
      const lessons = filterLessons((lesson) => track.lessons.includes(lesson.id), courses);
      const passed = lessons.filter((lesson) => isLessonComplete(lesson, submissions));
      return {
        ...track,
        total: lessons.length,
        passed: passed.length,
        lessons: lessons,
        name,
        icon: name == 'Stock trader' ? '/assets/images/icons/786797.svg' :
              name == 'Economist' ? '/assets/images/icons/paper_chase.svg' : null,
        summary: name == 'Stock trader' ? 'Buying low and selling high' :
              name == 'Economist' ? 'Staying ahead of the curve' : null,
        level
      }
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.level - b.level)

  // filter out passed levels
  return skillLevels.filter((s) => {
    return !skillLevels.find((skill) => skill.name === s.name && skill.level > s.level && s.passed === s.total)
  // filter out unpassed levels
  }).filter((s) => {
    return !skillLevels.find((skill) => skill.name === s.name && skill.level < s.level && skill.passed !== skill.total)
  }).map((s) => {
    return {
      ...s,
      points: s.passed === s.total ? s.level + 1 : s.level
    }
  })
}

export function clearLocalStorage() {
  for (var property in localStorage) {
    if (property.indexOf('cache:') > -1 || property.indexOf('remembered:') > -1) {
      localStorage.removeItem(property)
    }
  }
}

export function findSubmission(submissions, type, ref, isComplete) {
  return submissions.find((submission) => submission.type == type && submission.ref == ref && (isComplete == null || submission.isComplete == isComplete));
}

export function findSubmissionForTask(submissions, task, isComplete) {
  return findSubmission(submissions, task.type, task.videoId || task.lessonId || task.url, isComplete)
}

export function isLessonComplete(lesson, submissions) {
  return findSubmission(submissions, 'lesson', lesson.id, true);
}
export function getLessonById(lessonId, courses) {
  return courses.reduce((result, course) => {
    return result || course.lessons.find((lesson) => matchSlug(lesson, lessonId))
  }, null)
}

export function getCourseCompletedLessons(course, submissions) {
  return course.lessons.filter((lesson) => isLessonComplete(lesson, submissions))
}

export function getLessonTags(tags) {
  var now = new Date()
  var cutoffUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
  // move one day behind if needed
  if (cutoffUTC.getHours() < 8)
    cutoffUTC.setHours(-24)
  cutoffUTC.setHours(8)   // set 8:00 am utc
  cutoffUTC.setMinutes(0)
  cutoffUTC.setSeconds(0)
  cutoffUTC.setMilliseconds(0)
  const cutoff = new Date(cutoffUTC - now.getTimezoneOffset() * 60000)
  const game = tags.find((t) => t.name == 'Paper Chase')
  tags = tags.filter((t) => t.name != 'Paper Chase');
  return [].concat(game || [], shuffle(tags, seed(+cutoff)));
}

export function filterLessons(callback, courses) {
  return courses.reduce((lessons, course) => {
    return course.lessons.reduce((lessons, lesson) => {
      if (callback(lesson)) {
        return lessons.concat(lesson);
      }
      return lessons;
    }, lessons)
  }, [])
}

export function generateGlossary(courses) {
  const div = document.createElement('div');
  return courses.reduce((glossary, course) => {
    return course.lessons.reduce((glossary, lesson) => {
      if (lesson.glossaryTerms) {
        
        var definitions = [];
        div.innerHTML = lesson.glossaryTerms;
        const figures = div.querySelectorAll('figure.card-definition');
        for (var i = 0; i < figures.length; i++) {
          const figure = figures[i];
          if (!figure.querySelector('figcaption')) continue;
          if (!figure.querySelector('.card-content')) continue;

          var title = figure.querySelector('figcaption').textContent;
          var content = figure.querySelector('.card-content').innerHTML;

          if (title) {
            title = title.replace(/\s+/, ' ').trim();
            if (title.charAt(0) == title.charAt(0).toLowerCase()) {
              title = title.charAt(0).toUpperCase() + title.substring(1)
            }
          }

          if (definitions.includes(title)) continue;
          definitions.push(title);
          
          const aliases = title.split(/\s*\/\s*/);
          aliases.map((w, index) => {
            const word = w.trim();
            if (!glossary[word])
              glossary[word] = [];

            glossary[word] = glossary[word]
            .filter((g) => g.lesson != lesson)
            .concat({
              url: '/courses/' + lesson.courseId + '/lessons/' + lesson.id + '/',
              lesson: lesson,
              content: content,
              alias: index > 0,
              canonical: aliases[0]
            })
          })
        }
      }
      return glossary
    }, glossary)
  }, {})
}
/*
export function useGameState() {
  const data = useRef();
  const world = useRef();
  const progression = useRef();

  const environment = { data, world, progression, params: {} }
  Object.assign(data, Data(environment, { gameId: 'paper-chase' }));
  Object.assign(world, PaperChaseWorld(environment, true));

  return { data, world, progression, gameId: 'paper-chase', state: world.state }
} */