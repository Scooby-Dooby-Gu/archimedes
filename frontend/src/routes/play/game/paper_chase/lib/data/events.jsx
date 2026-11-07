import companies from './companies';
import update from '/lib/immutability';
import * as formatters from '/lib/formatters';
export default function getCompanyEvents(company) {
  return [
    {
      title: `${company.name} is being acquired`,
      description: `In a joint public statement, \`${company.name}\` acounces with PVT Holdings Group that \`${company.name}\` is being acquired in an all cash offer. The offer will be for a 25% premium over the current trading share price. Pending regulatory approval, this deal is to wrap up by this year and the shares of \`${company.name}\` will still trade publically under the same ticker for now. Shares surge to match the acquisition price.`,
      icon: 'Stocks',
      meta: `+25% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: .25
      },
      conflicts: [`${company.name} acquires a startup`]
    },
    {
      title: `${company.name} reported positive earning data`,
      description: `\`${company.name}\` reported a double beat on earnings with a 10% surprise on revenue and a 15% surprise on earnings. During the earnings call, management provides strong guidance for the next few quarters citing an impressive growth in a new product line. Shares rise sharply on the good news.`,
      icon: 'Stocks',
      meta: `+15% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: .15
      },
      conflicts: [`${company.name} reported a miss in earnings`]
    },
    {
      title: `${company.name} announces share buybacks`,
      description: `\`${company.name}\` announced during the last earnings call that over $200M has been set aside for share buybacks. The board of directors and senior leadership of the company decided that this would be a nice way to excess earnings back to shareholders. The stock jumps as the company starts buying back shares.`,
      icon: 'Stocks',
      meta: `+10% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: .10
      }
    },
    {
      title: `${company.name} is hiring in new leadership`,
      description: `PR Newswire breaks the news that \`${company.name}\` is tapping a senior VP from Alphabet to join their ranks as chief marketing officer. The new CMO is tasked to transform how the brand and product appeals to new customers as the company as the company is trying to shrug what seems like a dated and incumbent brand. Shares pop on the optimism.`,
      icon: 'Stocks',
      meta: `+5% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: .05
      }
    },
    {
      title: `${company.name} reported a miss in earnings`,
      description: `\`${company.name}\` reported a double miss on earnings with a 13% miss on revenue and a 17% miss on earnings. During the earnings call, management explained that the competitive environment against a new startup is a big reason to blame. The management team continues to provide  weak guidance for the next few quarters. Shares plummet further during the call.`,
      icon: 'Stocks',
      meta: `-20% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: -.2
      },
      conflicts: [`${company.name} reported positive earning data`]
    },
    {
      title: `${company.name} is fined`,
      description: `French and Spanish regulatory bodies have fined \`${company.name}\` Company for lack of compliance around GDPR regulations and the safe storage and disposal of private information. Current fines are being pursued as 4% of the annual revenues. It’s currently unclear if any other EU countries will follow suit. The pending costs to settle sends the stock price in a nosedive.`,
      icon: 'Stocks',
      meta: `-15% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: -.15
      }
    },
    {
      title: `${company.name} acquires a startup`,
      description: `TechCrunch just broke the news that \`${company.name}\` has put in a $1B offer to acquire Startuply. The deal is pending review and has been confirmed by representatives from both companies. The acquisition will be an all cash acquisition and \`${company.name}\` plans on investing in new revenue streams. Shares drop on the news.`,
      icon: 'Stocks',
      meta: `-10% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: -.1
      },
      conflicts: [`${company.name} is being acquired`]
    },
    {
      title: `${company.name} scandal is reported by global news`,
      description: `Through an internal whistleblower and current employee, \`${company.name}\` has been allegedly treating product returns from customers inconsistently in their financial accounting and reporting. The SEC is launching a probe and the company has yet to issue a public statement. Share prices drop on the news.`,
      icon: 'Stocks',
      meta: `-10% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: -.1
      }
    },
    {
      title: `${company.name} replaces executives`,
      description: `\`${company.name}\` announces their CEO is stepping down effective immediately and the current COO will be stepping in the interim until a good replacement is found. The former CEO had been with the company and was crucial for the transformative strategies in place for over the past two decades. Shares slide in trading.`,
      icon: 'Stocks',
      meta: `-8% ${company.ticker}`,
      frequency: 1 / 8,
      effects: {
        [company.ticker]: -.08
      }
    }
  ]
}



