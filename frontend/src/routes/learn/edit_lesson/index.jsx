import { useStore, useMemo, useAsyncLink, useAsyncForm, useFormData, useCallback, useFetchedData, useRef, useEffect } from '/lib/hooks/index.jsx';
import { Placeholder } from '/lib/request'
import update from '/lib/immutability';
import { Grid, Icon, Page, Form, FormField, Button, Editor} from '/components/index.jsx';
import style from './style.module.scss';
import { slug } from '/lib/formatters';
import { generateSlugsFromName } from '../../../lib/slugs';

const newQuestion = () => ({
  type: 'choice',
  options: [{

  }]
})

const emptyCourse = Placeholder();

export default function EditLesson ({courseId, lessonId}) {
  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/courses/${response.data.lesson.courseId}/lessons/${response.data.lesson.id}?success=lesson`);
  })

  const courses = useStore('data.courses');

  const course = courses.find((course) => course.id == courseId) || emptyCourse;

  const initialData = useMemo(() => ({
    lesson: {
      questions: [newQuestion()],
      difficulty: course.isPlaceholder ? null : course.difficulty,
      courseId: courseId
    }
  }), [courseId, course])

  var [savedData = initialData, lessonRequest] = useFetchedData(lessonId ? `/courses/${courseId}/lessons/${lessonId}` : null)
  var [writers, writersRequest] = useFetchedData(`/users?role=writer,admin,manager`);
  
  // Hack: stringify tag array
  savedData = useMemo(() => {
    // initialize form and sync data
    if (!savedData.isPlaceholder && savedData && savedData.lesson) {
      if (savedData.lesson.slugs) {
        savedData = update(savedData, {
          lesson: {
            slugs: { $set: savedData.lesson.slugs.join('; ')}
          }
        })
      }
    }
    return savedData
  }, [savedData])
  const [formData, updateFormData, formRef] = useFormData(savedData, (data, old) => update(data, {
    lesson: {
      slugs: (slugs) => generateSlugsFromName(data.lesson.name, slugs, old.lesson.name)
    }
  }), [writers]);
  
  const { lesson } = formData;


  const onQuestionAdd = useCallback((e) => {
    
    updateFormData((data) => update(data, {
      lesson: {
        questions: {$pushOrCreate: [newQuestion()]}
      }
    }))
    e.preventDefault()
  }, [])

  const onQuestionRemove = useCallback((e) => {
    
    updateFormData((data) => update(data, {
      lesson: {
        questions: {
          $splice: [[e.target.closest(`.${style.question}`).getAttribute('index'), 1]]
        }
      }
    }))
    e.preventDefault()
  }, [])
  const onQuestionUp = useCallback((e) => {
    const index = parseInt(e.target.closest(`.${style.question}`).getAttribute('index'));
    updateFormData((data) => update(data, {
      lesson: {
        questions: {
          $splice: [[index, 1], [index - 1, 0, data.lesson.questions[index]]]
        }
      }
    }))
    e.preventDefault()
  }, [])
  const onQuestionDown = useCallback((e) => {
    const index = parseInt(e.target.closest(`.${style.question}`).getAttribute('index'));
    updateFormData((data) => update(data, {
      lesson: {
        questions: {
          $splice: [[index, 1], [index + 1, 0, data.lesson.questions[index]]]
        }
      }
    }))
    e.preventDefault()
  }, [])

  const onOptionAdd = useCallback((e) => {
    updateFormData((data) => update(data, {
      lesson: {
        questions: {
          [e.target.closest(`.${style.question}`).getAttribute('index')]: {
            options: {
              $pushOrCreate: [{}]
            }
          }
        }
      }
    }))
    e.preventDefault()
  }, [])

  const onOptionRemove = useCallback((e) => {
    updateFormData((data) => update(data, {
      lesson: {
        questions: {
          [e.target.closest(`.${style.question}`).getAttribute('index')]: {
            options: {
              $splice: [[e.target.closest('.option').getAttribute('index'), 1]]
            }
          }
        }
      }
    }))
    e.preventDefault()
  }, [])

  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/courses/${courseId}?success=lesson`)
  });


  if (lessonId) {
    var navigation = useMemo(() => ({
      title: 'Edit',
      parentType: 'lesson',
      parentCache: lesson,
      parentTitle: 'Lesson',
      parentLink: `/courses/${courseId}/lessons/${lessonId}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
      requests: [deleteActionRequest, lessonRequest, writersRequest]
    }), [lesson, request, deleteActionRequest.error, lessonRequest.error, writersRequest.error])
  } else {
    var navigation = useMemo(() => ({
      title: 'New lesson',
      parentTitle: "Course", //course.name,
      parentLink: `/courses/${courseId}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
      requests: [deleteActionRequest, lessonRequest, writersRequest]
    }), [request, lessonRequest.error, writersRequest.error])
  }

  // Show a spinner while the profile is loading
  return useMemo(() => <Page id="edit-lesson" navigation={navigation}>
    <form action={`/courses/${courseId}/lessons/${lessonId || ''}`} onSubmit={onSubmit} ref={formRef} method="post" encType="multipart/form-data">
      <FormField type="text" name="lesson[name]" label="Lesson name" required />
      <FormField type="text" name="lesson[slugs]" label="URL Slug" placeholder="Semicolon separated list of slugs" required />
      <FormField type="number" name="lesson[duration]" label="Estimated duration" placeholder="min." required />
      <FormField type="file" name="lesson[image]" label="Cover image" />
      <FormField label="Difficulty" type="select">
        <select name="lesson[difficulty]" required>
          <option value="">Choose difficulty</option>
          <option value="beginner">Beginner</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </FormField>
      <FormField label="Course" type="select">
        <select name="lesson[courseId]">
          <option value="">Choose course</option>
          {courses.map((course, index) => <option value={course.id}>
            {course.name}
          </option>)}
        </select>
      </FormField>
      <FormField label="Publishing date" type="date" name="lesson[publishedAt]" autocomplete="off"  />
      <br />
      <h2>Content</h2>
      <FormField label="Description" type="textarea" name="lesson[description]" placeholder="Introduction. Engage reader with a few lines of text, tell them what will they learn in the lesson before they dive into it." required>
      </FormField>
      <FormField label="Lesson body" type="html">
        <Editor rows="5" name="lesson[contentHtml]" placeholder="Introduce and explain concepts, provide examples and analogies, dig into details. Aim for no more than 1-2 pages of printed text." required></Editor>
      </FormField>
      <h2>Quiz</h2>
      {lesson.questions.map((question, q) => <fieldset class={style.question} index={q}>
        
        <FormField label={`Question #${q + 1}`} type="select" class={style.first}>
          <select name={`lesson[questions][${q}][type]`}>
            <option value="choice">Choice</option>
            <option value="ranking">Ranking</option>
            <option value="match">Match</option>
            <option value="blanks">Blanks</option>
          </select>
          {lesson.questions.length > 1 && [
            q > 0 && <Icon.Up onClick={onQuestionUp} />,
            q < lesson.questions.length - 1 && <Icon.Down onClick={onQuestionDown} />,
            <Icon.Close onClick={onQuestionRemove} />
          ]}
        </FormField>
        {question.type === 'blanks' && <p class={style.tip}>Use "_" to denote a fill-in-the-blank in Question field. The user will select the correct answer from a word bank. There can be more words available than blanks the user needs to fill in.</p>}
        {question.type === 'choice' && <p class={style.tip}>Check one correct option for single choice question. Check multiple options for multiple choice question.</p>}
        {question.type === 'ranking' && <p class={style.tip}>Provide options in correct order. Users will need to unshuffle them.</p>}
        {question.type === 'match' && <p class={style.tip}>List the correct matching category on the left of each option you create.</p>}

        {/*<FormField type="textarea" label="Description - task goal or setup" name={`lesson[questions][${q}][description]`} />*/}
        <FormField type="textarea" label="Question" name={`lesson[questions][${q}][title]`} />
        <FormField type="textarea" label="Correction - shown if person chose wrong answer" name={`lesson[questions][${q}][correction]`} />
        <ul class={style.options}>
          {(question.options || []).map((option, a) => <li class="option row" index={a}>
            {question.type == 'choice' && 
              <input name={`lesson[questions][${q}][options][${a}][correct]`} type="checkbox" />}
            {question.type == 'match' && 
              <input name={`lesson[questions][${q}][options][${a}][group]`} type="text" placeholder="Group" />}
            <input name={`lesson[questions][${q}][options][${a}][name]`} type="text" placeholder="Option" />
            <Icon.Close onClick={onOptionRemove} />
          </li>)}
        </ul>
        <Button onClick={onOptionAdd} icon="Add">Add option</Button>
      </fieldset>)}
      <br />
      <Button icon="Add" onClick={onQuestionAdd}>Add question</Button>

      <br />
      <br />
      <h2>Invited author</h2>
      <FormField label="Author user" type="select">
        <select name="lesson[authorId]">
          <option value="">Choose author</option>
          {writers.map((writer, index) => <option value={writer.id}>
            {writer.name}
          </option>)}
        </select>
      </FormField>

      <fieldset>
          <Grid 
            type="list" 
            headers={[
              {name: 'Link', type: 'link'},
              {name: 'Name'},
              {name: 'Prompt', type: 'action'},
            ]}
            rows={lessonId ? [
              [
                `/courses/${courseId}/lessons/${lessonId}`,
                "Delete lesson",
                <Icon.ChevronRight class="forward icon" />,
                {class: 'dangerous', confirm: "Are you sure to delete this lesson? All related submissions will be deleted too!", method: "delete", onClick: onDeleteAction}
              ]
            ] : []} />
        </fieldset>
    </form>
  </Page>, [course, lesson.questions, writers, navigation])
}