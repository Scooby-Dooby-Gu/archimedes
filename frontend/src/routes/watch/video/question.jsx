import style from './style.module.scss';
import { useState, useAsyncForm, useAsyncLink,  useFormData } from '/lib/hooks/index.jsx';
import { Editor, Icon, Button, FormField } from '/components/index.jsx';
import * as formatters from '/lib/formatters';
import * as parsers from '/lib/parsers';
import update from '/lib/immutability';
import { useMemo } from 'preact/hooks';



export default function Question ({video, question, isEditable, isExpandable, transcriptionHtml}) {
  const [expanded, setExpanded] = useState(false);

  const defaultData = useMemo(() => {
    return {
      question: update(question, {
        timestamp: () => formatters.interval(question.seconds)
      })
    }
  }, [expanded])

  const [request, onSubmit] = useAsyncForm((response) => {
    route(`/videos/${video.slugs[0]}?success=question` + Math.random());
    setExpanded(false);
  });

  const [deleteActionRequest, onDeleteAction] = useAsyncLink((response) => {
    setExpanded(false);
    route(`/videos/${video.slugs[0]}?success=question` + Math.random());
  });
  
  const [{ question: questionData }, updateFormData, formRef] = useFormData(defaultData, (data) => update(data, {
    question: {
      seconds: () => data.question.timestamp ? parsers.timestamp(data.question.timestamp) : ''
    }
  }), [expanded]);

  return <li class={`${style.question} ${expanded && !isEditable && question.transcriptionHtml && style.expanded}`}>
    {(!expanded || !isEditable) && question.seconds != null && <aside class={style.timestamp}>
      <a href={`/videos/${question.videoId}/#${formatters.interval(question.seconds)}`} class="timestamp">{formatters.interval(question.seconds)}</a>
    </aside>}
    {<h2 onClick={() => isExpandable && setExpanded((v) => !v)}>
      {(isEditable || question.transcriptionHtml) && <Icon class={style.toggle} name={expanded ? 'Up' : 'Down'} />}
      {(!expanded || !isEditable) && question.content}
    </h2>}
    {expanded && !isEditable && question.transcriptionHtml && <section class="chapter content article">
      {transcriptionHtml}  
    </section>}
    {expanded && isEditable && <form action={`/videos/${question.videoId}/questions/${question.id}`} method="post" ref={formRef} onSubmit={onSubmit}>
      <div class={style.actions}>
        <Button href={`/videos/${question.videoId}/questions/${question.id}`} method="delete" icon="Close" class="transparent round" onClick={(e) => confirm("Are you sure to delete this question?") && onDeleteAction(e)}>Delete</Button>
        <Button.Submit class="primary" loading={request.loading} disabled={request.loading}>Save</Button.Submit>
      </div>
      {request.error && <p class="error">{String(request.error)}</p>}
      <FormField name="question[content]" type="textarea" placeholder="Question under 140 characters" />
      <FormField name="question[timestamp]" type="text" label="Timestamp" />
      <input name="question[seconds]" type="hidden"/>
      <FormField name="question[isImportant]" type="checkbox" label="Is important" />
      <FormField label="Transcription / Reply" type="html">
        <Editor rows="5" name="question[transcriptionHtml]" placeholder="Text elaborating on the topic" required></Editor>
      </FormField>
    </form>}
  </li>
}