import { useMemo, useAsyncLink, useAsyncForm, useFetchedData, useFormData } from '/lib/hooks/index.jsx';
import { Grid, Icon, Form, Button, FormField, Page } from '/components/index.jsx';


export default function({courseId}) {
  const [currentCourse] = useFetchedData(courseId ? `/courses/${courseId}` : null)

  const [{ course }, updateFormData, formRef] = useFormData(currentCourse);

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/courses/${response.data.course.id}?success=course`);
  });

  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/courses?success=course`)
  });

  if (courseId) {
    var navigation = useMemo(() => ({
      title: 'Edit',
      parentType: 'course',
      parentCache: course,
      parentTitle: 'Course',
      parentLink: `/courses/${courseId}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current)
    }), [course, request, deleteActionRequest.error])
  } else {
    var navigation = useMemo(() => ({
      title: 'New course',
      parentTitle: 'Courses',
      parentLink: `/courses`,
      actionTitle: 'Create',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current)
    }), [request])
  }

  return <Page id="edit-course" navigation={navigation}>
    <div>
      <Form action={`/courses/${courseId || ''}`} formRef={formRef} onSubmit={onSubmit} method="post" encType="multipart/form-data">
        <FormField type="text" name="course[name]" label="Course title" required />
        <FormField type="select" label="Published state">
          <select name="course[state]" required>
            <option value="public">Public</option>
            <option value="preview">Coming soon</option>
            <option value="hidden">Hidden</option>
          </select>
        </FormField>
        <FormField type="select" label="Difficulty">
          <select name="course[difficulty]" required>
            <option value="beginner">Beginner</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </FormField>
        <FormField type="select" label="Color theme">
          <select name="course[color]" required>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="lightblue">Light Blue</option>
            <option value="purple">Purple</option>
            <option value="violet">Violet</option>
            <option value="black">Black</option>
            <option value="darkgray">Dark Gray</option>
            <option value="green">Green</option>
            <option value="darkgreen">Dark Green</option>
            <option value="vibrantgreen">Vibrant Green</option>
            <option value="orange">Orange</option>
            <option value="yellow">Yellow</option>
            <option value="white">White</option>
            <option value="gray">Gray</option>
          </select>
        </FormField>
        <FormField type="textarea" name="course[description]" label="Course description" required />
        <FormField type="file" name="course[icon]" label="Attach icon" />

        <fieldset>
          <Grid 
            type="list" 
            headers={[
              {name: 'Link', type: 'link'},
              {name: 'Name'},
              {name: 'Prompt', type: 'action'},
            ]}
            rows={courseId ? [
              [
                `/courses/${courseId}`,
                "Delete course",
                <Icon.ChevronRight class="forward icon" />,
                {class: 'dangerous', confirm: "Are you sure to delete this course? All related lessons and submissions will be deleted too!", method: "delete", onClick: onDeleteAction}
              ]
            ] : []} />
        </fieldset>
      </Form>
    </div>
  </Page>
}