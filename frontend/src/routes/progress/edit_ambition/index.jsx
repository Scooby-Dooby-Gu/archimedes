
import { update } from "/lib/immutability";
import { slug } from '/lib/formatters';
import { Button, Grid, Page, Icon, FormField } from '/components/index.jsx';
import { useEffect, useAsyncLink, useMemo, useAsyncForm, useFetchedData, useFormData } from "/lib/hooks";
import { Placeholder } from "/lib/request";
import { generateSlugsFromName } from "/lib/slugs";
import { commaSeparatedList } from "/lib/parsers";
import style from "../edit_goal/style.module.scss";
import { useStore } from "/lib/state";

const initialData = Placeholder({
  ambition: {
    question: {
      options: ["", ""]
    }
  },
});

export default function EditAmbition({ambitionId}) {
  const [writers, writersRequest] = useFetchedData(`/users?role=writer,admin,manager`)
  const ambitions = useStore('data.ambitions');

  const [deleteActionRequest, onDeleteAction] = useAsyncLink(() => {
    route(`/ambitions/?success=ambition`);
  });

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/ambitions/${response.data.ambition.id}?success=ambition`);
  }, undefined, (data) => update(data, {
    ambition: {
      authorId: () => (writers.find((w) => w.name == data.ambition.author) || {}).id,
      slugs: commaSeparatedList
    }
  }));

  var [savedData = initialData, ambitionRequest] = useFetchedData(ambitionId ? `/ambitions/${ambitionId}` : null)
  
  const author = writers.find((w) => savedData.ambition.authorId == w.id);
  savedData = useMemo(() => update(savedData, {
    ambition: {
      slugs: (s) => (s || []).join(', '),
      author: (e) => author && author.name,
      question: (q) => q || { options: ["", ""] }
    }
  }), [savedData, author]);


  const [formData, updateFormData, formRef] = useFormData(savedData, (data, old) => update(data, {
    ambition: {
      slugs: (slugs) => generateSlugsFromName(data.ambition.name, slugs, old.ambition.name)
    }
  }), [ambitions]);

  var navigation = useMemo(() => ({
    title: ambitionId ? 'Edit' : 'New ambition',
    parentTitle: ambitionId ? 'Ambition' : 'Ambitions',
    parentLink: `/ambitions/${ambitionId}`,
    actionTitle: ambitionId ? 'Save' : 'Create',
    actionRequest: request,
    actionHandler: () => onSubmit(formRef.current),
    requests: [ambitionRequest]
  }), [request, ambitionRequest])

  return useMemo(() => <Page navigation={navigation}>
    <form action={`/ambitions/${ambitionId || ''}`} onSubmit={onSubmit} ref={formRef} method="post" encType="multipart/form-data">
      <FormField type="text" name="ambition[name]" label="Ambition name" required />
      <FormField type="text" name="ambition[slugs]" label="URL Slug" required />

      <FormField type="text" name="ambition[tagline]" label="Tagline" required />
      <FormField type="text" name="ambition[description]" label="Description" required />
      <FormField type="file" name="ambition[image]" label="Cover image" />
      <FormField type="select" label="Availability">
        <select name="ambition[type]">
          <option value="initial">Available from the start</option>
          <option value="regular">After initial ambition is done</option>
          <option value="hidden">Hidden</option>
        </select>
      </FormField>
      <FormField type="select" label="Previous ambition">
        <select name="ambition[previousAmbitionId]">
          <option>None</option>
          {ambitions.map((a) => a.id != ambitionId && <option value={a.id}>
            {a.name}
          </option>)}
        </select>
      </FormField>
      <FormField type="select" label="Color">
        <select name="ambition[color]" required>
          <option value="blue">Blue</option>
          <option value="lightblue">Light Blue</option>
          <option value="green">Green</option>
          <option value="purple">Purple</option>
          <option value="red">Pink</option>
          <option value="orange">Orange</option>
          <option value="pink">Pink</option>
          <option value="yellow">Yellow</option>
        </select>
      </FormField>
      <FormField type="text" name="ambition[author]" singular={true} placeholder="Written by author" list={writers.isPlaceholder ? [] : writers.map((t) => t.name )} />
      <fieldset class={style.question}>
          <FormField name={`ambition[question][intro]`} placeholder="Intro" type="text" />
          <FormField name={`ambition[question][title]`} placeholder="Question" type="textarea" />
          <ul class={style.options}>
            { formData.ambition.question.options.map((option, a) => <li class="option row" index={a}>
              <input name={`ambition[question][options][${a}]`}  value={option} type="text" placeholder="Option" />
              <Icon.Close onClick={() => updateFormData((d) => update(d, { ambition: { question: { options: { $splice: [[a, 1]]}}}}))} />
            </li>)}
          </ul>
          <Button onClick={() => updateFormData((d) => update(d, { ambition: { question: { options: { $pushOrCreate: [""]}}}}))} icon="Add">Add option</Button>
        </fieldset>
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
              `/ambitions/${ambitionId}`,
              "Delete ambition",
              <Icon.ChevronRight class="forward icon" />,
              {class: 'dangerous', confirm: "Are you sure to delete the ambition?", method: "delete", onClick: onDeleteAction}
            ]
          ] : []} />
      </fieldset>
    </form>
  </Page>, [savedData, formData.ambition.question.options, navigation, writers, ambitions]);
}