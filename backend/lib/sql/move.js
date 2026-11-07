export default function MOVE(table, key = 'id', scopeAttributes = [], sortAttributes = {}, fallbackSortAttributes = {'created_at': 'desc'}) {
  var scope = scopeAttributes.map((a, i) => ` AND "${a}" = $${i + 1}`);
  var sorting = Object.keys(sortAttributes).map((a) => `"${a}" ${sortAttributes[a]}, `);
  var fallbackSorting = Object.keys(fallbackSortAttributes).map((a) => `, "${a}" ${fallbackSortAttributes[a]}`);
  var keyParam = 2 + scopeAttributes.length;
  var idParam = 1 + scopeAttributes.length;
  return `UPDATE "${table}" c
  SET "order" = CASE
    WHEN c.${key} = $${idParam} THEN
      $${keyParam}
    WHEN c2.new_order < $${keyParam} THEN
      c2.new_order
    ELSE
      c2.new_order + 1
    END
  FROM (
    SELECT ${key}, row_number() OVER (
      ORDER BY ${sorting}"order" asc NULLS LAST${fallbackSorting}
    ) as new_order
    FROM ${table}
    WHERE ${key} != $${idParam}${scope}
  ) c2
  WHERE c2.${key} = c.${key} 
     OR c.${key} = $${idParam}${scope}
  RETURNING *`
}