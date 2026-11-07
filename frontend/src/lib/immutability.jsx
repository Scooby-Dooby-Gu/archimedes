import updateSpec from 'immutability-helper';

import { isEqual } from './helpers';

export function update(object, spec) {
  if (object.isPlaceholder) return object;
  const newObject = updateSpec(object, spec);
  return newObject;
}


updateSpec.extend('$pushOrCreate', function(value, object) {
  return object ?
    update(object, { $push: value }):
    value;
});


updateSpec.extend('$setIfNotEqual', function(newValue, oldValue) {
  return isEqual(oldValue, newValue) ? oldValue : newValue;
});

export default update;