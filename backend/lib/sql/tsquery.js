/**
 * parse any string to a valid pg tsquery
 * @param  {string} q
 * @returns {string}
 */
function tsquery(q) {
  q = q.trim()
      .replace(/\s*&\s*/, '&')
      .replace(/\s*\|\s*/, '|')
      .split(/\s+/).map(function(bit) {
        return bit.replace(/\*$/, '*')
      }).join('&')
  return toStr(parse(q || ''));
}


if (!String.prototype.trimLeft) {
  /* istanbul ignore next */ // good enough shim, for old node engines
  String.prototype.trimLeft = String.prototype.trim;
}

// consume unparsable tail string (when too many closing parens, ex: 'foo ) bar')
function parse(str) {
  var node = parseOr(str);
  var tail = node && node.input && node.input.replace(/^[\s|,&+<:)\]]+/, '');
  while (tail) {
    var right = parseOr(tail);
    if (!right) {
      return node;
    }
    node = {
      type: /^[|,]/.test(tail) ? '|' : '&',
      left: node,
      right: right,
      input: right.input
    };
    tail = node.input;
  }
  return node;
}

var SEP = /^[\s|,&+<:!]*/;

var OR = /^\s*(?:[|,]|or)/;

var AND = /^(?!\s*(?:[|,]|or))(?:[\s&:|,!]|and)*/;

var FOLLOWED_BY = /^\s*<(?:(?:(\d+)|-)?>)?/;

var WORD = /^[\s*&<:,|]*([!]*)([^\s|,&<:*()[\]!]+)/;

function parseOr(str) {
  var s = str;
  var node = void 0;

  do {
    var m = s.match(OR);
    var right = void 0;
    var negated = void 0;
    if (m) {
      var s2 = s.slice(m[0].length);
      var m2 = s2.match(SEP);
      right = parseAnd(s2.slice(m2[0].length));
      negated = /(?:\s|^)[!-]$/.test(m2[0]);
    } else {
      right = parseAnd(s);
    }

    if (!right) {
      return node;
    }
    right.negated = right.negated || negated;

    node = node ? {
      type: '|',
      left: node,
      right: right,
      input: right.input
    } : right;

    s = node.input;
  } while (node && node.input);

  return node;
}

function parseAnd(str) {
  var node = parseFollowBy(str);

  while (node && node.input) {
    var m = node.input.match(AND);

    if (!m) {
      return node;
    }

    var s = node.input.slice(m[0].length);
    var m2 = s.match(SEP);
    var right = parseFollowBy(s.slice(m2[0].length));

    if (!right) {
      return node;
    }

    right.negated = right.negated || /(?:\s-|!)$/.test(m[0]) || /(?:\s|^)[!-]$/.test(m2[0]);

    node = {
      type: '&',
      left: node,
      right: right,
      input: right.input
    };
  }
  return node;
}

function parseFollowBy(str) {
  var node = parseWord(str);

  while (node && node.input) {
    var m = node.input.match(FOLLOWED_BY);

    if (!m) {
      return node;
    }

    var s = node.input.slice(m[0].length);
    var m2 = s.match(SEP);
    var right = parseWord(s.slice(m2[0].length));

    if (!right) {
      return node;
    }

    right.negated = right.negated || /[!-]$/.test(m2[0]);

    node = {
      type: m[1] ? '<' + m[1] + '>' : '<->',
      left: node,
      right: right,
      input: right.input
    };
  }
  return node;
}

function parseWord(str) {
  var s = str.trimLeft();
  var par = s.match(/^\s*[!-]*[([]/);
  if (par) {
    var s2 = s.slice(par[0].length);
    var node = parseOr(s2);
    return Object.assign(node, {
      negated: node.negated || par[0].length > 1,
      input: node.input.trimLeft().replace(/^[)\]]/, '')
    });
  }
  var m = s.match(WORD);

  if (m === null) {
    return;
  }
  var next = s.slice(m[0].length);
  var prefix = next.match(/^(\*|:\*)*/)[0];
  return {
    value: m[2],
    negated: m[1],
    input: next.slice(prefix.length),
    prefix: prefix
  };
}

var PRECEDENCES = {
  '|': 0,
  '&': 1,
  '<': 2
};

function toStr() {
  var node = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var s = node.negated ? '!' : '';
  var type = node.type;
  if (!type) {
    return node.value && s + node.value + (node.prefix ? ':*' : ''); // avoid just '!'
  }

  var leftStr = toStr(node.left);
  var rightStr = toStr(node.right);

  if (node.left.type && PRECEDENCES[node.type[0]] > PRECEDENCES[node.left.type[0]] && !node.left.negated) {
    // wrap left in parens
    leftStr = '(' + leftStr + ')';
  }
  if (node.right.type && PRECEDENCES[node.type[0]] > PRECEDENCES[node.right.type[0]] && !node.right.negated) {
    // wrap right in parens
    rightStr = '(' + rightStr + ')';
  }
  return s ? s + '(' + leftStr + node.type + rightStr + ')' : leftStr + node.type + rightStr;
}


export  { parse, toStr };

export default tsquery;