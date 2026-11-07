export default function Img({src, srcset, ...props}) {
  if (!src) {
    return;
  }
  if (typeof srcset === 'object' && srcset) {
    var newset = [];
    var maxSize = 0;
    for (var property in srcset) {
      if (srcset[property] && property !== 'default' && property !== 'isPlaceholder') {
        maxSize = Math.max(parseInt(property), maxSize);
        newset.push(srcset[property] + ' ' + parseInt(property) + 'w');
      }
    }
    newset.push(srcset.default + ' ' + (maxSize + 1) + 'w')
    srcset = newset.join(',')
  }
  if (src) {
    if (src && src.isPlaceholder) {
      return <img src={src}/>
    } else {
      const dimensions = src.match(/@(\d+)x(\d+)/);
      if (dimensions && !props.width) {
        var extras = {width: dimensions[1], height: dimensions[2]}
      }
      return <img key={src} crossorigin={src.match(/archimedes.*s3/) && 'anonymous'}  {...extras} src={src} {...(srcset ? {srcset} : {})} sizes="(min-width: 784px) calc(100vw - 400px), 100vw" {...props} />
    }
  }
}
