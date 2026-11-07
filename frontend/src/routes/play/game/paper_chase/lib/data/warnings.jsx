
export default [
  {
    title: 'Just 10 more years left',
    icon: 'Clock',
    effects: {},
    level: 'bad',
    condition: ({age}) => age == 40,
    description: "This version of paper chase is over when you hit age of 50. **Make your decisions count!**"
  },
  {
    title: 'Running low on money',
    icon: 'Finance',
    effects: {},
    level: 'neutral',
    condition: ({cash, previous}) => cash >= 0 && cash <= 10000 && previous.cash > 10000,
    description: "Your account balance is running low. Make sure you are personally solvent by having more income than expenses. Consider a loan if you are in a pinch and expect to make more income soon."
  },
  {
    title: 'Negative balance',
    icon: 'Finance',
    effects: {},
    level: 'bad',
    condition: ({cash, previous}) => cash < 0 && previous.cash >= 0,
    description: "Uh oh, your account balance is now negative and you owe money to creditors. You currently aren't able make any investments until this is sorted out. Consider liquidating some assets."
  },
  {
    title: 'No actions in last 3 years',
    icon: 'Clock',
    effects: {},
    level: 'neutral',
    condition: ({year, turn}, actions) => actions.length ? year - actions[actions.length - 1].year == 2 : false,
    description: "It's been a while since you've made any changes to your portfolio.  Money never sleeps and neither should you. Go make a new investment today."
  },
  {
    title: 'No actions in more than 5 years',
    icon: 'Clock',
    effects: {},
    level: 'bad',
    condition: ({year, turn}, actions) => actions.length ? year - actions[actions.length - 1].year > 4 : false,
    description: "It's been a while since you've made any changes to your portfolio.  Money never sleeps and neither should you. Go make a new investment today."
  },
]