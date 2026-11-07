import { h } from "preact";

/* # Recolorable icon system
All icons in the application use this system that bundles them
into a single file to dramatically speed up loading. Additionally
icon system allows fill color in the icon file to be changed
programmatically, so that icons can have multiple states
(e.g. `active`, `hover`, etc) without duplicate files.

To register a new icon in a system, it has to be placed under
`src/assets/atlas` directory. Then `yarn atlas` needs to be ran.
Path to the icon determines the name of a function:

  - `src/assets/icons/Shared/bold.svg`
    is `Icon.SharedBold()`
  - `src/assets/icons/Styler/GridEditor/gridIndividual.png`
    is `Icon.StylerGridEditorGridIndividual()`

The function returns a fully rendered react node, ready to be used
in the component tree. Supported options are:

  - `color`, a css-style color like `#fff` that will be used instead of
    the first fill color found in the icon source.
  - All regular react element attributes, like `className`, `onClick`, etc.

The reason why there's a separate `colorClassName` option, is because if
`className` also has tachyon color classes, we need to remove it from there,
because they may apply in a wrong order. If you want to change color dynamically,
providing it via `colorClassName` is your best bet. Otherwise it's fine to do it
via `className` as usual.

Icon dimensions are computed based on their ratio, so providing both height and width
is not necessary. Not providing any of those is valid too - icon will render at its default size.

If instead of fully rendered node, you'd like to get icon URL
(and still have benefits of atlas bundling), you can use `Icon.SharedBold.view`
property, which returns a url that can be used in CSS or HTML directly. There's also
`Icon.SharedBold.src` that will work in HTML, but that may not render correctly in CSS context.

*/
export default function ICON(ATLAS, dir) {

  function Icon(props) {
    if (!props.src && props.name) {
      Icon.find(props.name)
      props = {...ATLAS[props.name], ...props}
    }
    const src = props.src;
    if (!src) return;

    const {
      fill, class: className, color, svgAttributes, ...attributes
    } = props;
    const style = {
      cursor: props.onClick ? 'pointer' : undefined,
      ...attributes.style,
    };
    let resetDimensions;

    // do not set native svg dimensions together with style dimensions to avoid skewing ratio
    if (style.width || style.height) {
      resetDimensions = { width: undefined, height: undefined };
    }

    return h('svg', {
      className: `icon ${src.replace('#', '')} ${className || ''}`,
      version: '1.1',
      xmlns: 'http://www.w3.org/2000/svg',
      ...attributes,
      ...resetDimensions,
    }, [
      h('use', {
        style: {
          pointerEvents: 'none',
          color: (color === false && props.fill || color || 'currentColor'),
          fill: 'currentColor'
        },
        xlinkHref: src,
      }),
    ]);
  }

  // Alias icons to be usable if starting with lowercase letter
  Object.keys(ATLAS).forEach((path) => {
    ATLAS[path[0].toLowerCase() + path.substring(1)] = ATLAS[path];
    if (path.indexOf('Icons') > -1) {
      const name = path.replace('Icons', '')
      ATLAS[name[0].toLowerCase() + name.substring(1)] = ATLAS[path];
      ATLAS[name] = ATLAS[path];
    }
  })

  // List of known classes that define color that will be used as icon color
  Object.keys(ATLAS).forEach((name) => {
    const definition = ATLAS[name];
    Icon[name] = props => Icon({ ...definition, ...props });
    Icon[name].displayName = 'Icon.' + name;
    Object.assign(Icon[name], definition);
    Icon[name].view = `${dir}index.svg${definition.src}-view`;
  });

  // it's possible to use svg externally, but gradients wouldnt work.
  // so we instead load them into the dom
  Icon.load = (url) => {
    fetch(url).then((response) => {
      response.text().then((text) => {
        const root = document.querySelector(`div[url*="${url}"]`) || document.createElement('div');
        root.setAttribute('url', url)
        root.style.cssText = 'position: absolute; width: 0; height: 0; overflow: hidden; visibility: none; z-index: -1';
        root.innerHTML = text;
        if (!root.parentNode)
        document.body.appendChild(root);
      });
    });
  };

  Icon.find = (name) => {
    if (!name) return;
    const IconDefinition = Icon[name];
    if (!IconDefinition) {
      throw new Error(`Unknown icon: ${name}. Place an ${name}.svg file into \`src/assets\` and run \`npm run atlas\``)
    }
    return IconDefinition;
  }

  return Icon;
}
