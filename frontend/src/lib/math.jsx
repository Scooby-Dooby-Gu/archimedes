export function seed(i) {
  if (isNaN(i) || i == null) {
    alert('Seed is null')
    debugger;
  }
  var m_w = 123456789;
  var m_z = 987654321;
  var mask = 0xffffffff;

    m_w = (123456789 + i) & mask;
    m_z = (987654321 - i) & mask;

  // Returns number between 0 (inclusive) and 1.0 (exclusive),
  // just like Math.random().
  return  () => {
      m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
      m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
      var result = ((m_z << 16) + (m_w & 65535)) >>> 0;
      result /= 4294967296;
      return result;
  }
}

export function randomValue(array, random = Math.random) {
  return array[Math.floor(random() * array.length)];
}


function normalizeWeights(array) {
  const max = Math.min.apply(Math, array);
  return array.map((n) => n / max);
}
export function randomWeightedValue(input, weighter, random) {
  const array = shuffle(input, random);
  const weights = normalizeWeights(array.map(weighter));
  const sum = weights.reduce((sum, weight) => sum + weight, 0);

  const randomized = random();
  var value = randomized * sum

  for (var i = 0; i < array.length; i++) {
    var weight = weights[i];
    if (value > weight) {
      value -= weight;
    } else {
      return array[i];
    }
  }

}

export function shuffle(oldArray, random = Math.random, forceDifferent) {
  const array = oldArray.slice();
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  if (forceDifferent && JSON.stringify(array) == JSON.stringify(oldArray) && array.length !== 1) {
    return shuffle(oldArray);
  }
  return array;
}