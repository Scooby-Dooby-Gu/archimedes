import getCompanyEvents from "../data/events";
import consequences from "../data/consequences";
import warnings from "../data/warnings";
import * as MATH from '/lib/math';

export function Events({news}) {
  const yearEvents = Object.values(news).map((category) => {
    return category.event
  })
  /*
  const random = MATH.seed(seed + year + 11111)
  const count = Math.floor(2 + random() * 3);
  const yearEvents = [];
  for (var i = 0; i < count; i++) {
    const placement = random() * maxFrequency;
    for (var j = 0; j < events.length; j++) {
      const event = events[j];
      const frequency = getFrequency(event);
      if (placement > frequency) {
        placement -= frequency
      } else {
        if (!yearEvents.some((e) => e.conflicts && e.conflicts.includes(event.title))) {
          if (event.group !== 'personal' || age > 18) {
            event.chance = getFrequency(event)
            yearEvents.push(event);
            if (event.causes) {
              yearEvents.push(...event.causes.map((title) => ({
                ...events.find((e) => e.title === title),
                cause: event
              })))
            }
          }
        }
        break;
      }
    }
  } */
  return yearEvents;
}

export function StockEvents({companies, year, seed, turn}) {
  return companies ? companies.map((company, index) => {
    const news = MATH.shuffle(getCompanyEvents(company), MATH.seed(seed + index * 110991999 + Math.floor(turn % 9)));
    const random = MATH.seed(seed + index * 110991999 + turn * 19991199737)
    if (random() > 1/3) {
      return news[turn % news.length]
    }
  }).filter(Boolean) : [];
}

export function Consequences(state, actions, previous, data)  {
  return consequences.map((consequence) => {
    const match = consequence.condition(state, actions, consequence, data);
    return match && (match === true ? consequence : match)
  }).filter(Boolean);
}

export function Warnings(state, actions)  {
  return warnings.map((consequence) => {
    const match = consequence.condition(state, actions, consequence);
    return match && (match === true ? consequence : match)
  }).filter(Boolean);
}