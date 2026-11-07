import Chains from "../data/chains";
import { getEffect } from './market_force';
import * as MATH from "/lib/math";

const defaultNews = {
  'World news': {
    step: -1,
    chainIndex: -1,
    chainCycle: 0,
    index: 0
  },
  "Economics": {
    step: -1,
    chainIndex: -1,
    chainCycle: 0,
    index: 1
  },
  "Politics": {
    step: -1,
    chainIndex: -1,
    chainCycle: 0,
    index: 2
  }
}

const ChainWeights = {};


function getEstimate(marketCompositeForce, marketCompositeForceTarget, effect) {
  const max = Math.max(marketCompositeForceTarget, marketCompositeForce)
  const min = Math.min(marketCompositeForceTarget, marketCompositeForce)
  return Math.abs(1 / Math.abs(Math.min(5, Math.max(-5, marketCompositeForceTarget - marketCompositeForce)) - effect))
}

function getChainEvent(category, step, tags, marketCompositeForce, marketCompositeForceTarget, seed) {
  const options = category.chain[step];
  const forcedOptions = options.filter((option) => option.tags && option.tags.some((tag) => tags.includes(tag)))
  const usedOptions = forcedOptions.length ? forcedOptions : options;

  const random = MATH.seed(seed)
  return MATH.randomWeightedValue(usedOptions, (option) => {
    return Math.pow(getEstimate(marketCompositeForce, marketCompositeForceTarget, getEffect(option)), Math.max(3, Math.min(6, Math.abs(marketCompositeForceTarget - marketCompositeForce))));
  }, random);
}

for (var categoryName in Chains) {
  ChainWeights[categoryName] = {};
  for (var chainName in Chains[categoryName]) {
    const steps = Chains[categoryName][chainName];
    const stats = {
      minEffect: 0,
      maxEffect: 0,
      minLength: steps.length,
      maxLength: steps.length,
    };
    ChainWeights[categoryName][chainName] = stats;
    steps.forEach((options, year) => {
      options.forEach((option, index) => {
        //if (option.final && year < stats.minLength) {
        //  stats.minLength = year;
        //}
      });

      const sorted = options.slice().sort((a, b) => {
        return getEffect(a) - getEffect(b);
      });

      var bigEffect = getEffect(sorted[sorted.length - 1]) || 0
      var smallEffect = getEffect(sorted[0]) || 0;
      stats.minEffect = stats.minEffect ? (stats.minEffect + 1) * (smallEffect + 1) - 1 : smallEffect;
      stats.maxEffect = stats.maxEffect ? (stats.maxEffect + 1) * (bigEffect + 1) - 1 : bigEffect;
    })

  }

}


// shuffle chains, cycle through them
// if same chain comes up, the all events will be chosen alternatively
var gseed = Math.random()
export function NewsCategory(previousCategory, categoryName, { seed, turn, year, marketCompositeForce = 1, marketCompositeForceTarget = 1, marketCompositeForceTargetAhead = 1 }) {
   //seed = seed * 1000000
  const category = {
    ...previousCategory,
  };

  if (!category.chain || category.finished) {
    const randomChainOrder = MATH.seed(seed + category.index * 18887 + turn * 3333)
    category.chainIndex += 1;

    const list = Chains[categoryName];
    category.chainName = MATH.randomWeightedValue(Object.keys(list), (chainName) => {
      const chainStats = ChainWeights[categoryName][chainName];
      const minDifference = getEstimate(marketCompositeForce, marketCompositeForceTargetAhead, chainStats.minEffect);
      const maxDifference = getEstimate(marketCompositeForce, marketCompositeForceTargetAhead, chainStats.maxEffect);
      const avgDifference = getEstimate(marketCompositeForce, marketCompositeForceTargetAhead, chainStats.maxEffect - (chainStats.maxEffect - chainStats.minEffect) / 2);
      const bestDifference = Math.max(minDifference, maxDifference, avgDifference);
      return (Math.pow(bestDifference, Math.max(3, Math.min(6, Math.abs(marketCompositeForceTargetAhead - marketCompositeForce)))));
    }, randomChainOrder, true);

    category.chain = Chains[categoryName][category.chainName];
    category.step = -1;
    category.finished = false;
    category.events = []
    category.tags = [];
  }
  category.step += 1;
  category.event = getChainEvent(category, category.step, category.tags, marketCompositeForce, marketCompositeForceTarget, seed + category.index * 18887 + category.chainIndex * 2772 + year * 101011);
  
  category.tags = category.tags.concat(category.event.tags || []);

  const nextOptions = category.chain[category.step + 1];
  if (nextOptions && !category.event.final) {
    category.next = getChainEvent(category, category.step + 1, category.tags, marketCompositeForce + getEffect(category.event), marketCompositeForceTarget, seed + category.index * 18887 + category.chainIndex * 2772 + year * 101011);
  } else {
    category.next = null;
  }
  if (category.event.difficulty == null) {
    category.event.difficulty = 2 + Math.floor(Math.random() * 3);
  }
  if (category.event.final || !category.chain[category.step + 1]) {
    category.finished = true;
  }
  category.events = category.events.concat(category.event);
  return category;
}

const categories = ['World news', 'Economy', 'Politics']
export default function News({seed, year, news = defaultNews, marketCompositeForce, marketCompositeForceTarget, marketCompositeForceTargetAhead, turn}) {
  return Object.keys(news).reduce((newNews, categoryName, index) => {
    return {
      ...newNews,
      [categoryName]: NewsCategory(news[categoryName], categoryName, { seed, year, marketCompositeForce, marketCompositeForceTarget, marketCompositeForceTargetAhead, turn })
    }
  }, {});
}