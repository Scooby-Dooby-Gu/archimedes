import update from '/lib/immutability';
import * as formatters from '/lib/formatters'; 
import { breakDownLoan, prepayLoan } from '../generators/loans';
import { retirementPlans } from '../generators/companies';
import * as MATH from '/lib/math';
import { RetirementContributionMatch1, RetirementContributionMatch2 } from '../generators/retirement';
import { Taxes, getIncomeTax } from '../generators/taxes';
import isEqual from 'fast-deep-equal';
import { computePropertyPrice } from '../generators/property';
import properties from './properties';

const loanOptions = [
  {
    value: 2,
    years: 2,
    title: '2yr loan',
    class: 'third-extra',
    rate: 0.04,
    actions: [{type: 'borrow', rate: 0.04, years: 2}]
  },
  {
    value: 3,
    years: 3,
    title: '3yr loan',
    class: 'third-extra',
    rate: 0.0425,
    actions: [{type: 'borrow', rate: 0.0425, years: 3}]
  },
  {
    value: 4,
    years: 4,
    title: '4yr loan',
    class: 'third-extra',
    rate: 0.045,
    actions: [{type: 'borrow', rate: 0.045, years: 4}]
  },
  {
    value: 5,
    years: 5,
    title: '5yr loan',
    class: 'third-extra',
    rate: 0.0475,
    
    actions: [{type: 'borrow',rate: 0.0475, years: 5}]
  },
  {
    value: 6,
    years: 6,
    title: '6yr loan',
    class: 'third-extra',
    rate: 0.05,
    actions: [{type: 'borrow', rate: 0.05, years: 6}]
  },
  {
    value: 7,
    years: 7,
    title: '7yr loan',
    class: 'third-extra',
    rate: 0.0525,
    actions: [{type: 'borrow', rate: 0.0525, years: 7}]
  }
]

const sectorOptions = [
  {
    title: 'Technology, Consumer, Utilities',
    effect: "Unlocks tickers PEAR, FFOD and EDI",
    description: "You want to invest high growth industries that are riskier. You're interested in companies like Pear, Fair Foods, Hip Coffee, and Edison Electric Co. ",
    image: 'BadgesBucket1',
    industries: ['Technology', 'Consumer Staples', 'Consumer Discretionary', 'Utilities', 'Real Estate']
  },
  {
    title: 'Financial, Raw Materials, Telecommunications',
    effect: "Unlocks tickers WFIN, QWERT and HUDIS",
    description: "You want to invest in sectors that follow economic cycles more closely. You're interested in companies like Qwertz Industries, NUFONE, and WuTang Financials.",
    image: 'BadgesBucket2',
    industries: ['Financials', 'Materials', 'Communications', 'Real Estate']
  },
  {
    title: 'Healthcare, Industrials, Energy',
    effect: "Unlocks tickers WCH, READ and SHALE",
    description: "You want to take a more defensive approach and invest in stocks that typically do well in recessions. You're interested in companies like White Cross Healthcare, Reading Railroad, Shale Gasoline.",
    image: 'BadgesBucket3',
    industries: ['Healthcare', 'Industrials', 'Energy', 'Real Estate']
  }
]

function preparePayment(payment, { cash, portfolio, houses, riskFreeRate }, choice, subject = 'The price', loanName = 'loan') {
  return update(payment, {
    icon: () => 'BadgesOptions',
    description: (description) => description || `${subject} is ${formatters.currency(choice.price)} and you have ${formatters.currency(cash)} cash in the bank.`,
    options: payment.options.map((option) => {
      const tip = (portfolio.length > 0 || houses.length > 0) && `Consider selling some of your ${formatters.and([
        portfolio.length > 0 && 'stock', 
        houses.length > 0 && 'property'
      ])}.` || ''
      if (option.years) {
        if (option.requirement) {
          var disabled = cash < choice.price && '**There is not enough cash in your bank account.**'
          var effect = '-' + formatters.currency(choice.price / option.years) + ' for ' + option.years + 'yrs';
        } else {
          const loan = option.actions[0];
          const { yearlyPayment, totalInterest } = breakDownLoan({...loan, riskFreeRate, sum: (choice.price * (1 - (option.actions[0].downpayment || 0)))}).pop();
          var disabled = cash < loan.downpayment * choice.price && `**You don’t currently have enough in your savings** to meet the down payment requirement for the ${loanName} of \`${formatters.currency(loan.downpayment * choice.price)}\`. ${tip}`;
          var description = '';
          description += loan.downpayment ? `**A downpayment of ${formatters.currency(loan.downpayment * choice.price)} is required**. ` : ''
          if (option.class !== 'third' && option.class !== 'third-extra') {
            description += totalInterest ? `Given the terms of the loan, you'll pay \`${formatters.currency(yearlyPayment)}\` each year and the total interest over the life of the ${loanName} is \`${formatters.currency(totalInterest)}\`.` : ``
          }
        }
      } else {
        var effect = '-' + formatters.currency(choice.price)
        var disabled = cash < choice.price && `You don’t currently have enough in your savings for an all cash offer. ${tip}`;
      }
      return {
        $merge: {
          effect: option.effect || effect, 
          description: description || option.description,
          disabled,
          riskFreeRate
        }
      }
    })
  })
}

function formatRetirementPlan(plan) {
  if (plan.match1) {
    return `$1 for every $1 that you contribute for up to ${formatters.rate(plan.match1)} of your salary and ${formatters.currency(plan.match2Portion)} for every $1 for the next ${formatters.rate(plan.match2 - plan.match1)}`
  } else {
    return `$1 for every $1 that you contribute for up to ${formatters.rate(plan.match2)} of your salary`
  }
}

function prepareStartupOffer(offer, salaryExpectation, job) {
  const salary = salaryExpectation * .75;
  return update(offer, {
    $merge: {
      title: `Working at a start-up`, 
      description: `The CEO of a start-up offered you a salary, a 401(k) match, and stock options that vest over 4 years. The stock options could be worth a lot of money if the company does well.`,
      effect: `${formatters.currency(salary, undefined, 0)}/yr, ${formatters.rate(retirementPlans[0].max)} 401(k) match, and 0.5% ownership`,
    },
    actions: {
      0: {
        $merge: {
          id: formatters.uuid(), 
          title: `Accepted a start-up offer`,
          meta: `${formatters.currency(salary, undefined, 0)}/yr, ${formatters.rate(retirementPlans[0].max)} 401(k) match, and 0.5% ownership`,
          context: 'Startup',
          kind: 'startup',
          retirementPlan: retirementPlans[0],
          salary: salary, 
          description: `Invigorated by the entrepreneurial spirit, you are excited about the fast-paced work environment of a start-up. The CEO mentioned that they expect to IPO in 5 years.`
        }
      }
    }
  })
}

function prepareCorporateOffer(offer, company, salaryExpectation, job) {
  const salary = salaryExpectation * company.salaryPortion;
  const shares = Math.floor(salaryExpectation * (1 - company.salaryPortion) / company.price);
  const isSalaryHigh = company.salaryPortion >= .92;

  return update(offer, {
    $merge: {
      title: `Job offer from ${company.name}`, 
      description: `The hiring manager has offered you a compensation package that includes 
        a ${isSalaryHigh ? 'higher' : 'lower'} starting salary, 
        a 401(k) with a ${company.retirementPlan.title.toLowerCase()} company match, 
        and ${isSalaryHigh ? 'less' : 'more'} equity compensation.`,
      effect: `${formatters.currency(salary, undefined, 0)} cash, ${shares} shares/yr as RSUs, ${formatters.rate(company.retirementPlan.max)} 401(k) match`,
    },
    actions: {
      0: {
        $merge: {
          id: formatters.uuid(),
          context: company.name, 
          kind: 'corporate',
          salary: salary, 
          ticker: company.ticker,
          title: `Accepted offer from ${company.name}`,
          description: `You're excited to start working at ${company.name}! Your total compensation includes a salary, a 401(k), and equity in the company.`,
          meta: `${formatters.currency(salary, undefined, 0)}/yr, ${shares} shares/yr as RSUs, ${formatters.rate(company.retirementPlan.max)} 401(k) match`,
          stock: company.name,
          retirementPlan: company.retirementPlan
        }
      }
    }
  })
}

function prepareRetirementContributionOption(option, job, salary) {
  const opts = {
    retirementContributionTarget: option.value,
    retirementPlan: job.retirementPlan,
    salary
  };
  const matched = RetirementContributionMatch1(opts) + RetirementContributionMatch2(opts);
  const taxesReduction = getIncomeTax(salary) - getIncomeTax(salary - (option.value - matched))
  
  if (option.minimal && !opts.retirementPlan.match1Portion) {
    return update(option, {
      $merge: {
        title: formatters.currency(matched),
        description: `Provided by employer: ${formatters.currency(matched)}`,
        effect: 'FREE',
        value: 0,
        actions: [
          {
            type: 'retirementContribution',
            title: `Declined to participate in 401(k)`,
            description: `I set your 401(k) participation to 0% and your employer still contributes ${formatters.currency(matched)} on your behalf. You have better ideas of how to put the cash to work right now.`
          }
        ]
      }
    })
  }
  return update(option, {
    $merge: {
      description: `Matched by employer: ${formatters.currency(matched)}`,
      effect: '-' + formatters.currency(option.value - matched) + '/yr',
      hidden: option.value <= matched,
      actions: [
        {
          type: 'retirementContribution',
          title: `Started saving for retirement`,
          meta: `+${formatters.currency(option.value)}/yr toward retirement`,
          description:  `You made a financially responsible decision to save for retirement. Your contribution is also lowering your taxes by ${formatters.currency(taxesReduction, 999999)} this year!`,
          value: option.value
        }
      ]
    }
  })
} 

const buyHouse = {
  type: 'property',
  chains: ['property-buy'],
  name: 'house',
  cta: 'See what’s on the market',
  icon: 'BadgesProperty',
  scene: ['Property-Buy'],
  parameters: {
    houseChoice: {
      title: 'Buying property',
      description: ({houses, turn}) => 
        turn != 12 
          ? `Real estate can be a good investment. You can stop paying rent and move into a home or you could earn income by renting out that property to others. You work with a real estate agent to see what is currently on the market.`
        : houses.length > 0
          ? `Tomas asks if you've thought about buying any property yet. You tell him that you have! 

          Excited, he says you must know all about property as an investment and that you can earn income by renting it out! He asks if you wouldn't mind taking a look with him.`
          : `Tomas asks if you've thought about buying any property yet. You tell him that you haven't and that you're renting. 

          He hasn't bought property either and was wondering if you wouldn't mind looking at the market with him. 
          
          It can feel good emotionally to own your place but it can also be a good investment. He says you could make rental income from your property if you'd rather stay in your apartment.`,
      options: [
        {
          title: 'Condominium',
          description: `The small 2Br 1Ba condo is on the outskirts of the city. It isn't the nicest place but you think the property value could rise rapidly as the area continues to gentrify and young professionals look for cheaper alternatives outside of the city.`,
          actions: [
            {
              type: 'buyHouse', 
              kind: 'residential',
              name: 'Condominium',
              description: 'You decided to invest in an improving neighborhood and now you own a small 2Br 1Ba condo just outside the city.', 
            }
          ]
        },
        {
          title: 'Single family home',
          description: 'Tucked away in an artsy neighborhood of the city is this cozy 3Br 2Ba single family home. The neighborhood and local schools have been improving over the past decade which has attracted young families. You think the property value will continue to appreciate quickly as more people move there, and rental units are in demand.',
          actions: [
            {
              type: 'buyHouse', 
              kind: 'residential',
              name: 'Single family home',
              description: 'You decided to invest in a nice neighborhood and now you own a small 3Br 2Ba single family home!', 
            }
          ]
        },
        {
          title: 'Luxury Condo',
          description: 'Overlooking City Park, this 3Br 3Ba condo is in a new building with excellent amenities that attract wealthy residents. Based on the desirability and exclusivity, You think the property will increase in value over time and it would provide impressive rental income because of the high demand.',
          actions: [
            {
              type: 'buyHouse', 
              kind: 'residential',
              name: 'Luxury Condo',
              description: 'You just found out that you are neighbors with some famous actors!',
            }
          ]
        },
        {
          title: 'Keep renting',
          description: 'You are not quite ready to invest in a house right now.',
          actions: [
            {
              type: 'moveOut', 
              expenses: 24000, 
              title: 'Continued renting', 
              description: 'The housing market seemed expensive. You decided to continue renting and wait before purchasing.'
            },
          ]
        },
      ],
    },
    payment: {
      title: 'How do you want to finance your purchase?',
      options: [
        {
          title: 'Pay with cash',
          description: 'No need to finance, You’ll put down an all cash offer.',
          actions: [
            {type: 'pay', kind: 'property'}
          ]
        },
        {
          title: 'Finance with a 15 year mortgage',
          description: '',
          years: 15,
          rate: 0.0275,
          actions: [{
            type: 'borrow',
            kind: 'mortgage',
            name: '15 year mortgage',
            description: 'You can decide to prepay your mortgage owed on this property at any time. If you decide to sell the house, the mortgage will be paid back prior to receiving any proceeds.',
            years: 15,
            rate: 0.0275,
            downpayment: 0.2
          }]
        },
        {
          title: 'Finance with a 30 year mortgage',
          description: '',
          years: 30,
          rate: 0.0225,
          actions: [{
            type: 'borrow',
            kind: 'mortgage',
            name: '30 year mortgage',
            description: 'You can decide to prepay your mortgage owed on this property at any time. If you decide to sell the house, the mortgage will be paid back prior to receiving any proceeds.',
            years: 30,
            rate: 0.0225,
            downpayment: 0.2,
          }]
        }
      ]
    }
  },
  prepare: (decision, state, { houseChoice }) => {
    const { turn } = state;
    const price = houseChoice && houseChoice.price && computePropertyPrice(properties.find((p) => p.name === houseChoice.name), state, [])
    const newDecision = update(decision, {
      parameters: {
        houseChoice: {
          options: Object.keys(decision.parameters.houseChoice.options).map((k) => {
            const option = decision.parameters.houseChoice.options[k];
            if (!option.actions[0].name) {
              return {};
            }
            const property = properties.find((p) => p.name === option.actions[0].name)
            return {
              $merge: property,
              price: {
                $set: computePropertyPrice(property, state, [])
              },
            }
          })
        },
        payment: {
          description: {
            $set: `The property is currently listed for ${houseChoice && formatters.currency(price)} and you currently have ${formatters.currency(state.cash)} of cash in the bank. You can also raise more cash by selling some investments. Mortgage downpayment requirements are 20% of the purchase price.`,
          }
        }
      }
    });
    /*
    if (turn > 12) {
      return update(newDecision, {
        $merge: {
          title: 'Buy another house?',
          description: 'Find another investment property and rent it out for passive income.'
        }
      })
    } */
    return newDecision;
  },
  react: (decision, state, { houseChoice }) => {
    if (houseChoice && houseChoice.price) {
      return update(decision, {
        parameters: {
          payment: {
            $set: preparePayment(decision.parameters.payment, state, houseChoice, 'The purchase price for the house', 'mortgage') 
          }
        }
      })
    } else {
      return update(decision, {
        parameters: {
          $unset: ['payment']
        }
      });
    }
  },
  finalize: (decision, {houseChoice, payment}, state, log) => {
    if (!houseChoice.price) {
      return houseChoice.actions || [];
    }
    const id = formatters.uuid();
    return (houseChoice.actions || []).concat(update(payment.actions[0], {
      $merge: {
        riskFreeRate: state.riskFreeRate,
        sum: houseChoice.price * (1 - (payment.actions[0].downpayment || 0)),
        context: houseChoice.name
      }
    })).map((action) => update(action, {
      $merge: {
        id,
        expenses: houseChoice.expenses
      }
    }))
  },
}

