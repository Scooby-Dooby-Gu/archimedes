import { useRef } from '/lib/hooks/index.jsx';

import List from './list';
import Table from './table';
import Cards from './cards';
import Tabs from './tabs';
import useSorting from './sortable';

export default function Grid({onSort, type, headers, rows, ...props}) {
  function groupByType(headers, row) {
    return headers.reduce((groups, header, index) => {
      const type = headers[index].type || 'default';
      return {
        ...groups,
        [type]: (groups[type] || []).concat({
          content: row[index],
          header
        })
      };
    }, {})
  }
  function findProps(row) {
    return row.find((col) => typeof col === 'object' && col && !Array.isArray(col) && !col.props) || {};
  }

  const items = rows.map((row) => ({
    ...row,
    ...groupByType(headers, row),
    props: findProps(row)
  }))

  const listRef = useRef();
  
  useSorting(listRef, onSort);


  if (type === 'cards') {
    return Cards({items, rows, forwardRef: listRef, headers, ...props});
  }
  if (type === 'tabs') {
    return Tabs({items, rows, forwardRef: listRef, headers, ...props});
  }
  //if (maxWidth >= 1200) {
  //  return Table(props);
  //} else {
    return List({items, rows, forwardRef: listRef, headers, onSort, ...props});
  //}
}