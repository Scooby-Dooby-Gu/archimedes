//react-spring useContext/preact snafu fix
// https://github.com/preactjs/preact/pull/3165
import { options, toChildArray } from 'preact';
let old = options.__h;
options.__h = (c, i, type) => {
  if (type === 9) {
    let hooks = c && (c.__H || (c.__H = { __: [], __h: [] })) && c.__H.__;
    if (!hooks[i]) hooks[i] = Object.defineProperty({}, '__c', DESC);
  }
  if (old) return old(c, i, type);
};
const DESC = {
  get() { return this.c },
  set(v) { 
    this.c = typeof v === 'function' ? Object.assign({}, v) : v },
};

var oldR = options.__r;
options.__r = (vnode) => {
  const comp = window.currentComponent;
  window.currentComponent = vnode.type.displayName || vnode.type.name;
  const result =  oldR(vnode);
  //window.currentComponent = comp;
  return result;
}


var oldC = options.__c;
options.__c = (...args) => {
  window.currentComponent = '';
  return oldC(...args);
}


// https://github.com/preactjs/preact/issues/948
// https://gist.github.com/developit/3e807962630ddbd4977cbd07b597f24f
// Fix Preact rendering when Google Translate breaks the DOM
const FONT_AS_TEXT = {
  localName: {
    value: null
  },
  nodeType: {
    value: 3
  },
  data: {
    get() {
      return this._data;
    },
    set(v) {
      v += '';
      if (v === this._data) return;
      const t = document.createTextNode(this._data = v);
      this.parentNode.replaceChild(t, this);
      this.__v.__e = t;
    }
  }
};
const ib = Element.prototype.insertBefore;
Element.prototype.insertBefore = function(child, ref) {
  if (ref && ref.nodeType === 3 && child && child.localName === 'font') {
    for (let i in child) {
      if (i.startsWith('_gt_')) {
        ref._font = child;
        child._data = ref.data;
        Object.defineProperties(child, FONT_AS_TEXT);
        break;
      }
    }
  }
  return ib.apply(this, arguments);
};
const oldDiffedHook = options.diffed;
options.diffed = vnode => {
  if (vnode.type === null && vnode.__e) {
    const font = vnode.__e._font;
    if (font) {
      vnode.__e = font;
      font.__v = vnode;
      font.data = vnode.props;
    }
  }
  if (oldDiffedHook) {
    oldDiffedHook(vnode);
  }
};


function Placeholder({ property, value }) {
  if (property === 'text' || property === 'description') {
    return <span class="placeholders" property={property}><span class="placeholder"></span><span class="placeholder"></span></span>;
  } else if (value instanceof Number) {
    return <span class="placeholder number" property={property}></span>;
  } else if ( property === 'content') {
    return <span class="placeholders" property={property}><span class="placeholder" property="title"></span><span class="placeholder"></span><span class="placeholder"></span></span>;
  } else if (property.indexOf('Html') > -1 && property.indexOf('author') == -1) {
    return <span class="placeholders html" property={property}><span class="placeholder" property="title"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span><span class="placeholder"></span></span>;
  } else {
    return <span class="placeholder string" property={property}></span>;
  }
}

// render placeholders
let oldVnode = options.vnode;
options.vnode = vnode => {
  if (typeof vnode.type === 'string' && vnode.props && vnode.props.children) {
    const k = toChildArray(vnode.props.children).map(child => {
      if (child.isPlaceholder) {
        if (vnode.type == 'option' || vnode.type == 'textarea') {
          return String(child)
        }
        return <Placeholder property={child.__property} value={child} />
      }
      return child;
    });
    vnode.props.children = k.length<2 ? k[0] : k;
  }
  if (oldVnode) oldVnode(vnode);
};