const Choices = {
  empty: {
    type: 'story',
    name: 'empty',
    scene: { name: 'Cafe' },
    chains: ['empty'],
    title: '',
    description: '',
    parameters: {},
    finalize: () => [],
    isApplicable: () => true,
    isOutstanding: () => false
  },

  customize: {
    type: 'story',
    name: 'customize',
    scene: { name: 'Cafe-Creation' },
    chains: ['customize'],
    parameters: {
      choice: {
        title: 'Create character',
        options: []
      },
    },
    finalize: (decision, values, state, log) => {
      return [{type: 'character', ...values.choice}]
    },
    isOutstanding: () => true,
    isApplicable: ({ turn }) => turn === -1,
    isDeferred: true,
    isCancellable: false
  },

  start: {
    type: 'story',
    name: 'difficulty',
    chains: ['customize'],
    scene: { name: 'Cafe-Billboard', actors: ['grandma'] },
    icon: 'BadgesOptions',

    parameters: {
      choice: {
        title: 'Select Difficulty',
        description: ({name}) => `EVILCorp, a front for a white collar crime syndicate led by Mr. Sinister, is growing in the city.

        They are looking to expand their foothold by snatching up small businesses.
        
        Build relationships and become the investor you're meant to be to stop them from taking your family's business!`,
        
        options: [
          {
            title: 'Easy difficulty',
            image: 'BadgesEasy',
            effect: 'You’re given $150k to help you get a head start',
            description: `For first time investors and those who are new to investing.`,
            actions: [
              {
                type: 'difficulty', 
                value: 'easy', 
                name: 'Taking it easy',
                effect: '+$150K in cash', 
                description: `You've decided to play on Easy difficulty.`, 
                amount: 150000},
            ]
          },
          {
            title: 'Medium difficulty',
            image: 'BadgesMedium',
            effect: 'You’re given $50k to make your own luck',
            description: `For those who have stepped up to the challenge before and are looking for a tougher market environment.`,
            actions: [
              {
                type: 'difficulty', 
                value: 'medium', 
                name: 'Stepping it up', 
                effect: '+$50K in cash',
                amount: 50000, 
                description: "You've decided to play on Medium difficulty."},
            ]
          },
          {
            title: 'Hard difficulty',
            image: 'BadgesHard',
            effect: 'You start with $2.5k... and a box of matches',
            description: `For seasoned veterans looking to sharpen their skills and those that laugh in the face of recessions. Buckle up for a roller-coaster ride.`,
            actions: [
              {
                type: 'difficulty', 
                value: 'hard', 
                name: 'Roughing it', 
                amount: 2500, 
                effect: '+$2.5K in cash',
                description: "You've decided to play on Hard difficulty."},
            ]
          }
        ],
      }
    },
    isOutstanding: () => true,
    isApplicable: ({ turn }) => turn === -1,
  },


  college: {
    type: 'career',
    name: 'college',
    scene: { name: 'University-Prompt' },
    chains: ['career'],
    dependentChains: ['job-search', 'job-offer', 'retirement-plan'],
    icon: 'BadgesEducation',
    parameters: {
      choice: {
        title: 'Go to college or work',
        description: `Your parents pushed you to do well in school. You were accepted to a top private university and a cheaper in-state university. 

Are you going to keep making money working at the Burger Czar or go to college to get a higher paying job in the future?`,
    
        options: [
          {
            price: 50000 * 4,
            years: 4,
            title: 'Top private university',
            description: "While more expensive, going to a top university is worth the cost because the knowledge, relationships, and experience will help you find top-paying jobs.",
            effect: "Tuition is $50K/yr for 4 years, highest starting job salaries",
            actions: [
              {
                type: 'enroll', 
                kind: 'elite college',
                tier: 'college', 
                level: 'elite',
                name: 'Undergraduate at an Ivy League',
                years: 4, 
                meta: ({year}) => `Graduating in ${year + 4}`,
                price: 50000 * 4,
                title: 'Enrolled at an Ivy League',
                description: 'You pack everything you own into a few boxes and arrive at the gorgeous campus. The history and reputation of the school is amazing and you are excited to spend the next 4 years here.'
              }
            ]
          },
          {
            title: 'In-state university',
            price: 20000 * 4,
            years: 4,
            description: "The in-state school provides you a more affordable college education that gives you the knowledge, experience, and relationships to find a good job afterwards.",
            effect: "Tuition is $20K/yr for 4 years, starting salaries are lower than the top university",
            actions: [
              {
                type: 'enroll', 
                kind: 'regular college',
                tier: 'college', 
                level: 'regular',
                name: 'Undergraduate at an in-state university', 
                title: 'Enrolled at an in-state university',
                description: `You pack everything you own into a few boxes and arrive at  campus for freshman orientation. You've already made a few friends, the school is a great fit for you, and you're excited to spend the next 4 years here.`,
                years: 4, 
                meta: ({year}) => `Graduating in ${year + 4}`,
                price: 20000 * 4
              }
            ]
          },
          {
            title: ({year}) => year == 1990 ? "Defer enrollment" : "Keep working", 
            description: "Going to college is expensive and you could be earning income during that time. You can always decide to go school later.",
            effect: "Keep working a low-wage job that earns $30K per year",
            actions: [
              {
                type: 'work',
                kind: 'minimum',
                context: 'Burger Czar', 
                position: 'Service worker', 
                name: 'Minimum wage', 
                salary: 30000, 
                title: 'Keep working', //Fixme? Past tense
                description: `You've let the admissions offices know that you are deferring your undergraduate enrollment. They encourage you to reapply if you ever change your mind. You pick up some extra hours at the Burger Czar for now.`
              }
            ]
          },
        ],
      },
      payment: {
        title: 'How do you plan to pay for tuition?',
        options: [
          {
            title: 'You’ll pay out of pocket',
            description: `After reviewing the loan options, you'd rather not go into debt. You decide to pay for college with cash. You may need to sell some of your investments to free up the cash.`,
            years: 4,
            requirement: 1,
            actions: [{
              type: 'borrow',
              kind: 'school',
              name: 'Tuition payment',
              title: 'Paid for undergraduate out of pocket',
              description: 'You just mailed the tuition check. With everything paid for, you are now focused on your studies that will prepare you for your future career.',
              years: 4,
              rate: 0,
            }]
          },
          {
            title: 'Apply for a government loan',
            description: `Given the terms of the loan, you estimate the payment each year will be $[annual loan payment] and the total interest that you'll pay over the life of the loan to be $[total interest].`,
            //description: 'You’ve qualified for an unsubsidized loan from the Federal government offered as a 10 year loan at 4.45% annual interest, with the interest capitalized on day one. You would like a shorter duration loan to minimize total interest paid and will be choosing this one.',
            years: 10,
            rate: 0.04,
            actions: [{
              type: 'borrow',
              kind: 'school',
              delay: 4,
              name: '10 year government school loan',
              title: 'Paid for undergraduate with a government loan',
              description: `You finished the paperwork and received the government loan to pay college tuition. You don't have to make payments until after you graduate.`,
              years: 10,
              rate: 0.04,
            }]
          },
          {
            title: 'Apply for a private loan',
            description: `Given the terms of the loan, you estimate the payment each year will be $[annual loan payment] and the total interest that you'll pay over the life of the loan to be $[total interest].`,
            //description: 'Sallie Mae is offering me a fixed rate private loan at 15 year duration with 6% annual interest capitalized right away. You will take this longer loan out at a higher interest rate so that your monthly payments are lower and you can start investing earlier even if you pay more total interest.',
            years: 15,
            rate: 0.07,
            actions: [{
              type: 'borrow',
              kind: 'school',
              delay: 4,
              name: '15 year private school loan',
              years: 15,
              rate: 0.07,
              title: 'Paid for undergraduate with a private loan',
              description: `You finished the paperwork and received the private loan to pay college tuition. You don't have to make payments until after you graduate.`
            }]
          }
        ]
      }
    },
    finalize: (decision, {choice, payment}, state, log) => {
      return (choice.actions || []).concat(choice.price ? update(payment.actions[0], {
        $merge: {
          riskFreeRate: payment.actions[0].rate ? state.riskFreeRate : 0,
          sum: choice.price,
          context: choice.name
        }  
      }) : [])
    },
    //isChainable: ({study}, dialog) => /*!study || study.chain === dialog*/,
    isApplicable: ({ turn, education, study }) => 
      turn === 0 || (!education && !study),
    prepare: (decision, state, { choice }) => 
      update(decision, {
        parameters: choice && choice.price ? {
          payment: {
            $set: preparePayment(decision.parameters.payment, state, choice, 'The cost of tuition') 
          } 
        } : choice && !choice.price ?{
          $unset: ['payment']
        } : {},
      }),
    isOutstanding: ({ turn }) => {
      return turn === 0
    }
  },



  grandmasChallenge: {
    chains: ['brokerage1'],
    type: 'investments',
    name: 'grandmasChallenge',
    icon: 'BadgesStocks',
    scene: { name: 'Park', actors: ['grandma'] },
    parameters: {
      choice: {
        title: 'Grandma\'s challenge',
        description: `To encourage you to start investing, Grandma makes you a deal. She offers to give you $3K to start investing today, and an additional $10K if you have a positive return 5 years from now. She says that you can take this challenge later if you aren't ready right now.

        Do you take her up on the offer now or later?`,
        options: [
          {
            title: 'Take her up on the challenge',
            description: 'You open up a brokerage account and deposit your cash to start investing in stocks, bonds, mutual funds, and ETFs. ',
            effect: '+$3K. Earn an additional $10K if successful',
            actions: [
              {
                type: 'challenge',
                kind: 'grandma',
                person: 'grandma',
                illustration: '/assets/images/icons/781247.svg',
                years: 5,
                achievement: 'game_happy_grandma',
                icon: 'stocks',
                label: 'Grandma\'s challenge',
                summary: 'Have a positive investment return after 5 years.',
                title: 'Accepted grandma\'s challenge',
                reward: 'Extra $2K and grandma\'s approval',
                meta: '+$3K',
                amount: 3000,
                description: `You've opened up your brokerage account and started considering different investments. You look forward to making Grandma proud by completing the challenge with a positive return.`,
              },
              {
                type: 'lesson',
                title: 'Passive investments',
                lessonId: 76,
                href: () => `/courses/6/lessons/76`,
                description: 'Grandma recommended you read about passive investments to learn about a low-effort way to win this challenge.',
              }
            ]
          },
          {
            title: `Tell her you aren't ready yet`,
            description: `Even though you decide to wait, you still open up a brokerage account and deposit your cash so that you can start investing whenever you're ready.`,
            effect: `Defer Grandma's challenge`,
            actions: [
              {
                type: 'story',
                kind: 'declinedGrandmaChallenge',
                icon: 'sleep',
                title: 'Passed on grandma\'s challenge',
                description: `You decided not to take on Grandma's challenge but you still opened a brokerage account so that you can take her up on it later.`
              },  
              {
                type: 'lesson',
                title: 'Passive investments',
                lessonId: 76,
                href: () => `/courses/6/lessons/76`,
                description: 'To prepare you, Grandma recommended you read about passive investments to learn about a low-effort way to win this challenge.',
              }
            ]
          }
        ]
      }
    },
    isApplicable: ({ challenges, year }, actions) => {
      return !challenges.grandma || challenges.grandma.year == year;
    },
    isOutstanding: ({ turn }) => turn == 1,
  },

  investmentClub: {
    type: 'stocks',
    name: 'investmentClub',
    icon: 'BadgesStory',
    scene: { name: 'Exchange-Invite', actors: ['mary'] },
    chains: ['investments'],
    parameters: {
      choice: {
        title: 'Investment Club Invitation',
        description: `The investment club offers research ideas to help make better investment decisions. The research focuses on understanding the economy and how it affects investments. Mary says completing these lessons will help improve your Economist skill. 

        Mary wants you to complete a lesson **this year**. Which one do you want to start with? `,
    
        options: [
          {
            title: 'Economic indicators and their effects on the stock market',
            effect: 'Learn about economic news and stocks',
            actions: [
              {
                type: 'lesson',
                required: true,
                title: 'Economic indicators and their effects on the stock market',
                lessonId: 138,
                description: "The direction of the economy and business cycles impact the value of investments. Find out how you can use economic news to figure out the direction the economy is headed and what that means for your investments.",
                href: () => `/courses/16/lessons/138`,
              }
            ]
          },
          {
            title: 'Protective investments during market downturns',
            effect: 'Learn how to protect your money',
            actions: [
              {
                type: 'lesson',
                required: true,
                title: 'Protective investments during market downturns',
                lessonId: 140,
                description: "Market downturns are inevitable. Find out which investments will help protect you.",
                href: () => `/courses/16/lessons/140`,
              }
            ]
          },
          {
            title: 'How fiscal and monetary policies work together',
            effect: 'Learn about government policies',
            actions: [
              {
                type: 'lesson',
                required: true,
                lessonId: 152,
                title: 'How the government use monetary and fiscal policies together',
                description: "When facing an economic crisis, how do the central bank and the central government work together?",
                href: () => `/courses/16/lessons/152`,
              }
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => turn === 2,
    isOutstanding: () => true,
    finalize: (decision, {choice}) => [{
      type: 'challenge',
      kind: 'homework',
      person: 'mary',
      years: 1,
      icon: 'education',
      competitive: false,
      label: 'Some light reading',
      unit: 'boolean',
      summary: 'Complete the lesson you selected this year',
      lessonId: choice.actions[0].lessonId,
      title: 'New member of an investment club',
      description: `You joined the investment club and decided to learn about  \`${choice.title}\`.`
    }].concat(choice.actions)
  },

  grandmasGuidance: {
    chains: ['brokerage'],
    type: 'investment',
    name: 'grandmasGuidance',
    icon: 'BadgesStocks',
    scene: { name: 'Hotdogs', actors: ['grandma'], clips: {
      grandma: ['Standing.Talking.Female', 'Standing.Talking.Female'],
      character: ['Standing.Agreeing', 'Standing.Agreeing']
    } },

    parameters: {
      choice: {
        title: 'Grandma’s guidance',
        description: `Grandma explains there is a tradeoff between risk and return. Investments with a higher return are often riskier. 

        She wants to provide you guidance on the investments that are better suited for how much risk you want to take. 
        
        What is your tolerance for risk?`,
        options: [
          {
            title: 'You would rather take less risk',
            effect: 'Receive conservative investment guidance',
            description: `You're ok will lower returns if it means less risk. Grandma will suggest a conservative investment.`,
            actions: [
              {
                type: 'tooltip',
                icon: 'misfortune',
                title: 'Cautious of the future',
                redirect: '/games/paper-chase/investments?tooltip=investments/5050',
                kind: 'investments/5050',
                description: ` You're ok will lower returns if it means less risk. Grandma will suggest a conservative investment.`,
              }
            ]
          },

          {
            title: 'You are comfortable taking more risk',
            effect: 'Receive a more aggressive investment recommendation',
            description: `You think the higher potential return outweighs the risk. Grandma will suggest an aggressive investment.`,
            actions: [
              {
                type: 'tooltip',
                icon: 'fortune',
                title: 'Hopeful of the future',
                redirect: '/games/paper-chase/investments?tooltip=investments/9010',
                description: `You think the higher potential return outweighs the risk. Grandma will suggest an aggressive investment.`,
              }
            ]
          }
        ]
      }
    },

    isApplicable: ({ turn }) => turn == 3,
    isOutstanding: () => true,
    finalize: (decision, {choice}) => choice.actions
  },


  gradSchool: {
    type: 'career',
    name: 'gradSchool',
    icon: 'BadgesEducation',
    scene: { name: 'University-Prompt' },
    chains: ['career'],
    dependentChains: ['job-search', 'job-offer', 'retirement-plan'],

    parameters: {
      choice: {
        title: 'Go to grad school or work',
        description: `Grandma is so proud of you for graduating! At graduation people ask, "what is next for you?"

        Your professors suggested you consider pursuing a PhD. You applied and were accepted to a couple 5-year programs.
        
        Are you going to grad school or starting your career?`,
        options: [
          {
            years: 5,
            title: 'PhD program at top private university',
            description: 'Your offer includes a research associate role that pays a $25K stipend. This program will help you become a leading expert in your field and companies will pay top dollar for your expertise.',
            effect: '$25K/yr income for 5 years, highest salaried jobs',
            actions: [
              {
                type: 'enroll', 
                kind: 'ivy grad',
                tier: 'grad',
                level: 'elite',
                name: 'PhD program at an top private university', 
                years: 5, 
                meta: '+$25K/yr for 5yrs',
                stipend: 25000, 
                title: 'Started PhD program at top private university',
                description: `You decided that investing more in your education is worth it. This will be the most academically challenging experience; however, you'll be ready to shape the world as an expert at the highest level.`,
              }
            ]
          },
          {
            title: 'PhD program at in-state university',
            description: 'Your offer includes a research associate role that pays a $45K stipend. Completing this program will help you become an expert in your field and you will be paid well for it.',
            years: 5, 
            effect: '+$45K/yr income for 5 years, lower salary than top university',
            actions: [
              {
                type: 'enroll', 
                tier: 'grad', 
                kind: 'regular grad',
                level: 'regular',
                meta: '+$45K/yr for 5yrs',
                name: 'PhD program at in-state university', 
                title: 'Started PhD program at in-state university',
                description: `You decided that investing more in your education is worth it. The academic rigor at this level is difficult but you're excited about the possible future career opportunities.`,
                years: 5,
                stipend: 45000
              }
            ]
          },
          {
            title: 'Start your career',
            description: `You're eager to get your career started. You can always go back to grad school later.`,
            effect: 'Apply for job',
            actions: [
              {type: 'story', title: 'Deferred going to graduate school', icon: 'Education', description: 'You decided to defer on going to grad school. You met with a recruiter to help you find a job and get started on your career.'}
            ]
          },
        ],
      }
    },
    finalize: (decision, {choice: { actions: [action]}}, { education, job }, log) => {
      return [action]
    },
    isApplicable: ({ education, study, year}) => 
      education && (!study || study.year === year) && education.tier === 'college',
    isOutstanding: ({ education, year }) =>
      education.year + education.years == year,
    prepare: (decision) => decision
  },
  
  job: {
    type: 'career',
    name: 'job',
    icon: 'BadgesCareer',
    chains: ['job-search', 'career'],
    scene: { name: 'Office-Hire' },
    parameters: {
      choice: {
        title: 'Apply for jobs',
        description: `You are working with a recruiter to find a job. After a placement interview with the recruiter, they follow up with a few offers. Which one is the best fit for you?`,
        options: [
          {
            title: 'Startup',
            actions: [
              {type: 'work', chance: 0.1, multiplier: 0.75}
            ]
          },
          {
            title: 'Corporate job 1',
            actions: [
              {type: 'work'}
            ]
          },
          {
            title: 'Corporate job 2',
            actions: [
              {type: 'work'}
            ]
          },
          {
            title: 'I\’ll keep your job',
            description: `After looking at your options, you don't think you can beat the perks and equity offered at your company. You plan on staying at your current job for now.`,
            actions: [],
            reactions: [
              {type: 'story'}
            ]
          },
        ],
      },
    },
    finalize: (decision, {choice}) => {
      return choice && choice.actions;
    },
    isApplicable: ({ study, education, job, year }, dialog) => 
      education && !study
      && (!job || job.year === year || dialog !== 'career'),
    isChainable: ({job, year}, dialog) => !job || job.chain === dialog, 
    isOutstanding: ({ study, education, year }) => !study && education && education.year + education.years === year, 
    prepare: (decision, { year, salaryExpectation, seed, companies, study, education, job }) => {
      const random = MATH.seed(seed + year * 97);
      const companiesBySalaryPortion = companies
        .filter((c) => c.ticker !== 'EVIL')
        .sort((a, b) => a.salaryPortion - b.salaryPortion);
      const middle = Math.floor(companiesBySalaryPortion.length / 2);
      const lowSalaryOffer = MATH.shuffle(companiesBySalaryPortion.slice(0, middle), random)[0]
      const highSalaryOffer = MATH.shuffle(companiesBySalaryPortion.slice(middle), random)[0]
      return update(decision, {
        parameters: {
          choice: {
            options: {
              0: (offer) => prepareStartupOffer(offer, salaryExpectation),
              1: (offer) => prepareCorporateOffer(offer, lowSalaryOffer, salaryExpectation),
              2: (offer) => prepareCorporateOffer(offer, highSalaryOffer, salaryExpectation),
              $unset: !(job && job.year < year) ? [3] : []
            }
          }
        }
      })
    }
  },


  leverageChallenge: {
    type: 'investment',
    name: 'leverageChallenge',
    icon: 'BadgesFinance',
    scene: { name: 'Burgers-Meeting', actors: ['grandma'] },
    chains: ['leverageChallenge'],

    parameters: {
      choice: {
        title: 'Leverage Challenge',
        description: `You're talking to Grandma about debt when she says it can be a powerful tool for investing. Taking on too much means you’ll be over leveraged. It will hurt your credit and be difficult to pay back. 

        Grandma wants you to keep your debt expenses to be less than 35% of your total income. She won't be happy if you have too much debt.`,

        options: [
          {
            title: 'Thanks for the advice!',
            description: `You thank Grandma for her words of wisdom but you decide whether or not to follow her advice.`,
            actions: [
              {
                icon: 'Finance',
                type: 'challenge',
                years: 15,
                unit: 'years',
                label: `Leverage challenge`,
                achievement: 'game_leverage_challenge',
                summary: 'Keep your debt payments less than 35% of your income each year for the next 15 years.',
                illustration: '/assets/images/icons/grandma.svg',
                kind: 'leverage',
                person: 'grandma',
                title: `Grandma's advice`,
                description: `Grandma cautioned about having too much debt. She's going to check in each year and it would make her happy if your debt payments are less than 35% of your income.`
              }
            ]
          }
        ]
      }
    },
    finalize: (decision, {choice: { actions: [action]}}, { education, job }, log) => {
      return [action]
    },
    isApplicable: ({ turn }) => turn >= 4,
    isOutstanding: ({ turn }) => turn === 4,
    prepare: (decision) => decision
  },

  

  loanPrepayment: {
    chains: ['loan-prepayment'],
    type: 'finance',
    name: 'loanPrepayment',
    icon: 'BadgesSaving',
    scene: {name: 'Finance-Visit', actors: ['taxAdvisor', 'grandma']},
    
    parameters: {
      choice: {
        title: 'Grandma’s timely advice',
        description: ({loans}) => {
          if (loans.length > 0) {
            return `When you talk to Grandma about debt, she says it's a good idea to keep track of interest rates. If interest rates go down and you have good credit, you can refinance your loans at a lower rate. 
            
            Out of curiosity, you reach out to a lender to see what might be available`
          } else {
            return `Even though you don't have any debt, Grandma follows up on your last chat. She says if you take out a loan, it's a good idea to keep track of interest rates. If interest rates go down and you have good credit, you can refinance your loans at a lower rate.

            Out of curiosity, you reach out to a lender to see what might be available.`
          }
        },
        
        options: [
          {
            title: 'Prepay your student loan',
            effect: 'Prepay $10K toward your loan',

            actions: [
              {
                type: 'prepay',
              }
            ]
          },

          {
            title: 'Just refinance for now',
            effect: 'See if a lower rate is available',
            description: `You'd rather see if there are any lower rates available and you'll consider prepaying later.`,

            actions: [
              {
                type: 'story',
                icon: 'finance',
                title: 'Did not prepay',
                description: `You decided you'd rather have the cash and hold off on prepaying your loan.`,
                redirect: '/games/paper-chase/finance/?tooltip=loan'
              }
            ]
          }
        ]
      }
    },

    isApplicable: ({ turn, loans }) => turn == 5,// && loans.find((loan) => loan.kind === 'school'),
    isOutstanding: () => true,
    prepare: (decision, { cash, loans }) => {
      const loan = loans.find((loan) => loan.kind === 'school');
      if (!loan) return update(decision, {
        parameters: {
          choice: {
            options: {
              $set: [
                {
                  title: 'Pass on lender services',
                  description: `You tell the lender that you appreciate their time but you currently don't have any debt. You tell them that you'll keep in touch if you decide to take out a loan.`,

                  actions: [
                    {
                      type: 'story', 
                      icon: 'finance',
                      title: `Didn't need lender services`,
                      description: `You didn't have any debt so you didn't need their services at the time but you kept their information`}
                  ]
                }
              ]
            }
          }
        }
      });
      const loanBeforePayment = prepayLoan(loan, - loan.yearlyPayment);
      const payableAmount = Math.min(Math.max(0, cash), 10000, loanBeforePayment.unpaidPrincipal);
      const decrease = loan.unpaidInterest - prepayLoan(loanBeforePayment, payableAmount).unpaidInterest;
      
      return update(decision, {
        parameters: {
          choice: {
            options: cash < 10000 ? {
              0: { 
                disabled: { $set: '**There is not enough cash to make prepayment**' }
              }
            } : {
              0: {
                description: {
                  $set: `The lender says you can prepay the loan at any time. Prepayments go toward the principal of the loan which helps pay off the loan sooner. If you prepay $10K of your loan, you will save ${formatters.currency(-decrease)} of interest over the life of the loan.`,
                }
              }
            }
          }
        }
      })
    },
    finalize: (decision, {choice}, { loans }) => {
      return (choice.actions || []).map((action) => {
        const loan = loans.find((loan) => loan.kind === 'school');
        if (action.type == 'prepay') {
          return {
            ...action,
            amount: 10000,
            kind: loan.kind,
            id: loan.id
          }
        } else {
          return action;
        }
      })
    }
  },

  loanRefinancing: {
    chains: ['loan-refinancing', 'loan-prepayment'],
    type: 'finance',
    name: 'loanRefinancing',
    icon: 'BadgesTaxes',
    title: 'Refinance your loans',
    scene: { name: 'Finance-Visit', actors: ['taxAdvisor', 'grandma'] },

    parameters: {
      choice: {
        title: 'Refinance your loans',
        description: `After you provided some employment, bank, and credit information, the lender checked to see if you qualify for a lower rate.`,
        options: [
          {
            title: 'Refinance your loan',
          },

          { 
            title: 'You’ll check back later',
            effect: 'Skip refinancing',
            description: 'The lender reminds you that a good time to refinance is when interest rates drop.',
            
            actions: [
              {
                type: 'story',
                icon: 'finance',
                title: 'Not refinanced any loans',
                description: 'You couldn’t find a better rate to refinance your loans.',
                redirect: '/games/paper-chase/finance/?tooltip=loan'
              }
            ]
          }
        ],
      }
    },
    isChainable: ({  }) => true,
    isApplicable: ({ turn, loans }) => turn == 5 && loans.length > 0,
    isOutstanding: ({ turn, loans }) => turn == 5 && !loans.find((loan) => loan.kind === 'school'),
    
    prepare: (decision, { income, loans, year, riskFreeRate }) => {
      var savings = 0;
      var yearlySavings = 0;
      const situation = [];
      const actions = [];

      loans.forEach((loan) => {
        if (loan.riskFreeRate > riskFreeRate) {
          const type = loan.kind === 'mortgage' ? 'mortgage' :
                       loan.kind === 'school' ? 'school loan' : 'personal loan'
          const oldLoan = breakDownLoan({...loan}).shift();
          const newLoan = breakDownLoan({...loan, riskFreeRate}).shift();
          const difference = oldLoan.totalInterest - newLoan.totalInterest;
          savings += difference;
          yearlySavings += oldLoan.yearlyInterest - newLoan.yearlyInterest;
          situation.push(`${type} of ${formatters.currency(loan.sum)} at \`${formatters.rate(loan.rate + loan.riskFreeRate)}\` to a lower rate of \`${formatters.rate(loan.rate + riskFreeRate)}\`. This would reduce the total interest by \`${formatters.currency(difference)}\`.`)
          
          actions.push({
            type: 'refinance',
            id: loan.id,
            riskFreeRate: riskFreeRate,
            redirect: '/games/paper-chase/finance/?tooltip=loan'
          })
        }
      }, 0)
      const sentence = situation.length > 1 ? '\n* ' + situation.join('\n* ') : situation.join('')
      return update(decision, {
        description: (d) => `${d}`,
        parameters: {
          choice: {
            description: (d) => `${d} ${sentence}`,
            options: 
              actions.length == 0 ?
              {
                0: {
                  disabled: {
                    $set: '**There are no better rates available**'
                  }
                },
                1: {
                  description: {
                    $set: 'The current lending markets can’t get you a better deal. The lender reminds you that a good time to refinance is when interest rates drop.'
                  }
                }
              } :
              [{
                title: () => `Refinance ${loans.length > 1 ? 'Your loans' : 'the loan'}`,
                description: () => `By refinancing your loan${loans.length > 1 ? 's' : ''}, you'll reduce the yearly interest payment by  \`${formatters.currency(yearlySavings)}\`and total interest payment over the life of ${loans.length > 1 ? 'loans' : 'the loan'} by \`${formatters.currency(savings)}\`.`,
                actions: () => actions
              }]
          }
        }
      })
    },
  },

  coverageSector: {
    type: 'stocks',
    name: 'coverageSector',
    icon: 'BadgesStocks',
    scene: { name: 'Exchange-Dividends', actors: ['mary'] },
    chains: ['investments1'],
    
    parameters: {
      choice: {
        title: ({turn}) => {
          if (turn == 6) return 'Picking a sector of coverage';
          if (turn == 16) return 'Picking a second sector';
          if (turn == 21) return 'Picking a third sector';
        },


        description: ({turn}) => {
          
          if (turn == 6) return  `During a meeting, the club discusses how mutual funds and ETFs are great investment options for easier diversification; it's like buying multiple stocks at once.

          Mary says you should consider investing in stocks of companies that you think are good businesses. She advises you start by picking a few industries that you're interested in.
          
          *Your selected sector will unlock investable stocks.*`

          if (turn == 16) return `After an investment club meeting, you decide that you're ready to expand your investment options and pick another sector.

          *Your selected sector will unlock investable stocks.*`

          if (turn == 21) return `After an investment club meeting, you decide that you're ready to expand your investment options to include the remaining sectors.
          
          *Your selected sector will unlock investable stocks.*`
        },

        options: sectorOptions
      }
    },
    
    isApplicable: ({ turn }) => turn == 6 || turn == 16 || turn == 21,
    isOutstanding: () => true,

    prepare: (decision, { choices: { investmentSectors } }) => {
      return update(decision, {
        parameters: {
          choice: {
            options: {
              $unset: [0,1,2].filter((index) => investmentSectors.some((sector) => sector.industries.toString() == sectorOptions[index].industries.toString()))
            }
          }
        }
      });
    },
    
    finalize: (decision, {choice}) => [{
      type: 'sectorChoice',
      icon: 'stocks',
      title: 'Your investment sectors',
      industries: choice.industries,
      description: `I picked \`${choice.title}\` as the three industries to invest in.`
    }].concat(choice.actions || [])
  },

  economist2Challenge: {
    chains: ['challenge'],
    type: 'investment',
    name: 'economist2Challenge',
    scene: { name: 'Exchange-Dividends', actors: ['mary', false, false, 'character'], clips: {
      character: ['Standing.Agreeing', 'Standing.Agreeing'],
      mary: ['Sitting.Talking', 'Sitting.Talking']
    } },
    icon: 'BadgesStocks',

    parameters: {
      choice: {
        title: 'The perks of club membership',
        description:  `She suggests now might be a good time to work on improving your investment literacy. She even offered to give you a bonus if you reach the next level in the club within the next two years!`,
        options: [
          {
            title: 'Thanks for the advice!',
            description: `You thank Mary for her suggestion but it's up to you whether or not to follow her advice and pass the lessons to reach the next level.`,
            actions: [
              {
                icon: 'Friendship',
                type: 'challenge',
                competitive: false,
                years: 3,
                person: 'mary',
                label: 'Ranking up',
                summary: 'Get level 2 Economist skill.',
                unit: 'boolean',
                illustration: '/assets/images/icons/economist.svg',
                kind: 'economist',
                title: `Mary's advice`,
                description: `Mary suggests you work on leveling up your Economist skill. She's going to check in after 2 years and she would be impressed if you'd leveled up by then.`
              }
            ]
          },
        ]
      }
    },

    isApplicable: ({ turn, skills }) => {
      return turn == 7 ;
    },
    isOutstanding: ({ turn }) => true,
  },


  investmentReports: {
    type: 'stocks',
    name: 'investmentReports',
    icon: 'BadgesFinance',
    scene: { name: 'Exchange-Success', actors: [undefined, undefined, 'mary'], clips: {
      character: ['Standing.Thinking'],
      mary: ['Sitting.Talking'],
      0: ['Sitting.Idle'],
      1: ['Sitting.Idle']
    } },
    chains: ['investments2'],
    parameters: {
      choice: {
        title: 'Economic expectations',
        description: ` Mary follows up with you on how the research is going. She  says higher level economists can start to make predictions about what to expect in the future. Then again, you can always pay for insights as well!

        She cautions that no one is a fortune teller so these predictions aren't always correct but they are the most likely choices! She'll give you an example; which one would you like to see?`,
    
        options: [,
          {
            title: 'Free world policy review',
            category: 'World news',
            effect: 'Increase investment literacy of world policy for 1 year',
            description: `Mary will provide an example of how higher literacy can unlock world policy insight.`
          },
          {
            title: 'Free economics outlook',
            category: 'Economics',
            effect: 'Increase investment literacy of economic news for 1 year',
            description: `Mary will provide an example of how higher literacy can unlock economic outlook insight.`
          },
          {
            title: 'Free politics report',
            category: 'Politics',
            effect: 'Increase investment literacy of politics for 1 year',
            description: 'Mary will provide an example of how higher literacy can unlock political insight.',
          }
        ]
      }
    },
    isApplicable: ({ turn }) => turn === 8,
    isOutstanding: () => true,
    finalize: (decision, {choice}) => [{
      type: 'freeReport',
      icon: 'world',
      category: choice.category,
      title: `Accepted a ${choice.title}`,
      description: `Mary provided you free world policy\`${choice.title}\` insight.`
    }].concat(choice.actions || [])
  },


  dividendChallenge: {
    chains: ['dividendChallenge'],
    type: 'investments',
    name: 'dividendChallenge',
    icon: 'BadgesStocks',
    scene: { name: 'Exchange-Invite', actors: [false], clips: {
      character: ['Standing.Thinking']
    } },
    
    parameters: {
      choice: {
        title: 'Investment Income Challenge',
        description: `Even though she didn't directly ask for it, you're considering help Grandma by giving her $8K to cover her bills. Knowing Grandma, she would probably want you to use your investments somehow. Will you help her out and, if so, how?`,

        options: [
          {
            title: 'Use generated investment income', 
            effect: '-$8K over 4 years',
            description: 'Use your investments to generate the extra income to give her. Your goal is to be able to give her $8K of investment income within the next 4 years. ',
            actions: [
              {
                icon: 'finance',
                type: 'challenge',
                kind: 'dividend',
                person: 'grandma',
                achievement: 'game_dividend_manager',
                illustration: '/assets/images/icons/dividends.svg',
                years: 4,
                label: 'Investment Income Challenge',
                summary: 'Give Grandma $8K of investment income over the next 4 years',
                title: 'Decided to help Grandma using investment income',
                description: `You decided to use your investment income to help Grandma with her bills.`
              },
              {
                type: 'lesson',
                title: 'Buying a dividend paying stock',
                lessonId: 93,
                href: () => `/courses/2/lessons/93`,
                description: 'You decide to look into how to buying stocks can generate income.',
              }
            ]
          },
          {
            title: 'Lazily give her cash today',
            effect: '-$8K',
            description: `You figure it's just easier to give her $8K in cash today.`,
            actions: [
              {
                icon: 'finance',
                type: 'pay',
                kind: 'grandma',
                title: `Helped pay Grandma's bills`,
                description: `You gave Grandma cash to help with her bills.`,
                sum: 8000
              },
              {
                type: 'lesson',
                title: 'Buying a dividend paying stock',
                lessonId: 93,
                href: () => `/courses/2/lessons/93`,
                description: 'Even though you gave her cash, you decide to look into how to buying stocks can generate income.',
              }
            ]
          },

          {
            title: `Don't help her yet`, 
            description: `You realize that you aren't in a position to help Grandma out financially yet. Once you feel more comfortable, you'll decide how to help her.`,
            actions: [
              {
                type: 'story',
                icon: 'sleep',
                title: 'Decided to wait to help Grandma',
                description: `You decided to wait to help Grandma with her bills.`
              },
              {
                type: 'lesson',
                title: 'Buying a dividend paying stock',
                lessonId: 93,
                href: () => `/courses/2/lessons/93`,
                description: `While you're waiting to help, you decide to look into how to buying stocks can generate income.`,
              }
            ]
          }
        ]
      }
    },
    isApplicable: ({turn, year, challenges: { dividend }, choices: { paidGrandmaOff }}, actions) => {
      return turn >= 9 && !paidGrandmaOff && (!dividend || dividend.justStarted)
    },
    isOutstanding: ({turn}) => turn == 9,
  },


  /*
  companyNews: {
    chains: ['challenge'],
    type: 'investment',
    name: 'companyNews',
    icon: 'BadgesStocks',
    scene: { name: 'Exchange-News' },
    title: 'Keeping abreast of developments',
    description: ({}) => 
    ` , reached out to me to inform me that they are rolling out a new feature to help investors stay on top of current and new developments. The news reporting feature will alert me when there are developments occurring for each stock. News can be corporate actions such as the increase or decrease of dividends, mergers and acquisitions, and other material changes.`,
    
    parameters: {
      choice: {
        title: 'Title: Keeping abreast of developments',
        description: ({}) => 
        `Michaela, your representative at the brokerage you use, reached out to me to inform me that they are rolling out a new feature to help investors stay on top of current and new developments. The news reporting feature will alert me when there are developments occurring for each stock. News can be corporate actions such as the increase or decrease of dividends, mergers and acquisitions, and other material changes.

        *A news indicator will show next to the stock price under the market tab in **Investments**.*`,
      
        options: [{
          title: 'Great! This is awesome',
          description: `I can now follow developments of each company and the impacts on present and future stock price via the market tab in **Investments**.`,

          actions: [{
            type: 'story',
            icon: 'world',
            title: `Reading company news`,
            description: `I can now follow developments of each company and the impacts on present and future stock price via the market tab in Investments.`
          }]
        }]
      }
    },

    isApplicable: ({ turn }) => turn == 11,
    isOutstanding: () => true,
  }, */


  tomasLoan: {
    type: 'finance',
    name: 'tomasLoan',
    chains: ['tomasLoan'],
    icon: 'BadgesFinance',
    scene: {name: 'Park-Bench', actors: ['tomas']},
    parameters: {
      choice: {
        title: 'Unexpected Expenses',
        description: `Tomas, knowing your grandma from childhood and what she means to you, wants to help. He says he knows a guy that can give you the money to pay for her medical bills. 
        
        How are you going to pay the medical bill?`,
        options: [
          {
            title: 'Take Tomas up on his offer',
            value: false,
            effect: `Grandma's medical bill is taken care of`,
            description: `You don't know anything about this guy or if there are any strings attached but you trust Tomas so you take him up on the offer.`,
            actions: [
              {
                type: 'borrow',
                rate: 0.2,
                sum: 20000,
                years: 7,
                meta: '',
                delay: 2,
                riskFreeRate: ({riskFreeRate}) => riskFreeRate, 
                name: 'Shady deal from Tomas',
                kind: 'tomasLoan',
                icon: 'friendship',
                title: `Accepted Tomas' offer`,
                description: `You decided to accept Tomas' help to pay your Grandma's medical bill.`, 
              }
            ]
          },
          {
            price: 20000,
            title: 'Pay yourself',
            effect: '-$20K',
            description: `You politely decline Tomas' offer. You decide that you'd rather pay the bill with cash.`,
            actions: [
              {
                type: 'story', 
                kind: 'declinedTomasLoan',
                icon: 'close',
                title: `Declined Tomas' offer`,
                description: `You decided to pay Grandma's medical bill yourself`, 
              }
            ]
          }
        ],
      },
      payment: {
        title: `How do you want to pay for grandma's medical bills?`,
        options: [
          {
            title: 'Pay with cash',
            description: 'No need to finance, You’ll put down an all cash offer.',
            actions: [
              {type: 'pay', kind: 'grandma', context: `grandma's treatment`, sum: 20000}
            ]
          },
          ...loanOptions
        ]
      }
    },
    prepare: (decision, state, { choice } ) => {
      var newDecision = choice && choice.value === false 
        ? update(decision, {
          parameters: {
            $unset: ['payment']
          }
        }) 
        : choice 
          ? update(decision, {
              parameters: {
                payment: (payment) => preparePayment(payment, state, choice, 'The total cost of medical treatment', 'loan') 
              }
          })
          : decision

      return newDecision;
    },
    finalize: (decision, {choice, payment}, state, log) => {
      if (!payment) return choice.actions || [];
      if (!payment.years) return (choice.actions || []).concat(payment.actions);

      return (choice.actions || []).concat({
        type: 'borrow',
        kind: 'personal',
        name: 'Personal loan',
        riskFreeRate: state.riskFreeRate,
        description: 'You’ve decided to take a personal loan from private lenders. This loan will add to your monthly payments, but at least grandma\'s bills will be covered.',
        rate: payment.rate,
        years: payment.value,
        context: `grandma's treatment`,
        sum: 20000
      }, {type: 'pay', kind: 'grandma', context: `grandma's treatment`, title: 'Paid for grandma\'s treatment', sum: 20000});
    },
    isApplicable: ({ turn }) => turn == 10,
    isOutstanding: () => true,
  },

  /*
  loanAdvice: {
    type: 'finance',
    name: 'loanAdvice',
    chains: ['new-loan-advice'],
    icon: 'BadgesStocks',
    scene: { name: 'Home-Roof', actors: ['chadwick'] },

    title: 'Some greedy advice',
    description: 'Chadwick from the investment club pulled me aside to talk about leverage. “If we make the right calls, we can make far more than we can now by borrowing money. It’s risky but you only live once!” He told me to go take out a personal loan to put more money into the stock markets.',

    parameters: {
      choice: {
        title: 'Some greedy advice',
        description: 'Chadwick from the investment club pulled me aside to talk about leverage. “If we make the right calls, we can make far more than we can now by borrowing money. It’s risky but you only live once!” He told me to go take out a personal loan to put more money into the stock markets.',

        options: [

          {
            title: 'YOLO, you want to give this a try',
            effect: 'Take out a personal loan',
            description: 'What’s the worst that can happen? you make a decent amount of money and can pay back the loan if things go poorly.',

            actions: [
              {
                type: 'story', 
                title: 'Thinking about taking a loan',
                description: 'You decided to follow Chad’s advice and look at loan options.', 
                icon: 'Friendship', 
                redirect: '/games/paper-chase/finance/?tooltip=new-loan' 
              }
            ]
          },

          {
            title: 'Steer clear of Chadwick',
            effect: 'Learn about leverage and loans',
            description: 'You would rather do some research about what leverage is before you try it.',

            actions: [
              {
                type: 'story', 
                title: 'Decided not to take a loan',
                description: 'You decided to read more about the use of financial leverage first.', 
                icon: 'Career', 
                redirect: '/games/paper-chase/finance/?tooltip=new-loan'
              }
            ]
          },

          

        ]
      }
    },

    isApplicable: ({ turn }) => turn == 11,
    isOutstanding: () => true,
  }, */
  
  rentOut: {
    type: 'property',
    name: 'rentOut',
    chains: ['rent-out'],
    icon: 'BadgesSaving',
    scene: ['Property-Rent'],
    title: 'Rent your own home out?',
    description: 'Move into a second home you own or choose to rent.',
    parameters: {
      choice: {
        title: 'Rent your own home out?',
        description: 'Move into a second home you own or choose to rent.',
        options: [
          {
            title: 'No, you will stay in this house',
            description: 'You change your mind and don’t want to move.',
          },
          {
            title: 'Yes, you will rent a flat for myself',
            actions: [
              {type: 'moveOut', expenses: 24000}
            ]
          }
        ],
      }
    },
    isApplicable: ({ residence }) => residence,
    prepare: (decision, { residence }) => 
      !residence ? decision : update(decision,  {
        parameters: {
          choice: {
            options: {
              1: {
                $merge: {
                  effect: `+${formatters.currency(residence.rentPrice - 24000 - residence.tax)}/yr`,
                  description: `You have found a tenant willing to pay ${formatters.currency(residence.rentPrice)} a year to rent your home and also an apartment to rent yourself for $24K a year. The yearly income after taxes is expected to be ${formatters.currency(residence.rentPrice - residence.tax)}.`
                }
              }
            }
          }
        }
      }),
    finalize: (decision, { choice }, { residence }) => {
      if (choice.actions && choice.actions[0].type === 'moveOut') {
        return [
          update(choice.actions[0], {
            id: { $set: residence.id }
          })
        ]
      }
      return [];
    }
  },

  buyHouse: {
    ...buyHouse,
    isRepeatable: ({turn}) => turn > 12,
    isApplicable: () => true,
    isOutstanding: ({ turn }) => turn == 12
  },


  corporateNewsChallenge: {
    type: 'investments',
    chains: ['corporate'],
    scene: ['Exchange-Club'],
    icon: 'BadgesTaxes',
    name: 'corporateNewsChallenge',

    parameters: {
      choice: {
        title: 'Company news challenge',
        description: `To better understand stock movements, the investment club suggests you to follow the price of a stock and report back with how the stock price will move based on the Economic and Company news each year for the next 5 years. 
        
        Mary says this might be a good opportunity to learn more about EVILCorp!`,

        options: [
          {
            title: 'Follow EVILCorp news',
            description: `Remembering what Grandma said about Mr. Sinister, you decide to follow EVILCorp. You might find some more information about why he might be interested in your family's business.`,
              
            actions: [
              {
                icon: 'local',
                years: 5,
                title: 'Researching EVILCorp',
                description: 'You decide to follow EVILCorp stock in hopes to learn more about Mr. Sinister and what he has to do with your family business.',
                type: 'challenge',
                kind: 'news',
                unit: 'years',
                achievement: 'game_news_challenge',
                competitive: true,
                person: 'mary',
                label: "Company news challenge",
                summary: 'Correctly determine the direction that the stock moves each year.'
              }
            ]
          },
          {
            title: 'Wait to do this later',
            description: 'You have a lot of things going on and decide that now is not the right time take this on as well.',

            actions: [
              {
                type: 'story',
                icon: 'sleep',
                title: 'Waiting to do research',
                description: 'You decided to wait to begin researching EVILCorp'
              }
            ]
          }
        ]
      }
    },
    isApplicable: ({turn}) => turn == 13,
    isOutstanding: ({turn}) => turn == 13,
  },


  taxAdvisor: {
    chains: ['tax-advisor'],
    type: 'finance',
    name: 'taxAdvisor',
    icon: 'BadgesTaxes',
    scene: [{name: 'Finance-Taxes', actors: ['taxAdvisor']}],
    isChangable: () => false,

    parameters: {
      choice: {
        title: 'John the tax advisor',
        description: ({turn}) => 
        turn != 11 ? `Your tax bill has grown considerably and you ask Mary if there is something you can do. She connects you with John, a tax advisor.

        When you meet with John, he gives you some resources to learn about taxes.
        
        He will do your taxes and let you know ways that you can lower your tax liability each year for $2K per year.`

        :  `When you meet with John, he gives you some resources to learn about taxes.

        He tells you that he will do your taxes and let you know ways that you can lower your tax liability each year for $2K per year.`,
        options: [
          {
            title: 'Hire his services',
            description: `You decide to hire John to prepare your taxes and he will alert you of ways you can lower your taxes each year.`,
            effect: '-$2K/yr',
            actions: [
              {
                type: 'hireTaxAdvisor',
                icon: 'friendship',
                title: 'Hired John',
                lessonId: 106,
                description: `You are excited to be a client of John's. It feels great to have help from a professional!`,
                price: 2000,
                meta: '-$2K/yr',
              }
            ]
          },
          {
            title: 'Politely decline',
            description: `You thank him for the resources but politely decline. Even though you're all set today, he says you're welcome to hire him in the future if you change your mind.`,
            actions: [
              {
                type: 'story',
                icon: 'finance',
                title: `Didn't hire john`,
                lessonId: 106,
                description: `You declined John's services.`,
              }
            ]
          }
        ]
      }
    },

    isApplicable: ({turn}) => turn == 11,//!taxAdvisor || taxAdvisor.year === year,
    isOutstanding: ({ taxes, previous, turn }) => { // first time taxes are above 35k
      if (turn === 11) return true;
      if (turn > 11) return false;
      for (var s = previous; s.taxes; s = s.previous) {
        const previousTaxes = s.taxes.federal + s.taxes.state + s.taxes.socialSecurity;
        if (previousTaxes >= 35000) return false;
      }
      if (taxes.federal + taxes.state + taxes.socialSecurity >= 35000) {
        return true;
      }
      return false
    },
    finalize: (decision, { choice }, { year }) => {
      return choice ? choice.actions.concat({
        title: 'Started tax rate challenge',
        kind: 'tax',
        description: 'Mary challenged you to have an effective tax rate below 35% for the next 5 years',
        icon: 'finance',
        type: 'challenge',
        achievement: 'game_tax_challenge',
        years: 5,
        unit: 'years',
        person: 'mary',
        label: 'Tax rate challenge',
        summary: 'Have an effective tax rate below 35% for the next 5 years',
        illustration: '/assets/images/icons/economist.svg',
      }) : []
    }
  },

  taxAdvisorRetirement: {
    chains: ['tax-advisor-retirement', 'tax-advisor'],
    type: 'finance',
    name: 'taxAdvisorRetirement',
    icon: 'BadgesSaving',
    scene: {name: 'Finance-Retirement', actors: ['taxAdvisor']},

    title: 'Tax advice: 401(k)',
    description: `I found out you am not contributing enough to your 401(k). By contributing more, you can effectively lower your taxes every year.`,
    

    parameters: {
      choice: {
        title: 'Tax advice: 401(k)',
        description: ({taxes}) => `I found out you am not contributing enough to your 401(k). By contributing more, you can effectively lower your taxes every year.`,
        options: [
          {
            title: 'Max out your 401(k) contribution',
            //effect: '-$5K',
            value: 19000,
            actions: [
              {
                title: 'Maximized 401(k) contributions',
                type: 'retirementContribution',
                //meta: `+${formatters.currency(option.value)}/yr towards retirement`,
                //description:  `I feel like it’s a responsible step to start saving for retirementPlan. By contributing, you am putting ${formatters.currency(option.value - matched)} away, getting ${formatters.currency(matched)} from the company, and you am reducing your taxes this year by ${formatters.currency(taxesReduction, 999999)}`,
                //value: option.value
              }
            ]
          },
          {
            title: 'Keep the same 401(k) contribution',
            description: 'You would rather keep some extra cash on hand to prepare to buy a house.',
          },
        ],
      },
    },
    isChainable: ({ choices: {hiredTaxAdvisor} }) => hiredTaxAdvisor,
    isApplicable: ({ choices: {hiredTaxAdvisor}, retirementContributionTarget, job, year }) => hiredTaxAdvisor && (hiredTaxAdvisor.year === year || retirementContributionTarget !== 19000 && job),
    prepare: (decision, { job, salary, retirementContributionTarget}) => {
      if (!job) {
        return update(decision, {
          description: () => 'Contributing to a 401(k) or other tax-deferred retirement plans is a great way to decrease taxable income for the year. Consider pursuing higher education to be hired by an employer that offers a 401(k).',
          parameters: {
            choice: {
              description: () => 'Contributing to a 401(k) or other tax-deferred retirement plans is a great way to decrease taxable income for the year. Consider pursuing higher education to be hired by an employer that offers a 401(k).',
              options: () => [
                {
                  title: 'Got it',
                  description: "You’ll take a look at school enrollment."
                }
              ]
            }
          }
        })
      } else if (retirementContributionTarget === 19000) {
        return update(decision, {
          description: () => 'Contributing to a 401(k) is a great way to decrease taxable income at the end.  your current 401(k) contribution is already providing me max deductions!',
          parameters: {
            choice: {
              description: () => 'Contributing to a 401(k) is a great way to decrease taxable income at the end.  your current 401(k) contribution is already providing me max deductions!',
              options: () => [
                {
                  title: 'Awesome!',
                  description: "I feel good about this. Let’s see what other advice John has."
                }
              ]
            }
          }
        })
      } else {
        return update(decision, {
          parameters: {
            choice: {
              options: {
                0: (opt) => {
                  return update(prepareRetirementContributionOption(opt, job, salary), {
                    actions: {
                      0: {
                        title: () => 'Maximized 401(k) contributions',
                        description: (d) => d.replace(/^.*?\./, 'You have elected to increase your 401(k) contribution to hit the max tax deductions possible.')
                      }
                    }
                  })
                }
              }
            }
          }
        })
      }
    },
  },

  taxAdvisorStocks: {
    chains: ['tax-advisor-stocks', 'tax-advisor'],
    type: 'finance',
    name: 'taxAdvisorStocks',
    icon: 'BadgesStocks',
    title: 'Tax advice: Stocks',
    scene: [{name: 'Finance-Retirement', actors: ['taxAdvisor']}, {name: 'Finance-Taxes', actors: ['taxAdvisor']}],
    description: `A strategy many investors take is to strategically sell some losing positions to reduce their tax liability. John has pointed out that you currently don’t have any positions or stocks to sell to achieve this.`,
        

    parameters: {
      choice: {
        title: 'Tax advice: Stocks',
        description: `A strategy many investors take is to strategically sell some losing positions to reduce their tax liability. John has pointed out that you currently don’t have any positions or stocks to sell to achieve this.`,
        options: [
          {
            title: 'Aw shucks',
            description: 'You’ll keep an eye out in the future years for when you can take advantage of this strategy.',
          },
        ],
      }
    },
    isChainable: ({ choices: {hiredTaxAdvisor}  }) => hiredTaxAdvisor,
    isApplicable: ({ choices: {hiredTaxAdvisor} , personalPortfolio, year }) => {
      const worstStock = personalPortfolio.sort((a, b) => a.deltaPrice - b.deltaPrice)[0];
      return hiredTaxAdvisor && (hiredTaxAdvisor.year === year || worstStock && worstStock.deltaPrice < 0);
    },

    prepare: (decision, { personalPortfolio, income }) => {
      const worstStock = personalPortfolio.sort((a, b) => a.deltaPrice - b.deltaPrice)[0];
      if (worstStock && worstStock.deltaPrice < 0) {
        const taxesReduction = getIncomeTax(income) - getIncomeTax(income - worstStock.deltaPrice)
        return update(decision, {
          description: () => `A strategy many investors take is to strategically sell some losing positions to reduce their tax liability. John has pointed out that you can do the same, and advises to sell stocks that you don’t think will recover next year.`,
          parameters: {
            choice: {
              description: () => `A strategy many investors take is to strategically sell some losing positions to reduce their tax liability. John has pointed out that you can do the same, and advises to sell stocks that you don’t think will recover next year.`,
              options: () => [
                {
                  title: `Sell ${worstStock.amount} shares of ${worstStock.name}`,
                  description: `I am going to sell your \`${worstStock.name}\` shares since it’s trading lower than when you bought it. You don’t think the business will turn around in the short term. `,
                  effect: `+${formatters.currency(worstStock.currentPrice)}`,
                  actions: [
                    {
                      type: 'sell',
                      name: worstStock.name,
                      amount: worstStock.amount,
                      kind: 'personal',
                      description: `I ended up tax-loss harvesting by selling your shares of ${worstStock.name}. By doing so you lowered your taxes by ${formatters.currency(Math.abs(taxesReduction))}.`
                    }
                  ]
                },
                {
                  title: `You’ll manage it myself`,
                  description: `Instead of selling right now You’ll take a look through each position and make a decision. If you don’t sell anything this year, you can always sell for next year.`
                }
              ]
            }
          }
        })
      }
      return decision;
    },
  },


  taxAdvisorDeductions: {
    chains: ['tax-advisor-deductions', 'tax-advisor'],
    type: 'finance',
    name: 'taxAdvisorDeductions',
    icon: 'BadgesTaxes',
    title: 'Tax advice: Deductions',
    scene: [{name: 'Finance-Retirement', actors: ['taxAdvisor']}, {name: 'Finance-Taxes', actors: ['taxAdvisor']}],
    description: `Mortgage interest and student loan interest are also tax-deductible. John pointed out that you currently don't have any loans outstanding and suggests for me to start financing more instead of all cash payments.`,
        

    parameters: {
      choice: {
        title: 'Tax advice: Deductions',
        description: `Mortgage interest and student loan interest are also tax-deductible. John pointed out that you currently don't have any loans outstanding and suggests for me to start financing more instead of all cash payments.`,
        options: [
          {
            title: 'Great, got it!',
            description: 'You haven’t considered the benefits of taking out loans. This tax incentive seems like a good one.',
          },
        ],
      }
    },
    isChainable: ({ choices: {hiredTaxAdvisor}  }) => hiredTaxAdvisor,
    isApplicable: ({ choices: {hiredTaxAdvisor} , loans, year }) => {
      return hiredTaxAdvisor && (hiredTaxAdvisor.year === year/* || loans.some((loan) => loan.kind !== 'personal' && loan.startingYear <= year) */);
    },

    prepare: (decision, { income, loans, year }) => {
      var deductions = 0;
      const situation = [];

      loans.forEach((loan) => {
        if (loan.kind === 'mortgage' && loan.startingYear <= year) {
          deductions += Math.min(loan.monthlyInterest, 2500);
          situation.push(`an outstanding mortgage of ${formatters.currency(loan.totalPrincipal)} with yearly paid interest of ${formatters.currency(loan.yearlyPrincipal)}`)
        } else if (loan.kind === 'school' && loan.startingYear <= year && loan.paidPrincipal < 750000) {
          deductions += loan.monthlyInterest;
          situation.push(`a student loan out for ${formatters.currency(loan.totalPrincipal)} with a yearly interest payment of ${formatters.currency(loan.yearlyPrincipal)}`)
        }
      }, 0)
      const taxesReduction = getIncomeTax(income) - getIncomeTax(income - deductions)
      const sentence = situation.length ? `John pointed out that you currently have ${formatters.and(situation)}.` : '';
      if (situation.length > 0) {
        return update(decision, {
          description: () => `Mortgage interest and student loan interest are also tax deductible. ${sentence}`,
          parameters: {
            choice: {
              description: () => `Mortgage interest and student loan interest are also tax deductible. ${sentence}`,
              options: [{
                title: () => `Amend your tax report`,
                description: () => `You’ll have John help prepare your tax reports to reflect the interest writeoff. With the new deduction, you will reduce your taxes by ${formatters.currency(taxesReduction)}.`,
                actions: () => [{
                  type: 'story',
                  icon: 'finance',
                  title: 'Deducted loan interest',
                  description: `I learned from John how to deduct loan interest from your taxable income and received a tax rebate of \`${formatters.currency(taxesReduction)}\`. Now that you know, all future loan interests will be deducted without needing to hire John again.`
                }]
              }]
            }
          }
        })
      }

      return decision;
    },
  },



  loan: {
    isRepeatable: () => true,
    icon: 'BadgesFinance',
    cta: 'Get a loan!',
    chains: ['loan'],
    type: 'finance',
    name: 'loan',
    scene: ['Bank-Visit', 'Bank-Visit-2'],
    title: 'Apply for a personal loan?',
    description: 'Need some extra cash? See what loan options are available at different amounts borrowed.',
    parameters: {
      amount: {
        title: 'Apply for a personal loan?',
        description: 'Need some extra cash? See what loan options are available at different amounts borrowed.',
        class: 'no-animation',
        options: [
          {
            value: 10000,
            title: '$10K',
            class: 'third'
          },
          {
            value: 30000,
            title: '$30K',
            class: 'third',
          },
          {
            value: 50000,
            title: '$50K',
            class: 'third',
          },
          {
            value: 70000,
            title: '$70K',
            class: 'third',
          },
          {
            value: 100000,
            title: '$100K',
            class: 'third',
          },
          {
            value: 200000,
            title: '$200K',
            class: 'third',
          },
          /*{
            value: null,
            title: 'No, thanks'
          },*/
        ]
      },
      offer: {
        title: 'Select a loan duration and interest rate',
        class: 'no-animation',
        options: [
          ...loanOptions
        ]
      }
    },
    finalize: (decision, {amount, offer}, { riskFreeRate }, log) => {
      return [{
        type: 'borrow',
        kind: 'personal',
        name: offer.value + ' year personal loan',
        description: 'You’ve decided to take a personal loan from private lenders. This loan will add to your monthly payments but you will put the money to good use.',
        rate: offer.rate,
        sum: amount.value,
        years: offer.value,
        riskFreeRate
      }]
    },
    prepare: (decision, { loans, riskFreeRate }) => {
      const loaned = loans.reduce((sum, loan) => sum + (loan.kind === 'personal' ? loan.unpaidPrincipal : 0), 0)
      const allowed = 200000 - loaned;
      return update(decision, {
        parameters: {
          amount: {
            description: (description) => loaned ? description + `\n\n*You've borrowed \`${formatters.currency(loaned)}\` out of a total limit of $200K.*` : description,
            options: {
              $set: decision.parameters.amount.options.filter((option) => option.value <= allowed),
            }
          },
          offer: {
            options: {
              $set: decision.parameters.offer.options.map((option) => ({
                ...option,
                riskFreeRate  
              })),
            }
          }
        }
      });
    },
    isApplicable: ({loans}) => {
      const loaned = loans.reduce((sum, loan) => sum + (loan.kind === 'personal' ? loan.unpaidPrincipal : 0), 0);
      return (200000 - loaned) > 10000;
    }
  },

  propertyChallenge: {
    chains: ['property-challenge'],
    type: 'property',
    name: 'propertyChallenge',
    icon: 'BadgesProperty',
    scene: [{name: 'Property-Buy', actors: ['tomas'], clips: {
      character: ['Standing.Agreeing', 'Standing.Agreeing']
    }}],
    parameters: {
      choice: {
        title: 'A rare find',
        description: `You meet up with Tomas. He asks if you are interested in an investment opportunity with just you two. 

        He found an older lake house that he'd like to renovate and rent out. You'd split the renovation cost and the rental income evenly. 
        
        The estimated cost is $60K and he expects to make about $15K in rent the first year.`,
        
        options: [
          {
            title: `Let's GO!`,
            effect: 'Pay $30K in renovation costs',
            description: `You are excited to take take him up on the offer. Even though it needs a bit of work, the location is amazing. The extra income isn't bad either.`,
            actions: [
              {
                icon: 'finance',
                type: 'getHouse',
                kind: 'holiday',
                name: 'Lake house',
                title: 'Partnered with Tomas',
                meta: '-$30K, +$7.5K/yr',
                redirect: '/games/paper-chase/property/?tooltip=property-challenge',
                description: 'You decided to go in with Tomas on the rental property investment. A family-owned lake house that needed some work.'
              }
            ]
          },
          
          {
            title: 'Offer a friendly wager',
            effect: 'Place a $10K wager',
            description: `A rental property isn't the best investment right now. Instead, you put your money where your mouth is and place a wager. If you can generate more interest and dividends over the next 5 years than Tomas can from his rental property, then he will give you $10K. If you generate less, you will pay him $10K`,

            actions: [
              {
                icon: 'stocks',
                person: 'tomas',
                years: 5,
                label: 'Renovate challenge',
                summary: 'Generate more investment income than Tomas over 5yrs ($37.5K)',
                illustration: '/assets/images/icons/landlord.svg',
                type: 'challenge',
                kind: 'property',
                title: 'Placed a bet with Tomas',
                description: 'You bet Tomas that you can generate more passive income over the next 5 years than he can with his rental property.'
              }
            ]
          }
        ]
      }
    },
    
    isApplicable: ({ turn }) => {
      return turn == 14;
    },
    isOutstanding: () => true,
  },

  teachingTomas: {
    scene: [{name: 'Burgers-Meeting', actors: ['tomas']}],
    name: 'teachingTomas',
    chains: ['teachingTomas'],
    icon: 'BadgesFinance',

    parameters: {
      choice: {
        title: 'Teaching Tomas',
        description: `You and Tomas get talking about personal finance and he's really impressed by how much you know about investing. He asks if he could come to you with questions or for advice once in a while.`,

        options: [
          {
            title: 'For a friend, absolutely',
            description: `You tell Tomas that you'd be happy to answer his questions. You just hope you give him the right advice!`,

            actions: [
              {
                type: 'challenge',
                kind: 'teachingTomas',
                person: 'tomas',
                icon: 'friendship',
                competitive: true,
                unit: 'years',

                years: 5,
                achievement: 'game_tomas_challenge',

                label: 'Teaching Tomas',
                summary: 'Give Tomas the best advice each year for the next 5 years.',

                title: 'Helping a friend',
                description: `You started helping Tomas with his journey to becoming a better investor. `
              }
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 15;
    },
    isOutstanding: () => true,
  },
  
  


  grandmaLiving: {
    chains: ['grandma-living'],
    type: 'property',
    name: 'grandmaLiving',
    icon: 'BadgesProperty',
    scene: [{name: 'Park-Bench', actors: ['grandma']}],
    parameters: {
      choice: {
        title: `Grandma's living situation`,
        description: `Grandma needs a new living situation and she needs your help to figure it out.`,
       
        options: [
          {
            effect: '-$30K/yr for senior living',
            title: 'Help her move to a senior living community',
            description: `You tell her that you'll help pay for her to live in a senior living community.`,

            actions: [
              {
                type: 'pay',
                kind: 'grandmaLiving',
                icon: 'Property',
                years: 2,
                sum: 30000,
                meta: '-$30K/yr',
                title: `Paying grandma's rent`,
                description: `You've helped Grandma move into a new apartment.`
              },
            ]
          },

          {
            title: 'Have her live with you',
            description: `You tell her that she can live with you. You'd have to renovate your home to make room for her though.`,
            effect: '-$50K for rennovation',
            kind: 'coliving',

            actions: [
              {
                type: 'renovate',
                amount: 50000,
                meta: '-$50K',
                icon: 'Property',
                title: 'Made Grandma a roommate',
                description: 'You helped Grandma move into the new addition you built. The renovation increased the value of the home.'
              }
            ]
          }
        ]
      },
      ...buyHouse.parameters
    },
    prepare: (decision, state, { choice, houseChoice, payment }) => {
      const houseDecision = buyHouse.prepare(decision, state, { houseChoice, payment });
      return update(houseDecision, {
        parameters: {
          houseChoice: {
            $merge: {
              description: 'You do not have a house yet.'
            },
            options: {
              $unset: [3]
            }
          }
        }
      })
    },
    react: (decision, state, { choice, houseChoice, payment }) => {
      const { houses } = state;
      const decidedToColive = choice && choice.kind === 'coliving';
      const hasLivableHouse = houses.find((house) => house.kind !== 'holiday');
      if (!decidedToColive || hasLivableHouse) {
        return update(decision, {
          parameters: {
            $unset: ['houseChoice', 'payment']
          }
        })
      };


      return buyHouse.react(decision, state, { houseChoice, payment });
    },
    finalize: (decision, { choice, houseChoice, payment }, state, log) => {
      const decidedToColive = choice && choice.kind === 'coliving';
      if (decidedToColive) {
        const residence = state.residence ;
        var livableHouse = state.residence || state.houses.find((house) => house.kind !== 'holiday');
        if (livableHouse) {
          if (!residence || residence.id !== livableHouse.id) {
            var houseActions = [
              { type: 'moveIn', id: livableHouse.id, context: livableHouse.name }
            ]
          } else {
            var houseActions = [];
          }
        } else {
          var houseActions = buyHouse.finalize(decision, { houseChoice, payment }, state, log);
          livableHouse = houseActions.find((h) => h.id);
        }
        return houseActions.concat(
          update(choice.actions[0], {
            $merge: {
              id: livableHouse.id,
              context: livableHouse.name
            }
          })
        )
      } else {
        return choice.actions
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 17;
    },
    isOutstanding: () => true,
  },



  grandmaFinalChallenge: {
    chains: ['grandmaFinalChallenge'],
    type: 'investments',
    name: 'grandmaFinalChallenge',
    icon: 'BadgesProperty',
    scene: [{name: ({residence}) => residence ? 'Home-Rest' : 'Dorm-Rest', actors: [false, 'character']}],
    parameters: {
      choice: {
        title: `Grandma's final challenge`,
        description: `Grandma left you a note in her will. It’s her final challenge. She set up a trust that will reward you $100K if you have an average rate of return of at least 10% over the next 8 years in your brokerage account.`,
       
        options: [
          {
            title: 'Accept the challenge',
            description: `This will be a tough challenge but you have all of the tools you need to pull it off.`,

            actions: [
              {
                type: 'challenge',
                icon: 'stocks',
                kind: 'return',
                person: 'grandma',
                years: 8,
                unit: 'years',
                achievement: 'game_return_challenge',
                
                title: `Started grandma's challenge`,
                description: `Time to start putting everything you've learned to the test.`,

                label: `Grandma's final challenge`,
                summary: `Have an average rate of return in your brokerage account of at least 10% over the next 8 years.`,
              },
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 19;
    },
    isOutstanding: () => true,
  },

  tomasHotTip: {
    chains: ['property-challenge'],
    type: 'investments',
    name: 'grandmaFinallChallenge',
    icon: 'BadgesProperty',
    scene: [{name: ({residence}) => residence ? 'Home-Rest' : 'Dorm-Rest', actors: ['tomas', 'character'], clips: {
        tomas: ['Standing.Yelling']
    }}],
    parameters: {
      choice: {
        title: `A hot tip from Tomas`,
        description: `Excited by how much you have helped him learn about investing, Tomas wants to return the favor. He says he has a hot stock tip from an insider that will guarantee a huge return, are you in for $50K?`,
       
        options: [
          {
            title: 'You are in!',
            description: `You don't want to miss out on big gains so you tell Tomas that you're in.`,

            actions: [
              {
                type: 'pay',
                icon: 'friendship',
                kind: 'tomasScam',
                title: `Accepted Tomas' offer`,
                sum: 50000,
                description: `You transferred $50K. He says all you have to do now is wait for the stock to pop!`,
              },
            ]
          },

          {
            title: 'You are out',
            description: `You're hesitant about where the tip is coming from so you decide to pass on the offer.`,

            actions: [
              {
                type: 'story',
                kind: 'declinedTomasScam',
                icon: 'misfortune',
                title: `Passed on Tomas' tip`,
                description: `You decided not to go in on Tomas' stock tip.`,
              },
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 20;
    },
    isOutstanding: () => true,
  },

  visitTomas: {
    chains: ['visitTomas'],
    type: 'investments',
    name: 'visitTomas',
    icon: 'BadgesProperty',
    scene: [{
      name: ({residence}) => residence ? 'Home-Rest' : 'Dorm-Rest',
      actors: [false], clips: {
        character: ['Standing.Thinking']
      }
    }],
    parameters: {
      choice: {
        title: `Tomas, friend or foe?`,
        description: `Your world is spinning and your friend is now in prison.  You're considering visiting him to see if you can get some answers.
        
        You receive an anonymous letter that says you'll receive $10K if you don't visit Tomas in prison.
        
        Do you visit Tomas in prison?`,
       
        options: [
          {
            title: 'Visit Tomas',
            description: `Even though he gets into trouble, Tomas has been your friend for a long time and he needs your help. You decide to visit him.`,

            actions: [
              {
                type: 'story',
                kind: 'visitedTomas',
                icon: 'friendship',
                title: `Contact visitation`,
                description: `You found the courage to see Tomas. The two of you talked privately at a small table and were allowed a brief hug goodbye.`,
              },
            ]
          },

          {
            title: `Steer clear`,
            effect: 'Take $10K',
            description: `You couldn't find the courage to visit Tomas in prison. An envelope filled with cash was slipped under your door.`,

            actions: [
              {
                type: 'bonus',
                amount: 10000,
                meta: '+$10K',
                icon: 'finance',
                title: `You didn't visit Tomas`,
                description: `You didn't visit Tomas in prison. You found an envelope under your door filled with cash.`,
              },
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 22;
    },
    isOutstanding: () => true,
  },

  savingUp: {
    chains: ['savingUp'],
    type: 'investments',
    name: 'savingUp',
    icon: 'BadgesProperty',
    scene: [{name: 'Property-Buy', actors: ['mary', 'character'], clips: {
      mary: ['Standing.Talking', 'Standing.Talking'],
      character: ['Standing.Agreeing', 'Standing.Agreeing']
    }}],
    parameters: {
      choice: {
        title: `Goal oriented`,
        description: `You ask Mary for her advice on how to get the family business back. She says to be patient until an opportunity presents itself. 

        She recommends you focus on building your net worth because getting your business back will no doubt be expensive.  `,
       
        options: [
          {
            title: 'Set your sights',
            description: `You thank Mary for her advice. Even with enough evidence to take down Mr. Sinister, you'll need $1M to buy the business back. If he manages to escape a conviction, he will likely demand a higher price of $1.75M. It will take 5 years to finish gathering evidence and go through the proper legal process.`,

            actions: [
              {
                type: 'challenge',
                years: 5,
                kind: 'saving',
                summary: 'Have at least $1M in cash and investments in 5 years',
                label: 'Goal oriented',
                icon: 'finance',
                title: `Started saving`,
                person: 'mary',
                competitive: true,
                description: `You set a goal of $1M to buy back the family business in 5 years.`,
              },
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 23;
    },
    isOutstanding: () => true,
  },

  submittingEvidence: {
    chains: ['savingUp'],
    type: 'career',
    name: 'submittingEvidence',
    icon: 'BadgesProperty',
    scene: [{name: 'University-Enter', actors: ['cop']}],
    parameters: {
      choice: {
        title: `Silencing Mr. Sinister`,
        description: `This is it. It's time to stop Mr. Sinister and his corruption. You present all the evidence you have but will it be enough for a conviction?`,
       
        options: [
          {
            title: 'Submit evidence',
            description: `You hire a legal team and use the evidence you've collected to try to take down Mr. Sinister. `,

            actions: [
              {
                type: 'story',
                icon: 'career',
                title: `Fingers crossed`,
                description: `There's no looking back. You've made your choices. Now you wait for the verdict.`,
              },
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 26;
    },
    isOutstanding: () => true,
  },

  buyingBusinesss: {
    chains: ['savingUp'],
    type: 'career',
    name: 'buyingBusinesss',
    icon: 'BadgesProperty',
    scene: ['Bank-Visit'],
    //scene: [{name: 'EvilCorp'}],
    parameters: {
      choice: {
        title: `Buying the business`,
        description: ({choices}) => 
          !choices.defeatedBoss ? `Mr. Sinister laughs maniacally, still enjoying your failed attempt to beat him. He says you're lucky that he's a simple man, only interested in money. You think he destroyed any evidence of his treacherous past. 

          He offers to sell the family business back to you for $1.75M. It's a final offer and you won't get another chance.`
                 
               : `The remaining board of EVILCorp makes you an offer to buy back the family business for $1M! It's a final offer and you won't get another chance.`,
       
        options: [
          {
            price: ({choices}) => choices.defeatedBoss ? 1000000 : 1750000,
            title: `Reclaim your family's legacy`,
            description: `You might have to sell property, investments, and take out a loan, but your investment decisions have ultimately put you in a place to buy back your family's business.`,
            disabled: ({choices, cash}) => (choices.defeatedBoss ? 1000000 : 1750000) > cash ? `__Mr. Sinister with EVILCorp only takes cash and you don't have enough.__
            
            Sell some assets to raise more cash and come back to this decision before the end of the year`  : undefined,

            actions: [
              {
                sum: ({choices}) => choices.defeatedBoss ? 1000000 : 1750000,
                meta: ({ choices }) => (choices.defeatedBoss ? '-$1M' : '-$1.75M') + ', +Family business',
                type: 'pay',
                kind: 'buyback',
                icon: 'career',
                title: `Bought back the family business`,
                description: `You're beaming with joy after having bought back the family business. You took a moment to enjoy the success.`,
              },
            ]
          },
          {
            title: `Let it go`,
            description: `You decide to let Paper Chase Inc. slip through your fingers. You have to move on from your past, and look forward to creating something new.`,

            actions: [
              {
                type: 'story',
                icon: 'misfortune',
                title: `You lost Paper Chase Inc.`,
                description: `You didn't buy back the family business. You took a moment to reflect on this failure.`,
              },
            ]
          }
        ]
      }
    },
    isApplicable: ({ turn }) => {
      return turn == 28;
    },
    isOutstanding: () => true,
  },


  newsChallengePrediction: {
    chains: ['news-prediction'],
    type: 'investments',
    name: 'newsChallengePrediction',
    icon: 'BadgesStocks',
    scene: [{name: 'Exchange-Club', clips: {
      character: ['Standing.Agreeing|Standing.Talking|Standing.Disappointed|Standing.Pointing|Standing.PointingBack', 'Standing.Agreeing|Standing.Talking|Standing.Disappointed|Standing.Pointing|Standing.PointingBack']
    }}, {name: 'Exchange-Dividends', clips: {
      character: [false, 'Sitting.Talking|Sitting.Clapping']
    }}, {name: 'Exchange-Success', clips: {
      character: ['Standing.Agreeing|Standing.Talking|Standing.Disappointed|Standing.Pointing|Standing.PointingBack', 'Standing.Agreeing|Standing.Talking|Standing.Disappointed|Standing.Pointing|Standing.PointingBack']
    }}],

    parameters: {
      choice: {
        options: [
          {
            
            title: 'Stock price went up',
            description: 'Based on the company news **and** the current economic conditions, you tell Mary and the investment club that you think the stock price of EVILCorp increased.',

            actions: [
              {
                type: 'newsPrediction',
                direction: 'up',
                kind: 'prediction',
                icon: 'fortune',
                description: 'You told the investment club that you think the price of EVILCorp had gone up.'
              },
            ]
          },
          {

            title: 'Stock price went down',
            description: 'Based on the company news **and** the current economic conditions, you tell Mary and the investment club that you think the stock price of EVILCorp decreased.',
            actions: [
              {
                type: 'newsPrediction',
                direction: 'down',
                kind: 'prediction',
                icon: 'misfortune',
                description: 'You told the investment club that you think the price of EVILCorp had gone down.'
              }
            ]
          }
        ]
      }
    },

    prepare: (decision, { challenges, companies, year }, choice) => {
      const news = companies.find((c) => c.ticker === 'EVIL').events[0]
      const challenge = challenges.news;
      const title = 'EVILCorp: ' + news.title;
      const description = news.description;
      const yr = year - challenge.year + 1
      

      return update(decision, {
        title: { $set: title },
        description: { $set: description },
        parameters: {
          choice: {
            title: { $set: title },
            description: { $set: description },

            options: {
              0: {
                actions: {
                  0: {
                    title: { $set: 'Year ' + yr + " news"}
                  }
                }
              },
              1: {
                actions: {
                  0: {
                    title: { $set: 'Year ' + yr + " news"}
                  }
                }
              }
            }
          }
        }
      })
    },

    isOutstanding: () => true,
    
    isApplicable: ({ activeChallenges: { news }, year }, actions) => {
      if (news && news.year + news.years > year) {
        return true;
      }
    }
  },

  tomasQuiz: {
    type: 'investment',
    name: 'tomasQuiz',
    icon: 'BadgesCareer',
    chains: ['tomas-stuff'],
    scene: [
      {name: 'Cafe-Visit', actors: ['tomas']},
      {name: 'Burgers-Meeting', actors: ['tomas']},
      {name: 'Hotdogs', actors: ['tomas']},
      {name: 'Home-Roof', actors: ['tomas'], clips: {
        character: ['Standing.Talking'],
      }},
      {name: 'University-Study', actors: ['tomas'], clips: {
        tomas: ['Standing.Agreeing'],
        character: ['Standing.Talking'],
      }}
    ],

    parameters: { 
      choice: {

      }
    },

    prepare: (decision, {activeChallenges: { teachingTomas }, year}) => {
      const step = year - teachingTomas.year;
      const question = tomasQuestions[step];
      const attributes = {
        title: 'Teaching Tomas: Year ' + (step + 1),
        description: question.description,
      }
      return update(decision, {
        $merge: attributes,

        parameters: {
          choice: {
            $merge: attributes,

            options: {
              $set: question.options.map((option) => ({
                ...option,
                actions: [
                  {
                    type: 'tomasAnswer',
                    index: step,
                    correct: !!option.correct,
                    description: option.copy,
                    title: 'Year ' + (step + 1) + ' advice'
                  }
                ]
              }))
            }
          }
        }
      })
    },
    isApplicable: ({activeChallenges: { teachingTomas }}) => {
      return teachingTomas
    },
    isOutstanding: () => true
  },


  corporateJobOffer: {
    type: 'career',
    name: 'corporateJobOffer',
    icon: 'BadgesCareer',
    chains: ['job-offer'],
    scene: ['Office-Hire'],
    title: 'Corporate job offer',
    description: 'Corporate jobs have higher salary and provide stocks, while startups may make it big',
    parameters: {
      choice: {
        title: 'Corporate job offer',
        description: 'Corporate jobs have higher salary and provide stocks, while startups may make it big',
        options: [
          {
            title: 'Corporate job 1',
            description: "Good salary, stock bonuses",
            actions: [
              {type: 'work', multiplier: 1.1}
            ]
          },
          {
            title: 'Decline job offer',
            description: "I am flattered for the high compensation offer. It’s a nod towards your professional progression; however, you am not ready to leave your current job yet and you think there is more to learn here. You’ll let them know you am declining.",
            actions: [
              {type: 'story', title: 'Declined the new job offer', icon: 'Career', description: " you might regret this later but You’ve decided to walk away from a lot of money. You am not ready for a change yet and have decided to stay at your current job."}
            ]
          }
        ],
      },
    },
    isApplicable: ({seed, year, turn, study, education}) => 
      (education && !study && turn > 12) 
        && MATH.seed(seed + year * 93)() < 1 / 12 
        && MATH.seed(seed + year * 111)() >= 1 / 12,

    isOutstanding: () => true,
      
    prepare: (decision, { year, seed, companies, salaryExpectation, job }) => {
      const random = MATH.seed(seed + year * 93);
      const company = MATH.shuffle(companies.filter((c) => c.ticker !== 'EVIL'), random)[0];
      
      const flavours = [
        {
          title: 'Approached by Ivy League alumni',
          description: `Elizabeth, a classmate and close friend you met freshmen year, met you up for coffee. She’s now the VP at \`${company.name}\` company and she’s looking to grow her team. She thinks you’d be a great fit and can pull some strings internally to get you a higher paying offer than what is typically set for this position. She needs to fill the role fast, time is of the essence.`
        },
        {
          title: 'Attempted poaching by an executive',
          description: `You’ve ran into an executive at \`${company.name}\` company a few times at happy hours and networking events. He’s keenly aware of what you are capable of and has hinted that he’d love to have you on his team. Hints turned to a reality as last night, he pulled you aside and provided a verbal offer to join his company.`
        }
      ]
      const flavour = MATH.shuffle(flavours, random)[0];

      return update(decision, {
        $merge: flavour,
        parameters: {
          choice: {
            $merge: flavour,
            options: {
              0: (offer) => update(prepareCorporateOffer(offer, company, salaryExpectation * 1.1, job), {
                title: () => 'Accept job offer'
              })
            }
          }
        }
      })
    }
  },
  
  startupJobOffer: {
    type: 'career',
    name: 'jobOffer',
    icon: 'BadgesCareer',
    chains: ['job-offer'],
    scene: ['Startup-Rest'],
    title: 'Startup job offer',
    description: 'Startups may make it big',
    parameters: {
      choice: {
        title: 'Startup job offer',
        description: 'Startups may make it big',
        options: [
          {
            title: 'Startup job',
            actions: [
              {type: 'work', chance: 0.3, multiplier: 0.75}
            ]
          },
          {
            title: 'Decline job offer',
            description: `You've thought about the offer and while it's enticing, you like your current job and the team you am working on. You’ll let her know that you really appreciate the consideration but will respectfully decline.`,
            actions: [
              {
                type: 'story', 
                title: 'Declined job offer', 
                icon: 'Career', 
              }
            ]
          }
        ],
      },
    },
    isApplicable: ({turn, seed, year, study, education}) => 
      (education && !study && turn > 12) 
          && MATH.seed(seed + year * 93)() > 1 / 12 
          && MATH.seed(seed + year * 111)() <= 1 / 12,

    isOutstanding: () => true,
      
    prepare: (decision, { year, seed, companies, salaryExpectation }) => {
      const random = MATH.seed(seed + year * 93);
      const offer = MATH.shuffle(companies, random)[0];
      
      const flavours = [
        {
          title: 'A startup CEO reaches out to you',
          description: 'You received a LinkedIn invite plus message from a startup CEO. Out of curiosity you end up taking a phone call and the CEO tells you about her team and vision. The conversation is great and you really think there’s a lot of opportunity for the company to be successful. She’s indicated she wants to hire you for a key role.',
          acceptTitle: 'Accepted startup offer',
          accept: 'You let the CEO know that you am super excited for the opportunity.',
          decline: ' you hope you won’t regret not joining this startup now because you know this opportunity doesn’t come up often and miss out on a big payout.',
        },
        {
          title: 'Your friend pitches you a startup idea',
          description: `A friend and former colleague has asked you out to dinner. She’s telling you about an idea for a new company she’s started. She has successfully raised money and you’ve always thought she was wicked smart; the new company has promise too. She has offered you a job at her company.`,
          acceptTitle: 'Joined your friend\'s startup',
          accept: 'You let your friend know that you am super excited to be working with her again.',
          decline: "I might regret not joining your friend’s startup but you am not ready to leave your job yet."
        },
      ]
      const flavour = MATH.shuffle(flavours, random)[0];

      return update(decision, {
        $merge: flavour,
        parameters: {
          choice: {
            $merge: flavour,
            options:  {
              0: (offer) => update(prepareStartupOffer(offer, salaryExpectation), {
                $merge: {
                  title: 'Accept job offer',
                  description: `The offer is a yearly salary of \`${formatters.currency(salaryExpectation * 0.75)}\`
                  and stock options representing \`2%\` of the company over 4 years. 
                  Benefits include a 401(k) match up to \`${formatters.rate(retirementPlans[0].max)}\`. 
                  you think the idea and company leadership is great and has a high chance of a big payout. 
                  you will gladly accept the offer.`
                },
                actions: {
                  0: {
                    $merge: {
                      title: flavour.acceptTitle,
                      description: `${flavour.accept}, 
                      She put together a package of \`${formatters.currency(salaryExpectation * 0.75)}\` per year and an outsize ownership in the company. 
                      The 401(k) match is \`${formatRetirementPlan(retirementPlans[0])}\`. 
                      you have a better feeling about this startup than any others.`
                    }
                  }
                }
              }),
              1: {
                actions: {
                  0: {
                    description: () => flavour.decline
                  }
                }
              }
            }
          }
        }
      })
    }
  },
  exerciseOptions: {
    chains: ['exercise', 'job-search', 'job-offer'],
    type: 'career',
    icon: 'BadgesStocks',
    name: 'exerciseOptions',
    title: 'Exercise your vested options?',
    scene: ['Bank-Visit', 'Bank-Visit-2'],
    description: 'After giving notice, the general counsel of your startup reminded me that you have 90 days to decide whether to exercise your stock options or not. If you choose not to exercise, you will be forfeiting your equity in the startup.',
    parameters: {
      choice: {
        title: 'Exercise your vested options?',
        description: ({salaryExpectation}) => `The current cost to exercise your current vested options is \`${formatters.currency(salaryExpectation / 2)}\`. Exercising means you will pay the company this amount of money in return for common stock in the company.`,
        options: [
          {
            value: true,
            title: 'Exercise your shares',
            name: 'common stock',
            effect: ({salaryExpectation}) => '-' + formatters.currency(salaryExpectation / 2),
            price: ({salaryExpectation}) => salaryExpectation / 2,
            description: 'You am planning on paying the exercise amount because you believe the company might have a good chance to be successful and if they are, the payout expected can be quite large.',
            actions: [
              {
                type: 'exercise',
                icon: 'Finance',
                id: ({options}) => options.id,
                chance: ({options}) => options.chance,
                price: ({salaryExpectation}) => salaryExpectation / 2,
                title: 'Exercised startup options',
                description: 'You took a leap of faith today and exercised your stock options. Now you own common stock in the startup and hopefully in a few years this stock will be very valuable.'
              }
            ]
          },
          {
            value: false,
            title: 'Defer exercising',
            description: 'The cash requirement to exercise is too much for me right now. You will defer this decision until you need to make it later.',
          }
        ]
      },
      payment: {
        title: 'Covering the exercise cost',
        description: ({salaryExpectation}) => `Your general counsel has told me that the total cost to exercise would be ${formatters.currency(salaryExpectation / 2)}. You am to come up with the cash and exercise electronically through our equity management platform.`,
        options: [
          {
            title: 'You’ve got the cash',
            description: 'You’ll connect your bank account and go through with exercising.',
            disabledMessage: ({portfolio, houses}) => 
              `**You don’t currently have enough in your savings for an all-cash offer. **

              ${(portfolio.length > 0 || houses.length > 0) && `Consider selling some of your ${formatters.and([portfolio.length > 0 && 'stock', houses.length > 0 && 'property'])}.`}`,
            actions: [
              {type: 'pay', kind: 'options'}
            ]
          },
          ...loanOptions
        ]
      }
    },
    prepare: (decision, state, { choice }) => {
      const {job, year, cash} = state;
      var newDecision = 
        choice && choice.value === false 
          ? update(decision, {
            parameters: {
              $unset: ['payment']
            }
          }) 
          : choice 
            ? update(decision, {
                parameters: {
                  payment: (payment) => preparePayment(payment, state, choice, 'The cost to excercise your options', 'loan') 
                }
            })
            : decision
      if (job && job.year === year) {
        return update(newDecision, {
          parameters: {
            choice: {
              options: {
                0: {
                  $merge: {
                    description: 'You am planning on paying the exercise amount because you believe the company might have a good chance to be successful and if they are, the payout expected can be 100x the cost to exercise!'
                  }
                },
                1: {
                  $set: {
                    value: false,
                    title: 'Forfeit your shares',
                    description: 'You will let the general counsel know that you do not plan on paying the cost to exercise and that you know you am walking away from your shares in the startup.',
                    actions: [
                      {
                        type: 'story',
                        icon: 'Finance',
                        title: 'Forfeited startup options',
                        description: 'You had a better use of your cash right now and after taking some time to think about it, you would rather not take the risk of paying money into something that might result in a loss for me.'
                      }
                    ]
                  }
                }
              }
            }
          }
        })
      }
      return newDecision;
    },
    isApplicable: ({ options, exercisedOptions }, dialog) => options && !exercisedOptions,
    isChainable: ({job, exercisedOptions, year}, dialog) => {
      return (job && job.chain === dialog && job.year === year) && (!exercisedOptions || exercisedOptions.chain === dialog);
    },

    finalize: (decision, {choice, payment}, state, log) => {
      const pay = payment && (!payment.years ? payment.actions[0] : {
        type: 'borrow',
        kind: 'personal',
        name: 'Personal loan',
        riskFreeRate: state.riskFreeRate,
        description: 'You’ve decided to take a personal loan from private lenders. This loan will add to your monthly payments but you will put the money to good use.',
        rate: payment.rate,
        years: payment.value
      });
      return (choice.actions || []).concat(choice.price ? update(pay, {
        $merge: {
          sum: choice.price,
          context: choice.name
        }
      }) : [])
    },
  },



  retirementPlan: {
    chains: ['retirement-plan', 'career', 'job-search', 'job-offer'],
    type: 'career',
    name: 'retirementPlan',
    icon: 'BadgesSaving',
    scene: ['Finance-Retirement'],
    parameters: {
      choice: {
        title: 'Contribute to 401(k)',
        options: [
          {
            title: '$19K (max)',
            class: 'half',
            value: 19000,
            //effect: '-$5K/yr',
            description: '$$19'
          },
          {
            title: '$15K',
            value: 15000,
            class: 'half'
          },
          {
            title: '$10K',
            value: 10000,
            class: 'half'
          },
          {
            title: '$7K',
            value: 7000,
            class: 'half'
          },
          {
            title: '$4K',
            value: 4000,
            class: 'half'
          },
          {
            title: '$2K',
            minimal: true,
            value: 2000,
            class: 'half'
          },
          {
            value: false,
            title: 'No, decline participation',
            description: 'You’d rather pay tax on your full income and invest the money in other things for now.',
            actions: [
              {
                type: 'retirementContribution',
                title: 'Declined to participate in 401(k)',
                description: `I set your 401(k) participation to 0% and you think there's a better use of the cash right now than to save it for retirement. You might reconsider in a few years.`
              }
            ]
          }
        ]
      },
      allocation: {
        title: 'Pick your 401(k) allocation',
        description: `Your 401(k) plan offers the following investment options. The mutual funds below represent a mix of stocks and bonds. A higher percent of stocks is riskier but has higher potential returns. `,
        options: [
          {
            value: '9010',
            title: '90% stocks and 10% bonds',
            description: 'Aggressive with fewer bonds',
            class: 'half'
          },
          {
            value: '7030',
            title: '70% stocks and 30% bonds',
            description: 'Moderate with more bonds',
            class: 'half'
          },
          {
            value: '5050',
            title: '50% stocks and 50% bonds',
            description: 'Defensive with the most bonds',
            class: 'half'
          },
          {
            value: 'GRTH',
            title: 'Growth stocks',
            description: '100% aggressive stock composite',
            class: 'half'
          },
          {
            value: 'VLUE',
            title: 'Value stocks',
            description: '100% stock composite',
            class: 'half'
          },
          {
            value: null,
            title: 'Manage it yourself',
            //effect: 'Manage your investments',
            description: `Your 401(k) contributions will stay in cash until you invest it.`,
            class: 'half'
          },
        ]
      }
    },
    prepare: (decision, { job, salary }, { choice }) => {
      if (!job || !job.retirementPlan) return decision;
      var plan = formatRetirementPlan(job.retirementPlan);
      const description = `Your employer offers a 401(k) plan for all of their employees. The plan states that they will match **__${plan}__. They won't match if you contribute more than that.**  They won't match if you contribute more than that. Contributing to a 401(k) will help you save for retirement and lower the income taxes that you pay today.`

      const minimal = decision.parameters.choice.options.find((option) => option.minimal);
      const options = decision.parameters.choice.options.map((option) => {
        if (!option.value) {
          if (job.retirementPlan.match1Portion) {
            return update(option, {
              actions: () => minimal.actions
            });
          } else {
            return option;
          }
        } 
        return prepareRetirementContributionOption(option, job, salary)
      })
      return update(decision, {
        description: () => description,
        parameters: {
          choice: {
            description: () => description,
            options: () => options
          },
          $unset: [
            (choice && !choice.value) ? 'allocation' : null
          ].filter(Boolean)
        }
      })
    },
    isApplicable: ({ retirementPlan }) => {
      return retirementPlan
    },
    isChainable: ({ retirementPlan, previous, year, job }, dialog) => {
      // Dont show if plan hasnt changed
      if (isEqual(retirementPlan, previous.retirementPlan)) {
        return false;
      }
      // Show only if job was set within current chain
      return (job && job.year === year && job.chain === dialog)
    },
    finalize: (decision, {choice, allocation, retirementAllocation},) => {
      if (!allocation || !allocation.value && !choice.actions) {
        return (choice.actions || []);
      }
      var prettyTicker = !allocation.value ? '' : (allocation.value.match(/\d\d\d\d/) ? allocation.value.substring(0, 2) + '/' + allocation.value.substring(0, 2) : allocation.value);
      return (choice.actions || []).concat({
        type: 'retirementAllocation',
        ticker: allocation.value,
        title: 'Updated your 401(k) investment',
        meta: allocation.value ? `Investing into ${allocation.value}` : `Investing manually`,
        description: allocation.value
          ? `Your 401(k) contributions will automatically be invested. **You will need to reinvest any dividends you earn in this account.**`
          : `You have decided to take the management of your 401(k) into your own hands. This means all future contributions will sit in cash until you choose what investments to buy.`,
      })
    }
  }

}

export default Choices;



export const tomasQuestions = [
  {
    description: 'Tomas is looking to maximize his returns over time and is willing to take on the most risk. Which mutual fund do you suggest he look at?',
    options: [
      {
        title: '50 stock / 50 bond',
        description: 'You tell him that he should check out the 50% stock / 50% bond mutual fund.',
        copy: 'You suggested the 50 stock / 50 bond mutual fund to Tomas as an investment that would maximize his returns.',
      },
      {
        title: '90 stock / 10 bond',
        description: 'You tell him that he should check out the 90% stock / 10% bond mutual fund.',
        copy: 'You suggested the 90 stock / 10 bond mutual fund to Tomas as an investment that would maximize his returns.',
      },
      {
        title: 'Growth Mutual Fund',
        description: 'You tell him that he should check out the Growth mutual fund.',
        correct: true,
        copy: 'You suggested the Growth mutual fund to Tomas as an investment that would maximize his returns.',
      }
    ],
    correct: `Tomas looked into the Growth mutual fund that you suggested and decided to add it to his portfolio. It turned out to be what he was looking for and he is happy with the investment.`,
    incorrect: `Tomas looked into the portfolio that you suggested and it didn’t turn out to be what he was looking for. The investment you suggested included bonds which typically have lower returns than stocks and are also less risky. Tomas ended up going with the Growth mutual fund because, despite being riskier, it contains only high growth stocks that often see the highest return.`
  },
  {
    description: 'Tomas is thinking about taking out a personal loan but he wants to know how much debt is too much.',
    options: [
      {
        title: 'There will always be debt',
        description: 'You told Tomas that he should take out the biggest loan he can qualify for.',
        copy: 'You told Tomas that he should take out the biggest loan he can qualify for.'
      },
      {
        title: 'Pay off debt',
        description: 'You tell Tomas that debt isn’t good and he’s better off not borrowing if he can help it. Instead you suggest he work towards paying off any debt that he currently has as quickly as he can.',
        copy: 'You told Tomas that he shouldn’t take out any debt and pay off any outstanding debt as quickly as he can.'
      },
      {
        correct: true,
        title: '35% of Income',
        description: 'You tell Tomas that debt isn’t necessarily bad, as long as he’s able to pay it back. You suggest that he borrow what he needs but to make sure that his debt payments each year amount to less than 35% of his income. If they are more than that, it will be difficult to pay them back in addition to all of his other expenses.',
        copy: 'You told Tomas that he should borrow what he needs as long as his debt payments are less than 35% of his income. '
      }
    ],
    correct: 'Tomas took your advice and made sure he didn’t borrow more than he’d be able to pay back by keeping his debt payments below 35% of his income. By allowing himself to have debt, especially at lower interest rates, he was able to put more of his income towards an emergency fund. He was also able to put more money into his retirement account and investments to take advantage of compounding returns.',
    incorrect: 'Tomas ended up borrowing what he needed but made sure his debt payments would be less than 35% of his income. If he borrowed the most he qualified for, eventually his minimum payments would be so large that he wouldn’t be able to afford them with his other life expenses. If he didn’t borrow at all, he wouldn’t have been able to put as much money into his retirement account or investments and would have missed out on compounding returns.'
  },
  {
    description: 'Tomas wants to earn investment income. He asks you which investment will generate the most income?',
    options: [
      {
        correct: true,
        title: 'High Yield Corporate Bonds',
        description: 'You tell Tomas to look into investing in high yield corporate bonds because of the interest they provide.',
        copy: 'You suggested high yield corporate bonds to Tomas for generating investment income.'
      },
      {
        title: 'Treasury Bonds',
        description: 'You tell Tomas to look into investing in treasury bonds because of the interest they provide.',
        copy: 'You suggested treasury bonds to Tomas for generating investment income.'
      },
      {
        title: 'Growth mutual fund',
        description: 'You tell Tomas to look into investing in a growth mutual fund because of the dividends they provide.',
        copy: 'You suggested a growth mutual fund to Tomas for generating investment income.'
      },
      {
        title: '50 stock / 50 bonds',
        description: 'You tell Tomas to look into investing in a 50% stock / 50% bond mutual fund because of the dividends they provide.',
        copy: 'You suggested a 50 stock / 50 bond mutual fund to Tomas for generating investment income.'
      }
    ],
    correct: 'Tomas took your advice and looked into investing in high yield corporate bonds. He is happy that they fit his investment goal of maximizing his investment income and are a nice addition to his portfolio. Their interest rate is higher than the Treasury bonds and the dividend yields of any other mutual fund.',
    incorrect: 'Tomas looked into your suggestion but decided to invest in high yield corporate bonds. Their interest rate is higher than the Treasury bonds and the dividend yields of any other mutual fund so he felt they better fit his investment goal of maximizing his investment income.'
  },
  {
    description: 'Tomas remembers you telling him about your meeting with John, the tax advisor. He asks if you would pass along any advice that would help him lower his taxes too!',
    options: [
      {
        correct: true,
        title: 'Invest more for retirement',
        description: 'You find out that Tomas hasn’t been contributing to his employer’s 401(k) plan. You tell him that he should consider saving for retirement through a 401(k) account. ',
        copy: 'You suggested Tomas look into contributing to a 401(k).'
      },
      {
        title: 'Realize gains',
        description: 'You tell Tomas that he should think about realizing his capital gains.',
        copy: 'You told Tomas to think about realizing his capital gains.'
      },
      {
        title: 'Earn more investment income',
        description: 'You tell Tomas to consider reallocating his investments to generate more investment income through interest and dividends.',
        copy: 'You told Tomas to consider earning more investment income.'
      }
    ],
    correct: 'Tomas took your advice and started making 401(k) contributions. As he was doing his taxes, he was happy to hear that the contributions are tax deductible! He had also sold some of his investments at a loss which offset some of the capital gains he made on his investments that year.',
    incorrect: 'Tomas considered your advice but decided to start contributing to a 401(k) account. As he was doing his taxes, he found out that the contributions are tax deductible. He had also sold some of his investments at a loss which offset some of the capital gains he made on his investments that year. The additional investment income he made through interest and dividends added to his taxable income.'
  },
  {
    description: 'You and Tomas are talking about current events and he asks you about how company news affects stock prices. He offers a few examples that he thinks would positively affect a stock price and why. Which one do you agree with?',
    options: [
      {
        title: 'Acquiring another company',
        description: 'You agree with Tomas that a company’s stock price usually goes up when it announces that it will acquire another company. His reasoning is that the company must be doing really well if it’s able to buy another company and so that company’s stock price should go up. ',
        copy: 'You agreed with Tomas that a company’s stock price would usually go up when it announces that it will acquire another company.'
      },
      {
        correct: true,
        title: 'Share buybacks',
        description: 'You agree with Tomas that a company’s stock price usually goes up after it announces that it will buy back shares of stock. His reasoning is that stock prices move, in part, because of supply and demand which means that a buyback will increase the price of a stock since it reduces the supply of shares in the market. ',
        copy: 'You agreed with Tomas that a company’s stock price would usually go up when it announces a share buyback.'
      },
      {
        title: 'Earnings growth',
        description: 'You agree with Tomas that a company’s stock price would usually go up any time the company reports earnings growth. His reasoning is that the growth in earnings means that the company is growing and so that is reflected in an increase in the price of the stock. ',
        copy: 'You agreed with Tomas that a company’s stock price would usually go up when it announces earnings growth.'
      }
    ],
    correct: 'After doing some research, Tomas was pleased to find that you were right about share buybacks and how they typically result in an increase in the company’s stock price. He was surprised to find that a company’s stock price typically falls when it announces that it will acquire another company because there is usually an expensive premium paid to buy another company. Also, he noticed that earnings growth itself didn’t mean the stock price would rise, that it had to be above expectations.',
    incorrect: 'After doing some research, Tomas was disappointed to find that you both misunderstood how the company news impacts the stock price. He was surprised to find that a company’s stock price typically falls when it announces that it will acquire another company because there is usually an expensive premium paid to buy another company. Also, he noticed that earnings growth itself didn’t mean the stock price would rise, that it had to be above expectations. He did realize that he was right afterall about how share buybacks typically result in an increase in the company’s stock price.'
  }
]