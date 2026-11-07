import inflection from 'inflection';

export const camelizeObject = (object) => {
  if (Array.isArray(object)) {
    return object.map(camelizeObject);
  }
  if (typeof object !== 'object') {
    return object;
  }
  const newObject = {};
  for (var property in object) {
    const camelized = property.includes('_') ? inflection.camelize(property, true) : property;
    newObject[camelized] = typeof object[property] == 'object' && object[property] && !(object[property] instanceof Date) ? camelizeObject(object[property]) : object[property];
  }
  return newObject
}

export const underscoreObject = (object) => {
  if (Array.isArray(object)) {
    return object.map(camelizeObject);
  }
  if (typeof object !== 'object') {
    return object;
  }
  const newObject = {};
  for (var property in object) {
    const camelized = property.match(/[A-Z]/) ? inflection.underscore(property, true) : property;
    newObject[camelized] = typeof object[property] == 'object' && object[property] && !(object[property] instanceof Date) ? underscoreObject(object[property]) : object[property];
  }
  return newObject
}

export const nullifyObject = (object) => {
  if (Array.isArray(object)) {
    return object.map(camelizeObject);
  }
  if (typeof object !== 'object') {
    return object;
  }
  const newObject = {};
  for (var property in object) {
    newObject[property] = object[property];
    if (object[property] === '') {
      newObject[property] = null;
    }
  }
  return newObject
}