export default function UPSERT (table, columns, conflict = 'id', keepIfNull = [], neverOverwrite = []) {
  if (table.indexOf('.') > -1) {
    var sequence = `"${table.split('.')[0]}"."${table.split('.')[1]}_id_seq"`;
  } else {
    var sequence = `"${table}_id_seq"`
  }
  const columnsQuoted = columns.map((c) => `"${c}"`)
  var values = columns.map((col, index) => {
    var colQuoted = columnsQuoted[index]
    // if given null value, keep the current value
    const fallback = keepIfNull.indexOf(col) > -1 ? `coalesce(excluded.${colQuoted}, target.${colQuoted})` : colQuoted;
    // do not overwrite value if it's 
    return neverOverwrite.indexOf(col) > -1 ? `coalesce(target.${colQuoted}, ${fallback})` : fallback;
  })
  return `INSERT into ${table} as target (id, ${columnsQuoted.join(',')})
  SELECT coalesce(r.id, nextval('${sequence}')), ${columnsQuoted.join(',')}
  FROM json_populate_record(NULL::${table}, $1) r
ON CONFLICT (${conflict}) DO 
UPDATE 
  SET(${columnsQuoted.join(', ')})=
    ((select ${values.join(',')} from json_populate_record(NULL::${table}, $1)))
RETURNING *`
}