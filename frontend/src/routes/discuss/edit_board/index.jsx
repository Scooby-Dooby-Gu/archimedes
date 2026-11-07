import { useMemo, useAsyncForm, useFetchedData, useFormData } from '/lib/hooks/index.jsx';
import { Form, Button, FormField, Page } from '/components/index.jsx';


export default function EditBoard({boardId}) {
  const [currentBoard] = useFetchedData(boardId ? `/boards/${boardId}` : null);

  const [{ board }, updateFormData, formRef] = useFormData(currentBoard);

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/boards/${response.data.board.id}?success`);
  });

  if (boardId) {
    var navigation = useMemo(() => ({
      title: 'Edit',
      parentType: 'board',
      parentCache: board,
      parentTitle: 'Board',
      parentLink: `/boards/${boardId}`,
      actionTitle: 'Save',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current)
    }), [board, request])
  } else {
    var navigation = useMemo(() => ({
      title: 'New board',
      parentTitle: 'Boards',
      parentLink: `/boards`,
      actionTitle: 'Create',
      actionRequest: request,
      actionHandler: () => onSubmit(formRef.current)
    }), [request])
  }

  return <Page id="edit-board" navigation={navigation}>
    <Form action={`/boards/${boardId || ''}`} formRef={formRef} onSubmit={onSubmit} method="post" encType="multipart/form-data">
      <FormField type="text" name="board[name]" label="Board title" required />
      <FormField type="textarea" name="board[description]" label="Board description" required />
      <FormField type="file" name="board[image]" label="Attach image" />
    </Form>
    
  </Page>
}