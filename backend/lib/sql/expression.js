export default function(query, separator) {
  if (typeof query == 'string')
    return query;
  
  // aggregate array values, invoke given function with arguments and skip null
  function array_join(array, fn, separator, arg) {
    var text = '';
    for (var i = 0; i < array.length; i++) {
      var bit = fn(array[i], arg);
      if (bit != null)
        text += (text ? separator : '') + bit;
    }
    return text
  }

  function quote_literal(value) {
    return "'" + value.replace(/'/g, "''") + "'"
  }
  if (typeof plv8 != 'undefined')
    quote_literal = plv8.quote_literal

  function quote_ident(value) {
    if (value.match(/^([a-z0-9_]+)\.(.+?)$/i)) {
      return value.replace(/^([a-z0-9_]+)\.(.*?)$/i, (m, prefix, attribute) => {
        return quote_ident("associated_" + prefix) + '.' + quote_ident(attribute)
      });
    }
    if (!value.match(/^([a-z0-9_]+|null)$/i) || value.match(/^(null)$/i))
      return '"' + value + '"';
    return value
  }
  if (typeof plv8 != 'undefined')
    quote_ident = plv8.quote_ident

  // process single value
  function generate_value(value) {
    switch (typeof value) {
      case 'string':
        if (value === 'null')
          return 'NULL';
        return quote_literal(value);
      case 'object':
        if (value === null)
          return 'NULL'
        if (value.col)
          return quote_ident(value.col)
        if (value.paramArray)
          return 'ANY($' + parseInt(value.paramArray) + ')';
        if (value.param)
          return '$' + parseInt(value.param);

        return
      case 'number': case 'boolean':
        return value;
    }
  }

  // process binary operator (over given key)
  function generate_operator(operator, target, separator) {
    var text = '';
    if (!separator)
      separator = 'AND'
    //var keys = Object.keys(operator)//.sort()
    //for (var k = 0; k < keys.length; k++) {
    //  var key = keys[k];
    for (var key in operator) {
      var value = operator[key];
      if (text.length)
        text += ' ' + separator + ' '
      switch(key) {
        case 'not': case '$not':
          if (Array.isArray(value)) {
            if (value && value[0] && typeof value[0] == 'object' && !value[0].col) {
              text += 'NOT ('
              text += array_join(value, generate_operator, ' AND ', target)
              text += ')'
            } else {
              text += 'NOT IN ('
              text += array_join(value, generate_value, ', ')
              text += ')'
            }
          } else if (value && typeof value === 'object') {
            text += 'NOT (' + generate_operator(value, target, 'AND') + ')'
          } else if (value === null) {
            text += quote_ident(target) + ' IS NOT NULL'
          } else {
            text += quote_ident(target) + ' <> ' + generate_value(value)
          }

          break;
        case 'or': case '$or':
          if (Array.isArray(value)) {
            text += '('
            text += array_join(value, generate_operator, ' OR ', target)
            text += ')'
          } else if (value && typeof(value) == 'object') {
            text += '('
            text += generate_operator(value, target, 'OR');
            text += ')'
          }
          break;
        case 'and': case '$and':
          if (Array.isArray(value)) {
            text += array_join(value, generate_operator, ' AND ', target)
          } else if (value && typeof(value) == 'object') {
            text += generate_operator(value, target, 'AND');
          }
          break;
        case 'gt': case '$gt':
          text += quote_ident(target) + ' > ' + generate_value(value)
          break;
        case 'gte': case '$gte':
          text += quote_ident(target) + ' >= ' + generate_value(value)
          break;
        case 'lt': case '$lt':
          text += quote_ident(target) + ' < ' + generate_value(value)
          break;
        case 'lte': case '$lte':
          text += quote_ident(target) + ' <= ' + generate_value(value)
          break;
        case 'eq': case '$eq':
          text += quote_ident(target) + ' = ' + generate_value(value)
          break;
        case 'neq': case '$ne': case '$neq':
          text += quote_ident(target) + ' != ' + generate_value(value)
          break;
        case 'between': case '$between':
          if (Array.isArray(value) && value.length == 2) 
            text += quote_ident(target) + ' BETWEEN ' + generate_value(value[0]) + ' AND ' + generate_value(value[1]);
          break;
        case 'nbetween': case '$nbetween':
          if (Array.isArray(value) && value.length == 2) 
            text += quote_ident(target) + 'NOT  BETWEEN ' + generate_value(value[0]) + ' AND ' + generate_value(value[1]);
          break;
        case 'in': case '$in':
          if (Array.isArray(value)) {
            text += quote_ident(target)            
            text += ' IN ('
            text += array_join(value, generate_value, ', ')
            text += ')'
          } else {
            text += quote_ident(target) + ' = ANY(' + generate_value(value) + ')'
          }
          break;
        case 'nin': case '$nin':
          if (Array.isArray(value)) {
            text += quote_ident(target)
            text += ' NOT IN ('            
            text += array_join(value, generate_value, ', ')
            text += ')'
          } else {
            text += quote_ident(target) + ' != ' + generate_value(value)
          }
          break;
        case 'intersect': case '$intersect':
          text += quote_ident(target) + ' && ' + generate_value(value)
          break;
      }
    }
    return text
  }


  function generate_expression(query, separator) {
    if (!separator)
      separator = 'AND'
    var text = '';
    //var keys = Object.keys(query)//.sort()
    //for (var k = 0; k < keys.length; k++) {
    //  var key = keys[k];
    for (var key in query) {
      var value = query[key];
      var bit = undefined;

      switch (typeof value) {
        case 'string':
        case 'number':
        case 'boolean':
          var bit = quote_ident(key) + ' = ' + generate_value(value);
          break;
        case 'object':
          if (Array.isArray(value)) {
            switch (key) {
              case 'or': case '$or':
                var bit = '(' + array_join(value, generate_expression, ' OR ') + ')'
                break;
              case 'and': case '$and':
                var bit = array_join(value, generate_expression, ' AND ')
                break;
              default:
                var bit = quote_ident(key) + ' IN (' + array_join(value, generate_value, ', ') + ')'
                break;
            }
          } else if (value === null) {
            var bit =  quote_ident(key) + ' is NULL';
          } else if (value.col) {
            var bit = quote_ident(key) + ' = ' + generate_value(value);
          } else if (value.param || value.paramArray) {
            var bit = quote_ident(key) + ' = ' + generate_value(value);
          } else {
            switch (key) {
              case 'or': case '$or':
                var bit = '(' + generate_expression(value, 'OR') + ')'
                break;
              case 'and': case '$and':
                var bit = generate_expression(value, 'AND')
                break;
              case 'not': case '$not':
                var bit = 'NOT (' + generate_expression(value, 'AND') + ')'
                break;
              case 'param':
                var bit = generate_value(value);
                break;
              default:
                var bit = generate_operator(value, key)
            }
          }

      }
      if (bit.length) {
        if (text.length) {
          text += ' ' + separator + ' ' + bit
        } else {
          text += bit
        }
      }
    }
    return text;
  }

  return generate_expression(query);
}