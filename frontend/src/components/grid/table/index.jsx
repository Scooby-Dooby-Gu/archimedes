import style from './style.module.scss';

export default function Table({rows, headers, forwardRef, ...props}) {
  return <table {...props} class={style.table} ref={forwardRef}>
    <thead>
      <tr>
        {headers.map((header) => {
          return <th>{header.name}</th>
        })}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, rowIndex) => <tr index={rowIndex}>
        {row.map((column) => {
          return <td>{column}</td>
        })}
      </tr>)}
    
    </tbody>
  </table>
}