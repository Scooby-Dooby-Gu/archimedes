import { useRef, useState } from "preact/hooks";

export default function Choice({options, index, interaction, answer, onChange, onInteract}) {
  const isRadio = options.filter((opt) => opt.correct).length < 2
  const type = isRadio ? 'radio' : 'checkbox'

  const [values, setValues] = useState(answer);

  const onInput = (e) => {
    const newValues = Array.prototype.map.call(
      e.target.closest('.options').querySelectorAll('input:checked'),
      (input) => {
        return input.value
      }
    );
    setValues(newValues);
    onChange(newValues);
    onInteract()
  }

  return <ul class="options" onInput={onInput}>
    {options.map((option) =>
      <li class={interaction == 'failure' && values.includes(String(option.index)) ? (option.correct ? 'correct' : 'incorrect') : null}>
        <label>
          <input type={type} name={`answer-${index}`} checked={interaction == 'success' && (answer || []).includes(String(option.index)) ? 'checked' : null} value={option.index} />{option.name}
        </label>
      </li>
    )}
  </ul>
}