export const EvilCorpNews = [
  {
    title: 'Lower than expected earnings',
    description: 'EVILCorp reported that, while they hit their revenue target, their earnings were 15% lower than expected. During the earnings call, management explained that the competitive environment against a new startup is largely to blame. The management team continues to provide weak guidance for the next few quarters.',
    effects: {
      'EVIL': -.05
    },
    icon: 'Stocks',

    correct: [
      'Lower than expected earnings typically results in a decline in the stock price; however, the stock price increased this year because of favorable economic conditions. Mary and the investment club are impressed with your analysis!',

      'Despite the favorable economic conditions, the stock price fell this year because of the lower than expected earnings. Mary and the investment club are impressed with your analysis!',

      'The combination of unfavorable economic conditions and the lower than expected earnings means the stock price fell this year. Mary and the investment club are impressed with your analysis!'
    ],

    incorrect: [
      'Mary and the investment club disagree with your analysis. They suggest that lower than expected earnings typically results in a decline in the stock price; however, the stock price increased this year because of favorable economic conditions.',

      'Mary and the investment club disagree with your analysis. They suggest that despite the favorable economic conditions, the stock price fell this year because of the lower than expected earnings.',

      'Mary and the investment club disagree with your analysis. They suggest that the combination of unfavorable economic conditions and the lower than expected earnings means the stock price fell this year.'
    ]
  },

  {
    title: 'Company acquisition',
    description: 'TechCrunch just broke the news that EVILCorp has made a $500M offer to acquire M&P Financial Services. The deal is pending review and has been confirmed by representatives from both companies. The acquisition is expected to be an all cash transaction with EVILCorp taking over all M&P operations.',
    effects: {
      'EVIL': -.07
    },
    icon: 'Stocks',

    correct: [
      'Due to the premiums that are usually paid to acquire another company, an acquisition announcement like this typically results in a decline in the stock price; however, the stock price increased this year because of favorable economic conditions. Mary and the investment club are impressed with your analysis!',

      'Despite the favorable economic conditions, the stock price fell this year because of the acquisition announcement since there are usually  premiums that are paid to acquire another company. Mary and the investment club are impressed with your analysis!',

      'The combination of unfavorable economic conditions and the acquisition announcement means the stock price fell this year. Mary and the investment club are impressed with your analysis!'
    ],

    incorrect: [
      'Mary and the investment club disagree with your analysis. They suggest that, due to the premiums that are usually paid to acquire another company, an acquisition announcement like this typically results in a decline in the stock price; however, the stock price increased this year because of favorable economic conditions.',

      'Mary and the investment club disagree with your analysis. They suggest that, despite the favorable economic conditions, the stock price fell this year because of the acquisition announcement since there are usually  premiums that are paid to acquire another company.',

      'Mary and the investment club disagree with your analysis. The combination of unfavorable economic conditions and the acquisition announcement means the stock price fell this year. '
    ]
  },

  {
    title: 'Higher than expected earnings',
    description: 'EVILCorp reported a double beat on earnings with a 10% surprise on revenue and a 15% surprise on earnings. During the earnings call, management provided strong guidance for the next few quarters suggesting the impressive growth will continue. ',
    effects: {
      'EVIL': +.05
    },
    icon: 'Stocks',

    correct: [
      'The combination of favorable economic conditions and the higher than expected earnings means the stock price rose this year. Mary and the investment club are impressed with your analysis!',

      'Despite the unfavorable economic conditions, the stock price rose this year because of the higher than expected earnings. Mary and the investment club are impressed with your analysis!',

      'Higher than expected earnings typically results in an increase in the stock price; however, the stock price fell this year because of unfavorable economic conditions. Mary and the investment club are impressed with your analysis!'
    ],

    incorrect: [
      'Mary and the investment club disagree with your analysis. They suggest that the combination of favorable economic conditions and the higher than expected earnings means the stock price rose this year. ',

      'Mary and the investment club disagree with your analysis. They suggest that, despite the unfavorable economic conditions, the stock price rose this year because of the higher than expected earnings. ',

      'Mary and the investment club disagree with your analysis. They suggest that higher than expected earnings typically results in an increase in the stock price; however, the stock price fell this year because of unfavorable economic conditions. '
    ]
  },

  {
    title: 'Share buybacks',
    description: 'EVILCorp announced during the last earnings call that the board of directors has decided to use excess earnings to buy back shares. They confirmed $200M has been set aside for the share buybacks.',
    effects: {
      'EVIL': +.07
    },
    icon: 'Stocks',

    correct: [
      'The combination of favorable economic conditions and the share buybacks, typically a positive sign to investors, means the stock price rose this year. Mary and the investment club are impressed with your analysis!',

      'Despite the unfavorable economic conditions, the stock price rose this year because of the share buybacks since it is typically a positive sign to investors. Mary and the investment club are impressed with your analysis!',

      'Share buybacks are usually a positive sign to investors and typically result in an increase in the stock price; however, the stock price fell this year because of unfavorable economic conditions. Mary and the investment club are impressed with your analysis!'
    ],

    incorrect: [
      'Mary and the investment club disagree with your analysis. They suggest that the combination of favorable economic conditions and the share buybacks, typically a positive sign to investors, means the stock price rose this year. ',

      'Mary and the investment club disagree with your analysis. They suggest that despite the unfavorable economic conditions, the stock price rose this year because of the share buybacks since it is typically a positive sign to investors.',

      'Mary and the investment club disagree with your analysis. They suggest that share buybacks are usually a positive sign to investors and typically result in an increase in the stock price; however, the stock price fell this year because of unfavorable economic conditions.'
    ]
  },

  {
    title: 'Higher than expected customer acquisition',
    description: 'EVILCorp announced that funds from customers into its new product, Visionary Investment Fund, exceeded estimates by 30%. Management provided strong guidance for the next few quarters that this will continue.',
    effects: {
      'EVIL': +.05
    },
    icon: 'Stocks',

    correct: [
      'The combination of favorable economic conditions and the higher than expected customer acquisition means the stock price rose this year. Mary and the investment club are impressed with your analysis!',

      'Despite the unfavorable economic conditions, the stock price rose this year because of the higher than customer acquisition. Mary and the investment club are impressed with your analysis!',

      'Higher than customer acquisition typically results in an increase in the stock price; however, the stock price fell this year because of unfavorable economic conditions. Mary and the investment club are impressed with your analysis!'
    ],

    incorrect: [
      'Mary and the investment club disagree with your analysis. They suggest that the combination of favorable economic conditions and the higher than expected customer acquisition means the stock price rose this year.',

      'Mary and the investment club disagree with your analysis. They suggest that despite the unfavorable economic conditions, the stock price rose this year because of the higher than customer acquisition.',

      'Mary and the investment club disagree with your analysis. They suggest that higher than customer acquisition typically results in an increase in the stock price; however, the stock price fell this year because of unfavorable economic conditions.'
    ]
  }
]