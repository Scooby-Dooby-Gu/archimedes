export default [
  {
    title: "Investing 101",
    description: "Learn about investing and how we can do more by doing less with our investments.",
    condition: ({turn}) => true,//turn >= 1,
    lessons: [
      137,
      76,
      142]
  },

  {
    title: "News 0",
    description: "Learn how global events and politics drive the short term changes in the value of investments.",
    condition: ({turn}) => turn >= 1,
    lessons: [
      151,
      145,
      141]
  },

  {
    title: "ETF/MF",
    description: "Learn more about ETFs + Mutual Funds.",
    condition: ({turn}) => turn >= 2,
    lessons: [83,95,78]
  },

  {
    title: "Jobs",
    description: "A job offer often includes more than just a salary. Learn more about some of the benefits that are included in an offer.",
    condition: ({turn}) => turn >= 3,
    lessons: [74,77,79]
  },


  {
    title: "Debt",
    description: "Learn more about debt.",
    condition: ({turn}) => turn >= 4,
    lessons: []
  },
  

  {
    title: "Stocks",
    description: "There are a lot of companies to invest in. Learn about stocks and how focusing on a few sectors or industries can help.  .",
    condition: ({turn}) => turn >= 5,
    lessons: [82]
  },
  
  {
    title: "News 2",
    description: "Learn how global events and politics drive the short term changes in the value of investments.",
    condition: ({turn}) => turn >= 6,
    lessons: [150, 140, 138]
  },
  {
    title: "News 3",
    description: "Learn how global events and politics drive the short term changes in the value of investments.",
    condition: ({turn}) => turn >= 7,
    lessons: [148, 139, 152]
  },
  {
    title: "Investment income",
    description: "Learn how investments can be a source of income.",
    condition: ({turn}) => turn >= 8, 
    lessons: [93, 92, 84],
  },
  {
    title: "Company news",
    description: "Company's announce changes to their business in the news. Learn about what news we see and how it could affect the stock price.",
    condition: ({turn}) => turn >= 9, 
    lessons: [],
  },
  {
    title: "Leverage",
    description: "Company's announce changes to their business in the news. Learn about what news we see and how it could affect the stock price.",
    condition: ({turn}) => turn >= 10, 
    lessons: [],
  },
  {
    title: "Buying home",
    description: "Buying a home is the biggest investment that most people will make. Learn more about investing in real estate.",
    condition: ({turn}) => turn >= 11, 
    lessons: [],
  },
  {
    title: "Better investor 1",
    description: "Learn more to become a better investor",
    condition: ({turn}) => turn >= 12, 
    lessons: [88, 85, 89],
  },
  {
    title: "Better investor 2",
    description: "Learn more to become a better investor",
    condition: ({turn}) => turn >= 13, 
    lessons: [73, 154],
  },
  {
    title: "Better investor 3",
    description: "Learn more to become a better investor",
    condition: ({turn}) => turn >= 14, 
    lessons: [155],
  },
  {
    title: "College loans",
    description: "Going to college is an investment in ourselves. Learn how we can fund that investment.",
    condition: ({study, education}) => (study),
    lessons: [
      //137 Opportunity cost
      80,
      81]
  },
  {
    title: "Retirement",
    condition: ({retirementPlan}) => retirementPlan,
    description: "Most companies include retirement plans as a benefit to their employees. Let's learn about how we can make the most of it.",
    lessons: [74, 77, 79, 63]
  },
  {
    title: "Stock options",
    condition: ({job}) => job && job.kind === 'startup',
    description: "Sometimes we might be offered equity in the company in addition to a salary. Let's figure out what that means and how to make the most of this benefit.",
    lessons: [65, 67, 66, 149]
  },
  {
    title: "Equity",
    condition: ({job}) => job && job.kind === 'corporate',
    description: "Sometimes we might be offered equity in the company in addition to a salary. Let's figure out what that means and how to make the most of this benefit.",
    lessons: []
  },

  {
    title: "Investments",
    condition: ({age}) => age > 18,
    description: "Now that you have a brokerage account, let's learn more about investing!",
    lessons: [82, 83]
  },
  {
    title: "Taxes",
    description: "Taxes are an inevitable part of society but are also confusing. Let's try to clarify what some of them are and ways we can lower how much we pay.",
    condition: ({debit}) => debit.taxes > 0, 
    lessons: [106],
  },
  {
    title: "Asset class",
    description: "Taxes are an inevitable part of society but are also confusing. Let's try to clarify what some of them are and ways we can lower how much we pay.",
    condition: ({debit}) => debit.taxes > 0, 
    lessons: [106],
  },
  {
    title: "Investments tracks",
    condition: ({age}) => age > 18,
    description: "Now that you have a brokerage account, let's learn more about investing!",
    lessons: [78, 86, 71, 64, 75, 98, 85, 89, 154, 155]
  },
  {
    title: "Economist tracks",
    condition: ({age}) => age > 18,
    description: "Events around the world drive the changes in the value of our investments. Let's do some research on how global events impact markets and the economy",
    lessons: [151, 145, 150, 138, 148, 139, 152]
  }
]
