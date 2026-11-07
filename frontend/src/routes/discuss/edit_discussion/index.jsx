import { useStore, useAsyncLink, useMemo, useAsyncForm, useFetchedData, useFormData } from '/lib/hooks/index.jsx';
import { Grid, Icon, Form, Button, FormField, Page } from '/components/index.jsx';


export default function({boardId, topicId, discussionId, name, description, lessonId}) {
  const [{ topic }, topicRequest, reloadTopic] = useFetchedData(`/boards/${boardId}/topics/${topicId}`)
  const board = topic.board;

  const { auth: { user, canManage } } = useStore();

  const [currentDiscussion] = useFetchedData(discussionId ? `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}` : null)

  const initialValues = useMemo(() => {
    if (discussionId != null) {
      return currentDiscussion;
    } else if (lessonId) {
      return {discussion: { name, description, lessonId } };
    }
  }, [discussionId, currentDiscussion])

  const [{ discussion }, updateFormData, formRef] = useFormData(initialValues);

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/boards/${boardId}/topics/${topicId}/discussions/${response.data.discussion.id}?success`);
  });
  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/boards/${boardId}/topics/${topicId}?success`)
  });


  if (discussionId) {
    var navigation = useMemo(() => ({
      title: 'Edit',
      parentType: 'discussion',
      parentCache: {discussion},
      parentTitle: 'Discussion',
      parentLink: `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current),
      requests: [deleteActionRequest]
    }), [discussion, request, deleteActionRequest.error])
  } else {
    var navigation = useMemo(() => ({
      title: 'New discussion',
      parentType: 'topic',
      parentCache: {topic},
      parentLink: `/boards/${boardId}/topics/${topicId}`,
      actionTitle: 'Post',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current)
    }), [topic, request])
  }

  return <Page id="edit-discussion" navigation={navigation}>
    <Form action={`/boards/${boardId}/topics/${topicId}/discussions/${discussionId || ''}`} formRef={formRef} onSubmit={onSubmit} method="post" encType="multipart/form-data">
      <FormField type="text" name="discussion[name]" label="Discussion title" required />
      <FormField type="textarea" name="discussion[description]" label="Your question" required />
      <FormField type="file" name="discussion[image]" label="Attach image" />

      {canManage && [
        <FormField type="checkbox" name="discussion[closedAt]" label="Closed?" />,
        <FormField type="checkbox" name="discussion[pinnedAt]" label="Pinned?" />,
        lessonId && <FormField type="hidden" name="discussion[lessonId]" />,
        lessonId && <em>Will be associated with lesson #{lessonId}</em>
      ]}
      
      <fieldset>
        <Grid 
          type="list" 
          headers={[
            {name: 'Link', type: 'link'},
            {name: 'Name'},
            {name: 'Prompt', type: 'action'},
          ]}
          rows={discussionId ? [
            [
              `/boards/${boardId}/topics/${topicId}/discussions/${discussionId}`,
              "Delete discussion",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to delete this discussion? All replies to it will be deleted too!", method: "delete", onClick: onDeleteAction}
            ]
          ] : []} />
      </fieldset>
    </Form>
  </Page>
}