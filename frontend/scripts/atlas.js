/* eslint-disable import/no-extraneous-dependencies */
/*
Run this task as `yarn atlas` to generate an optimized
svg atlas out of icons in `src/assets/atlas` folder. It also generates
`src/assets/atlas/index.js` manifest file with icon meta information.
Each icon is available in format of Icon.FolderFile({}) function
*/

const svgstore = require('svgstore');
const fs = require('fs');
const glob = require('glob');
const _ = require('lodash');
const inflection = require('inflection');

const sprites = svgstore({
  // renameDefs: true,
  cleanSymbols: ['id'],
});

let manifest = `/* eslint-disable camelcase */
`;
let counter = 0;
const dupes = {};
const dir = process.argv[process.argv.length - 1]

// compile svg atlas
glob(dir + '/**/*.svg', {}, (er, files) => {

  let y = 0;
  let views = '';
  files.forEach((file) => {
    if (file.indexOf('index.svg') > -1) return;
    // clean up the svg

    const variants = [file];
    if (file.includes('symbols'))
      variants.push(file.replace('.svg', '.white.svg'));;

    const content = fs.readFileSync(file, 'utf8')
      .replace(/<!--.*?-->/g, '')
      .replace(/<title>.*?<\/title>/g, '')
      .replace(/<desc>.*?<\/desc>/g, '')
      .replace(/\s+</g, `
<`)
      .replace(/ +/g, ' ');

    variants.map((variant) => {


      // allow first fill color in the SVG to be recolorable via `color`
      const colors = content.match(/(?:fill)="([^"]+)"/g) || [];
      const uniqueColors = colors.reduce((list, match) => {
        const color = match.match(/"([^"]+)"/)[1];
        if (color !== 'none' && list.indexOf(color) === -1 && color.indexOf('url') === -1) {
          return list.concat(color);
        }
        return list;
      }, []);

      // generate name for icon
      const name = inflection.camelize(variant.split(dir)[1].replace('.svg', '').replace(/[/.-]/g, '_').replace(/ic_(.*?)_48px/, '$1').replace(/^\d/, 'the_$1'));

      const svg = content.match(/<svg[^>]+>/);
      // extract dimensions from width/height attributes
      const width = svg[0].match(/width="([^"%]+?)(?:px|pt)?"/);
      const height = svg[0].match(/height="([^"%]+?)(?:px|pt)?"/);
      const style = svg[0].match(/style="([^"]+?)"/);

      const viewBox = content.match(/ viewBox="([^"]+)"/) || (width && height && ['', `0 0 ${width[1]} ${height[1]}`]) || null;
      const viewBoxProperty = viewBox ? `, viewBox: '${viewBox[1]}'` : '';


      // or fall back to viewbox dimensions
      const dimensions = viewBox ? viewBox[1].match(/0 0 ([\d./]+) ([\d./]+)/) : null;
      const dimensionsProperty = dimensions ? `, width: ${width ? width[1] : dimensions[1]}, height: ${height ? height[1] : dimensions[2]}` : '';

      // export the icon and its default color to manifest
      manifest += `export const ${name} = {\n  src: '#I${name}', fill: '${uniqueColors[0] || 'currentColor'}'${viewBoxProperty}${dimensionsProperty},\n};\n`;

      // https://css-tricks.com/svg-fragment-identifiers-work/
      if (viewBox && dimensions) {
        viewBox[1].replace(/0 0 ([\d./]+) ([\d./]+)/, (m, w, h) => {
          views += `<view id="I${name}-view" viewBox="0 ${y} ${w} ${h}" preserveAspectRatio="xMinYMin slice"/>\n`;
          views += `<use xlink:href="#I${name}" viewBox="${viewBox[1]}" style="color: ${(name.includes('White') ? '#D0FCFF' : uniqueColors[0] || 'black')}" width="${w}" height="${h}" x="0" y="${y}" />\n`;
          y += parseInt(h, 10);
        });
      }

      let defs = '';
      const result = content
      // remove default viewbox
        .replace(viewBox ? viewBox[0] : '', '')

      // prefix ids and imports to coexist within single atlas svg
        .replace(/id="/g, `id="I${name}_`)
        .replace(/class="/g, `class="I${name}_`)
        .replace(/\.([a-zA-Z0-9_]*?)\s*{/g, `.I${name}_$1 {`)
        .replace(/url\(#/g, `url(#I${name}_`)
        .replace(/href="#/g, `href="#I${name}_`)
        .replace(/i:extraneous/g, `extraneous`)
        .replace(/serif:id/g, `id`)

        .replace(/<defs>[\s\S]*?<\/defs>/i, (m) => {
          defs = m;
          return '<!-- defs -->';
        })
      // replace first fill color with `currentColor` to be recolorable
        .replace(new RegExp(`"${uniqueColors[0]}` || 'currentColor', 'g'), '"currentColor')
        .replace('<!-- defs -->', defs);

      counter += 1;
      dupes[result] = (dupes[result] || []).concat(name);
      sprites.add(`I${name}`, result, {symbolAttrs: {style: style && style[1] || '' , 'stroke-linecap': true, 'stroke-miterlimit': true}});
    });
  })

  _.forEach(dupes, (names) => {
    if (names.length > 1) {
      console.log('Dupe icons:', names);
    }
  });

  const atlas = String(sprites).replace('</svg', `${views}</svg`).replace(/<g>[\s\n\t]*?<\/g>/ig, '');
  console.log(`${counter} icons written`, `${Math.floor(atlas.length / 1024)}KB`);
  fs.writeFileSync(dir + '/index.svg', atlas);
  //fs.writeFileSync(dir + '/index.txt', atlas);
  fs.writeFileSync(dir + '/index.jsx', manifest);
});