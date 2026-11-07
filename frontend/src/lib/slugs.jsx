
export function formatSlug(value) {
  const separator = "-"
  return value
      .toString()
      .normalize('NFD')                   // split an accented letter in the base letter and the acent
      .replace(/[\u0300-\u036f]/g, '')   // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 -]/g, '')   // remove all chars not letters, numbers and spaces (to be replaced)
      .replace(/\s+/g, separator);
};

export  function getSlug(object) {
  return object.slugs && object.slugs[0] || object.id;
}
export function matchSlug(object, slug) {
  return slug && (object.slugs && object.slugs.includes(slug) || object.id == slug);
}

export function generateSlugsFromName(name = "", slugs = "", oldName) {
  if (typeof slugs == 'object') return slugs.join(', ');
  if (slugs && (name === oldName || !oldName)) return slugs;
  return formatSlug(name);
}

export function generateListFromMappedValues(left = [], right = [], propertyLeft = 'id', propertyRight = 'name') {
  return left.map((leftItem) => {
    const o = right.find((rightItem) => leftItem == rightItem[propertyLeft]);
    if (o) return o[propertyRight] ;
  }).filter(Boolean).join(', ')
}
export function generateMappedValuesFromList(left = '', right = [], propertyLeft = 'id', propertyRight = 'name') {
  return left.trim().split(/\s*[,;]\s*/g).map((value) => {
    const w = right.find((writer) => writer[propertyRight] == value);
    if (w) return w[propertyLeft];
  }).filter(Boolean)
}