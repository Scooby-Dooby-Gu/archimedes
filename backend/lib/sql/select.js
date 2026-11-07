import generate_expression from './expression.js';
import inflection from 'inflection';

export default function(table, query, condition, nesting) {

  function quote_literal(value) {
    return "'" + value.replace(/'/g, "''") + "'"
  }
  if (typeof plv8 != 'undefined')
    quote_literal = plv8.quote_literal

  function quote_ident(value) {
    if (!value.match(/^([a-z_]+|NULL)$/) || value.match(/^(null)$/))
      return '"' + value + '"'
    if (value.match(/^(order|select|insert)$/i))
      return '"' + value + '"';
    return value
  }
  if (typeof plv8 != 'undefined')
    quote_ident = plv8.quote_ident

  function generate_query_order(sort, groupped) {
    var order = '';
    for (var clause in sort) {
      if (order)
        order += ', '
      if (groupped) {
        if (sort[clause].match(/desc/i))
          order += 'max(' + quote_ident(clause) + ')'
        else
          order += 'min(' + quote_ident(clause) + ')'
      } else {
        order += quote_ident(clause)
      }
      if (sort[clause] && sort[clause].match(/^(?:desc|asc)(?:\s+nulls\s+last|\s+nulls\s+first)?$/i))
        order += ' ' + sort[clause].toUpperCase()
    }
    return order
  }

  function generate_conditions() {
    var conditions = '';
    for (var i = 0; i < arguments.length; i++)
      if (arguments[i])
        conditions += (conditions ? ' AND ' : '') + generate_expression(arguments[i])
    return conditions
  }

  function generate_attributes(query, alias, nesting, table) {
    var attributes = query.attributes || {id: 'id'}
    var columns = ''
    columns += (columns ? ',' : '') + '\n' + nesting + '  \'$type\', \'' + inflection.singularize(table) + '\'';
    if (Array.isArray(attributes))
      for (var i = 0; i < attributes.length; i++)  {
        if (typeof attributes[i] === 'string') {
          columns += (columns ? ',' : '') + '\n' + nesting + '  ' + quote_literal(inflection.camelize(attributes[i], true)) + ', ' + alias + '.' + quote_ident(inflection.underscore(attributes[i]))
        } else {
          columns += (columns ? ',' : '') + '\n' + nesting + '  ' + quote_literal(inflection.camelize(attributes[i].name, true)) + ', ' + alias + '.' + quote_ident(inflection.underscore(attributes[i].name))
        }
      }
    else 
      for (var attribute in attributes)
        columns += (columns ? ',' : '') + '\n' + nesting + '  ' + quote_literal(attribute) + ', ' + alias + '.' + quote_ident(attributes[attribute])
    for (var property in query) 
      if (typeof query[property] == 'object' && query[property] && objects.indexOf(property) == -1)
        columns += ',' + '\n' + nesting + '  ' + quote_literal(property) + ', associated_' + property + '.jsonb'
    return columns;
  }

  var objects    = ['page', 'where', 'having', 'filter', 'attributes', 'sort'];
  function generate_joins(query, table, nesting) {
    var joins = '';
    for (var property in query) {
      if (typeof query[property] == 'object' && query[property] && objects.indexOf(property) == -1) {
        var pluralized = query[property].table || inflection.pluralize(property)
        var single = query[property].singular || inflection.pluralize(property) != property;
        // use LATERAL for plural non-required relations  
        var lateral = !single && !query[property].required
        
        joins += '\n' + '\n' + nesting + (query[property].required ? 'INNER JOIN' : 'LEFT JOIN')
        var joinKey = query[property].key || query[property].primary || (query[property].foreign ? 'id' : inflection.singularize(table) + '_id')
        var foreignKey = (query[property].foreign || query.primary || 'id');
        var l = foreignKey.indexOf('_ids') > -1 ? ' = ANY(' : 
                joinKey.indexOf('_ids') > -1    ? ' && ARRAY[' :
                                                  ' = ';
        var r = foreignKey.indexOf('_ids') > -1 ? ')' :
                joinKey.indexOf('_ids') > -1    ? ']':
                                                  '';
        if (lateral) {
          joins += ' LATERAL'
          var joiner = (query[property].alias || pluralized) + '.' + joinKey + l + table + '.' + foreignKey + r
        } else {
          var joiner = ''
        }
        joins += ' (' + '\n' + nesting + '  '
        joins += generate_query(pluralized, {
          schema: query.schema,
          aliasKey: 'associated_' + property + '_' + joinKey,
          ...query[property]
        }, joiner, nesting + '  ', single, joinKey, lateral)
        joins += ')'
        joins += '\n' + nesting
        joins += 'AS associated_' + property
        joins += '\n' + nesting
        if (lateral) {
          joins += 'ON true' 
        } else {
          joins += 'ON associated_' + property + '_' + joinKey + l + table + '.' + foreignKey + r
        }
      }
    }
    return joins;
  }

  function generate_query_simple(table, query, condition, nesting, singular, key, limit, offset, lateral) {
    var joins      = generate_joins(query, (query.alias || table), nesting)
    var conditions = generate_conditions(condition, query.where, !nesting && query.filter, !nesting && query.having);
    var sql        = 'SELECT '
    if (lateral) {
      sql += 'ARRAY(SELECT '
    } else {
      sql += (query.alias || table) + '.' + (key || query.key || query.primary || 'id')
      if (query.aliasKey)
        sql += ' as ' + query.aliasKey
      sql += ', '
      if (!(query.singular || singular) && nesting)
        sql += 'array_agg('
    }
    sql += 'jsonb_build_object('
    sql += generate_attributes(query, query.alias || table, nesting, table)
    sql += '\n' + nesting + ')'
    if (!lateral && !(query.singular || singular) && nesting)
      sql += ')'
    sql += ' AS jsonb'

    sql += '\n' + nesting + 'FROM ' + (query.schema ? query.schema + '.' + table : table) + (query.alias ? ' ' + query.alias : '')

    sql += joins
    if (joins && (conditions || limit || query.sort))
      sql += '\n'

    if (conditions)
      sql += '\n' + nesting + 'WHERE ' + conditions

    if (query.sort)
      sql += '\n' + nesting + 'ORDER BY ' + generate_query_order(query.sort, nesting && !lateral)

    if (limit) {
      sql += '\n' + nesting + 'LIMIT ' + limit
      if (offset)
        sql += '\n' + nesting + 'OFFSET ' + offset
    }
    if (lateral) {
      sql += ') AS jsonb'
    }
    return sql;
  }

  // produce joinable query that uses GROUP BY
  // the upside is that it can be used in INNER JOIN
  // and thus produce implicit order for query outside
  // the downside is that LIMIT operation is not efficient,
  // since it still aggregates full dataset first and then 
  // omits unwanted items
  function generate_query_groupped(table, query, condition, nesting, singular, key, limit, offset) {
    var joins      = generate_joins(query, (query.alias || table), nesting)
    var conditions = generate_conditions(condition, query.where, !nesting && query.filter, !nesting && query.having);
    var sql        = 'SELECT ' + (query.alias || table) + '.' + (key || query.key || query.primary || 'id');
    if (query.aliasKey)
      sql += ' as ' + query.aliasKey
    sql += ', '
    if (limit)
      sql += '('
    sql += 'array_agg('
    sql += 'jsonb_build_object('
    sql += generate_attributes(query, query.alias || table, nesting, table)
    sql += '\n' + nesting + ')'

    if (query.sort) 
      sql += ' ORDER BY ' + generate_query_order(query.sort)

    sql += ')'
    if (query.filter)
      sql += ' FILTER (WHERE ' + generate_expression(query.filter) + ')'
    if (limit) 
      sql += ')[' + (offset + 1) + ':' + (limit + offset) + ']'
    sql += ' AS jsonb'
    sql += '\n' + nesting + 'FROM ' + (query.schema ? query.schema + '.' + table : table) + (query.alias ? ' ' + query.alias : '')

    sql += joins
    if (joins && (conditions || limit || query.sort))
      sql += '\n'

    if (conditions)
      sql += '\n' + nesting + 'WHERE ' + conditions

    sql += '\n' + nesting + 'GROUP BY 1'

    if (query.having)
      sql += '\n' + nesting + 'HAVING count(case when ' + generate_expression(query.having) + ' then 1 end) > 0'

    if (query.sort)
      sql += '\n' + nesting + 'ORDER BY ' + generate_query_order(query.sort, nesting && !singular)

    return sql;
  }

/*  function generate_query_lateral(table, query, condition, nesting, singular, key, limit, offset) {
    var joins      = generate_joins(query, table, nesting)
    var conditions = generate_conditions(condition, query.where, !nesting && query.filter, !nesting && query.having);
    var sql        = 'SELECT ' + (query.alias || table) + '.' + (key || query.key || query.primary || 'id') + ', '
    sql += 'jsonb_build_object('
    sql += generate_attributes(query, query.alias || table, nesting)
    sql += '\n' + nesting + ')'

    if (nesting && !(singular || query.singular) && query.sort) 
      sql += ' ORDER BY ' + generate_query_order(query.sort)

    if (nesting && !(singular || query.singular)) {
      sql += ')'
      if (query.filter)
        sql += ' FILTER (WHERE ' + generate_expression(query.filter) + ')'
      sql += ')'
    }

    sql += ' AS jsonb'
    sql += '\n' + nesting + 'FROM ' + (query.schema ? query.schema + '.' + table : table) + (query.alias ? ' ' + query.alias : '')

    sql += joins
    if (joins && (conditions || limit || query.sort))
      sql += '\n'

    if (conditions)
      sql += '\n' + nesting + 'WHERE ' + conditions

    if (query.sort)
      sql += '\n' + nesting + 'ORDER BY ' + generate_query_order(query.sort, nesting && !singular)

    if (limit) {
      sql += '\n' + nesting + 'LIMIT ' + limit
      if (offset)
        sql += '\n' + nesting + 'OFFSET ' + offset
    }
    return sql;
  } */

  function generate_query(table, query, condition, nesting = '', singular, key, lateral) {
    const pageParam = query.page && query.page.param ? '$' + parseInt(query.page.param) : query.page;
    const limitParam = query.limit && query.limit.param ? '$' + parseInt(query.limit.param) : query.limit;
      
    var limit = limitParam || 0;
    var offset = !limit ? 0 : pageParam ? '(' + pageParam + ' - 1) * ' + limitParam : query.offset || 0;
    
    if (lateral || !nesting || singular || query.singular) {
      return generate_query_simple(table, query, condition, nesting, singular, key, limit, offset, lateral)
    } else if (query.having && query.required) {
      return generate_query_groupped(table, query, condition, nesting, singular, key, limit, offset, lateral)
    } else {
      return generate_query_groupped(table, query, condition, nesting, singular, key, limit, offset, lateral)
    }
  }
  return generate_query(table, query, condition, nesting)
}
