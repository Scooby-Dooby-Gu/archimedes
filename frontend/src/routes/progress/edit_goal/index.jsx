
import { Grid, Icon, Button, Editor, Page, Form, FormField } from '/components/index.jsx';
import { useAsyncLink, useCallback, useStore, useState, useMemo, useAsyncForm, useFetchedData, useFormData, useEffect } from "/lib/hooks";
import { update } from '/lib/immutability';
import style from './style.module.scss';
import { slug } from '/lib/formatters';
import { generateSlugsFromName, getSlug, matchSlug } from "/lib/slugs";
import { commaSeparatedList } from '/lib/parsers';

const initialData = { 
  assignment: {
    goal: {
      question: {
        options: ["", ""]
      }
    }
  }
};


export default function EditGoal({assignmentId, ambitionId}) {

  const [request, onSubmit] = useAsyncForm(( { data }) => {
    route(`/ambitions/${ambitionId}/goals/${data.assignment.goalId}?success=goal`);
  }, () => {}, (data) => data.assignment.goal ? update(data, {
    assignment: {
      goal: {
        slugs: commaSeparatedList,
      }
    }
  }) : data)
  const ambitions = useStore('data.ambitions');
  const ambition = ambitions.find((a) => matchSlug(a, ambitionId));

  var [savedData = initialData, goalRequest] = useFetchedData(assignmentId ? `/ambitions/${ambitionId}/assignments/${assignmentId}` : null)
  
  const { assignment } = savedData;
  const goal = { assignment }

  savedData = useMemo(() => update(savedData, {
    assignment: {
      goal: {
        slugs: (s) => (s || []).join(', '),
      }
    }
  }), [savedData]);

  const [formData, updateFormData, formRef] = useFormData(savedData, (data, old) => update(data, {
    assignment: {
      goal: {
        slugs: (slugs) => generateSlugsFromName(data.assignment.goal.name, slugs, old.assignment.goal.name)
      }
    }
  }));
  
  const [isEditing, setEditing] = useState(true);

  if (assignmentId) {
    var navigation = useMemo(() => ({
      title: 'Edit',
      parentTitle: 'Goal',
      parentLink: `/ambitions/${ambitionId}/goals/${assignment.goal.id}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
      requests: [goalRequest]
    }), [request, goal, goalRequest.error, onSubmit])
  } else {

    var navigation = useMemo(() => ({
      title: 'Add goal',
      parentTitle: 'Goals',
      parentLink: `/ambitions/${ambitionId}/goals/`,
      actionTitle: 'Create',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
      requests: [goalRequest]
    }), [request, goal, goalRequest.error, onSubmit])

  }
  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/ambitions/${ambitionId}/?success=ambition`);
  });

  
  const onOptionAdd = useCallback((e) => {
    updateFormData((data) => update(data, {
      assignment: {
        goal: {
          question: {
            options: {
              $pushOrCreate: [""]
            }
          }
       }
      }
    }))
    e.preventDefault()
  }, [])

  const onOptionRemove = useCallback((e) => {
    updateFormData((data) => update(data, {
      assignment: {
        goal: {
          question: {
            options: {
              $splice: [[e.target.closest('.option').getAttribute('index'), 1]]
            }
          }
        }
      }
    }))
    e.preventDefault()
  }, [])


  return useMemo(() => <Page navigation={navigation} key={isEditing}>
    {!assignmentId && <Grid 
      type="tabs" 
      class="main" 
      headers={[
        {name: 'Name'},
      ]} 
      rows={[[
        <a href="#" onClick={() => setEditing((e) => true)}>Create goal</a>,
        {class: isEditing && 'selected'}
      ], [
        <a href="#" onClick={() => setEditing((e) => false)}>Reuse goal</a>,
        {class: !isEditing && 'selected'}
      ]]} />}
    <form action={`/ambitions/${ambition.id}/assignments/${assignmentId || ''}`} onSubmit={onSubmit} ref={formRef} method="post" encType="multipart/form-data">
      {isEditing && <>
        <Button style="display: none"></Button>
        <input type="hidden" name="assignment[goal][id]" />
        <FormField type="text" name="assignment[goal][name]" label="Goal name" required />
        <FormField type="text" name="assignment[goal][slugs]" label="URL Slug" required />
        <FormField type="text" name="assignment[goal][tagline]" label="Tagline" required />
        <FormField type="textarea" name="assignment[goal][description]" label="Description" required />
        <FormField type="file" name="assignment[goal][image]" label="Cover image" />
        <fieldset class={style.question}>
          <FormField name={`assignment[goal][question][intro]`} placeholder="Intro" type="text" />
          <FormField name={`assignment[goal][question][title]`} placeholder="Question" type="textarea" />
          <ul class={style.options}>
            { formData.assignment.goal.question.options.map((option, a) => <li class="option row" index={a}>
              <input name={`assignment[goal][question][options][${a}]`}  value={option} type="text" placeholder="Option" />
              <Icon.Close onClick={() => updateFormData((d) => update(d, { assignment: { goal: { question: { options: { $splice: [[a, 1]]}}}}}))} />
            </li>)}
          </ul>
          <Button onClick={() => updateFormData((d) => update(d, { assignment: { goal: { question: { options: { $pushOrCreate: [""]}}}}}))} icon="Add">Add option</Button>
        </fieldset>

        <FormField type="html" name="assignment[goal][afterwordHtml]" label="Afterword">
          <Editor rows="5" name="assignment[goal][afterwordHtml]"  placeholder="Now you are ready to move on"></Editor>
        </FormField>
        <FormField type="text" name="assignment[goal][cta]" label="Success state (button text)" placeholder="I am ready to move on"  />
        <fieldset>
          <Grid 
            type="list" 
            headers={[
              {name: 'Link', type: 'link'},
              {name: 'Name'},
              {name: 'Prompt', type: 'action'},
            ]}
            rows={ambitionId ? [
              [
                `/ambitions/${ambitionId}/assignments/${assignment.id}`,
                "Delete goal",
                <Icon.ChevronRight class="forward icon" />,
                {class: 'dangerous', confirm: "Are you sure to delete the ambition?", method: "delete", onClick: onDeleteAction}
              ]
            ] : []} />
        </fieldset>
      </>}
      {!isEditing && <>
        <select name="assignment[goalId]" class={style.select}>
          {ambitions.map((ambition) => 
            ambition.assignments.length > 0 && ambition.id != ambitionId && <optgroup label={ambition.name}>
              {ambition.assignments.map(({goal}) => <option value={goal.id}>{goal.name}</option>)}
            </optgroup>
          )}
        </select>
      </>}
    </form>
    
  </Page>, [ formData.assignment.goal.question.options, navigation, isEditing, ambition, goal]);
}