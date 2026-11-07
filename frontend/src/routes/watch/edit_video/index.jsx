
import { useAsyncLink } from '../../../lib/hooks';
import { Grid, Icon, Editor, Page, Form, FormField } from '/components/index.jsx';
import { useMemo, useAsyncForm, useFetchedData, useFormData } from "/lib/hooks";
import update from '/lib/immutability';

const initialData = {
  video: {}
};
import { generateListFromMappedValues, generateMappedValuesFromList, generateSlugsFromName } from '/lib/slugs';

export default function EditVideo({videoId}) {

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/videos/${response.data.video.id}?success=video`);
  }, undefined, (data) => {
    return update(data, {
      video: {
        expertIds: () => generateMappedValuesFromList(data.video.experts, writers, 'id', 'name')
      }
    })
  })

  var [currentData = initialData, videoRequest] = useFetchedData(videoId ? `/videos/${videoId}` : null)
  var [writers, writersRequest] = useFetchedData(`/users?role=writer,admin,manager`, {
    placeholderState: []
  })
  

  currentData = useMemo(() => update(currentData, {
    video: {
      experts: () => generateListFromMappedValues(currentData.video.expertIds, writers, 'id', 'name')
    }
  }), [currentData, writers])

  const [videoData, updateFormData, formRef] = useFormData(currentData, (data, old) => update(data, {
    video: {
      slugs: (slugs) => generateSlugsFromName(data.video.name, slugs, old.video.name)
    }
  }));

  var navigation = useMemo(() => ({
    title:       videoId ? 'Edit video'         : 'New video',
    parentTitle: videoId ? 'Video'              : 'Videos',
    parentLink:  videoId ? `/videos/${videoId}` : `/videos/`,
    actionTitle: videoId ? 'Save'               : 'Create',
    actionRequest: request,
    actionHandler: () => onSubmit(formRef.current),
    requests: [videoRequest]
  }), [request, videoRequest.error])


  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/videos/?success=video`)
  });

  return useMemo(() => <Page navigation={navigation}>
    <form action={`/videos/${videoId || ''}`} onSubmit={onSubmit} ref={formRef} method="post" encType="multipart/form-data">
      <FormField type="text" name="video[name]" label="Video name" required />
      <FormField type="text" name="video[slugs]" label="URL Slug" required />

      <FormField type="text"  name="video[experts]" placeholder="Comma separate list of expert names" list={writers.isPlaceholder ? [] : writers.map((t) => t.name )} />
      
      <FormField type="file" name="video[image]" label="Cover image" />
      <FormField label="Schedule date" type="date" name="video[scheduledAt]" autocomplete="off"  />
      <FormField label="Publication date" type="date" name="video[publishedAt]" autocomplete="off"  />
      
      <FormField label="Summary" type="html" class="glossary">
        <Editor rows="5" name="video[summaryHtml]" placeholder="Excerpt announcing the video" required></Editor>
      </FormField>

      <FormField label="Content" type="html" class="glossary">
        <Editor rows="5" name="video[contentHtml]" placeholder="Content that shows up on the video page" required></Editor>
      </FormField>

      <FormField label="Footer" type="html" class="glossary">
        <Editor rows="5" name="video[footerHtml]" placeholder="Content that shows up at the bottom of the video page" required></Editor>
      </FormField>

      <fieldset>
          <Grid 
            type="list" 
            headers={[
              {name: 'Link', type: 'link'},
              {name: 'Name'},
              {name: 'Prompt', type: 'action'},
            ]}
            rows={videoId ? [
              [
                `/videos/${videoId}`,
                "Delete video",
                <Icon.ChevronRight class="forward icon" />,
                {class: 'dangerous', confirm: "Are you sure to delete this video?", method: "delete", onClick: onDeleteAction}
              ]
            ] : []} />
        </fieldset>
    </form>
  </Page>, [writers, currentData, navigation]);
}