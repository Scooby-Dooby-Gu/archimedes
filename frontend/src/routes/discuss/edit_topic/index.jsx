import { useAsyncLink, useMemo, useAsyncForm, useFetchedData, useFormData } from '/lib/hooks/index.jsx';
import { Icon, Grid, Form, Button, FormField, Page } from '/components/index.jsx';


export default function({boardId, topicId}) {
  //const [{ board }, boardRequest, reloadBoard] = useFetchedData(`/boards/${boardId}`)
  const [currentTopic] = useFetchedData(topicId ? `/boards/${boardId}/topics/${topicId}` : null)
  
  const [{ topic }, updateFormData, formRef] = useFormData(currentTopic);

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/boards/${boardId}/topics/${response.data.topic.id}?success`);
  });

  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/boards/${boardId}?success`)
  });

  if (topicId) {
    var navigation = useMemo(() => ({
      title: 'Edit',
      parentType: 'topic',
      parentCache: topic,
      parentTitle: 'Topic',
      parentLink: `/boards/${boardId}/topics/${topicId}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
      requests: [deleteActionRequest]
    }), [topicId, topic, request, deleteActionRequest.error])
  } else {
    var navigation = useMemo(() => ({
      title: 'New topic',
      parentTitle: 'Board',
      parentLink: `/boards/?boardId=${boardId}`,
      actionTitle: 'Create',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
    }), [topicId, topic, request])
  }
  return <Page id="edit-topic" navigation={navigation}>
    <div>
      <Form action={`/boards/${boardId}/topics/${topicId || ''}`} formRef={formRef} onSubmit={onSubmit} method="post" encType="multipart/form-data">
        <FormField type="text" name="topic[name]" label="Topic title" required />
        <FormField type="textarea" name="topic[description]" label="Description" required />
        <FormField type="file" name="topic[icon]" label="Attach icon" />
        <FormField type="file" name="topic[cover]" label="Attach cover" />
        <FormField type="checkbox" name="topic[isHidden]" label="Hidden?" />

        <fieldset>
          <Grid 
            type="list" 
            headers={[
              {name: 'Link', type: 'link'},
              {name: 'Name'},
              {name: 'Prompt', type: 'action'},
            ]}
            rows={topicId ? [
              [
                `/boards/${boardId}/topics/${topicId}`,
                "Delete topic",
                <Icon.ChevronRight class="forward icon" />,
                {class: 'dangerous', confirm: "Are you sure to delete this topic? All discussions related to it will be deleted too!", method: "delete", onClick: onDeleteAction}
              ]
            ] : []} />
        </fieldset>
      </Form>
    </div>
  </Page>
}