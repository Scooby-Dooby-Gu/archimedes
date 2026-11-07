import { useAsyncLink, useFetchedData, useAsyncForm, useEffect, useFormData, useMemo, useStore } from "/lib/hooks";

import { Icon, Grid, FormField, Page } from '/components/index.jsx';
import { getLessonById } from "/lib/data";
import { Placeholder } from "/lib/request";
import { getSlug, matchSlug } from "/lib/slugs";
import update from "/lib/immutability";

const initialData = {
  task: {
    type: 'lesson'
  }
};
export default function Goal({ambitionId, goalId, taskId}) {
  const canManage       = useStore('auth.canManage');
  const ambitions       = useStore('data.ambitions');
  const courses         = useStore('data.courses');
  const ambition        = ambitions.find((a) => a.slugs.includes(ambitionId) || a.id == ambitionId) || Placeholder();
  const assignment      = ambition.assignments.find((a) => matchSlug(a.goal, goalId)) || Placeholder();
  const { goal }        = assignment;

  var [savedData = initialData, taskRequest] = useFetchedData(taskId ? `/ambitions/${ambitionId}/goals/${goalId}/tasks/${taskId}` : null)
  


  const [request, onSubmit] = useAsyncForm(( { data }) => {
    route(`/ambitions/${ambitionId}/goals/${goalId}?success=goal`);
  });

  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/ambitions/${ambitionId}/goals/${goalId}?success=goal`);
  });
  var [{videos}, videosRequest] = useFetchedData(`/videos?limit=200`)
  
  const [formData, updateFormData, formRef] = useFormData(savedData, undefined, [videos]);

  useEffect(() => {
    
    if (formData.task.type == 'lesson' || formData.task.type == 'video') {
      updateFormData((data) => update(data, {
        task: {
          url: (d) => {
            if (formData.task.type == 'lesson' && formData.task.lessonId) {
              const lesson = getLessonById(formData.task.lessonId, courses);
              if (lesson) return '/lessons/' + getSlug(lesson);
            } else if (formData.task.type == 'video' && formData.task.videoId) {
              const video = videos.find((video) => video.id == formData.task.videoId);
              if (video) return '/videos/' + getSlug(video);
            } 
            if (d && d.includes('//')) return d;
            return '';
          },
          name: () => {
            if (formData.task.type == 'lesson' && formData.task.lessonId) {
              const lesson = getLessonById(formData.task.lessonId, courses);
              if (lesson) return lesson.name
            } else if (formData.task.type == 'video' && formData.task.videoId) {
              const video = videos.find((video) => video.id == formData.task.videoId);
              if (video) return video.name;
            } else {
              return '';
            }
          },
          description: (d) => {
            if (formData.task.type == 'lesson' && formData.task.lessonId) {
              if (d && !d.includes(' minute read')) return d;
              const lesson = getLessonById(formData.task.lessonId, courses);
              if (lesson) return lesson.duration + ' minute read';
            } else {
              return '';
            }
          }
        }
      }))
    }
  }, [formData.task.type, formData.task.lessonId, formData.task.videoId]);

  const navigation = useMemo(() => ({
    title: taskId ? 'Edit task' : 'New Task',
    manageLink: `/ambitions/${ambitionId}/goals/${goalId}/edit`,
    actionTitle: 'Save',
    actionRequest: request,
    actionHandler: () => onSubmit(formRef.current),
  }), [goal]);

  
  return useMemo(() => <Page id="ambitions" navigation={navigation}>
    <h3>{ambition.name} / {goal.name}</h3>
    <form ref={formRef} action={`/ambitions/${ambition.id}/goals/${goal.id}/tasks/${taskId || ''}`} method="post" encType="multipart/form-data">
      <input type="hidden" name="task[id]" />
      <fieldset>
        <FormField label="Visibility" type="select">
          <select name="task[visibility]">
            <option value="suggested">Suggested</option>
            <option value="supplementary">Supplementary</option>
          </select>
        </FormField>
        <FormField label="Type" type="select">
          <select name="task[type]">
            <option value="lesson">Lesson</option>
            <option value="video">Video</option>
            <option value="link">Link</option>
            <option value="youtube">Youtube player</option>
          </select>
        </FormField>
        {formData.task.type != 'youtube' && formData.task.type != 'link' && <FormField label="Pick reference" type="select">
        {formData.task.type == 'lesson' && <select required name="task[lessonId]">
          <option value="">Choose lesson</option>
          {courses.map((course) => 
            <optgroup key={course.id} label={course.name}>
              {course.lessons.map((lesson) => 
                <option value={lesson.id} key={lesson.id}>{lesson.name}</option>)}
            </optgroup>
          )}
        </select>}
        
        {formData.task.type == 'video' && <select required name="task[videoId]">
          <option value="">Choose video</option>
          {videos.map((video) =>  <option value={video.id}>{video.name}</option>)}
        </select>}
        </FormField>}
        <FormField label="Name" type="text" name="task[name]" />
        <FormField placeholder="http://" name="task[url]" type="text" readonly={formData.task.type != 'link' && formData.task.type != 'youtube'} />
        <FormField label="Optional description" type="text" name="task[description]" />
      </fieldset>
      <br />
      <br />
      <fieldset>
        <FormField label="Promotional URL" type="text" name="task[promoUrl]" />
        <FormField label="CTA" type="text" name="task[promoCta]" />
        <FormField label="Image" type="file" name="task[promoImage]" />


      </fieldset>
      <fieldset>
        <Grid 
          type="list" 
          headers={[
            {name: 'Link', type: 'link'},
            {name: 'Name'},
            {name: 'Prompt', type: 'action'},
          ]}
          rows={taskId ? [
            [
              `/ambitions/${ambitionId}/goals/${goalId}/tasks/${taskId}`,
              "Delete task",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to delete the task?", method: "delete", onClick: onDeleteAction}
            ]
          ] : []} />
      </fieldset>
    </form>
  </Page>, [savedData, formData.task.type, courses, videos])
}