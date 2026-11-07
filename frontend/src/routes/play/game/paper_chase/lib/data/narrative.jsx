
import * as formatters from '/lib/formatters';

export default {
  "-1": {
    scene: {
      name: 'Cafe-Start', 
      actors: ['grandma'], 
      timelines: {
        grandma: ['Sitting'] 
      }
    },
    title: 'One for the money, two for the show...',
    isFinishing: true,
    description: `Your parents recently passed away in a car accident a month before your 18th birthday. 
    
    Your grandmother is left running Paper Chase Inc, the family financial services business. She isn't involving you with any of it just like your parents didn't growing up.`,
  },

  0: {
    scene: { name: 'Park', actors: ['grandma'], clips: {
      grandma: [false, 'Sitting.Clapping']
    } },
    title: 'Taking the first step',
    description: `You're finishing high school soon. Grandma reminds you that you write your own story. Starting now, your decisions have consequences that will shape your narrative, affect your relationships with friends and family, and determine whether you'll overcome life's challenges.`,
  },

  1: {
    scene: { name: 'Park', actors: ['grandma'], clips: {
      character: [false, 'Sitting.Asking']
    }  },
    title: 'The future talk',
    description: ({study}) => `${study ? `Grandma's face lights up when you give her a college sweater from the campus bookstore!`
                            : `Grandma's face lights up when you give her her favorite burger from the Burger Czar!`}

                            You're still processing the loss of your parents but Grandma reminds you that she loves you and is always looking out for you. She wants the best for your future so she wants to get you started with long term investing.`,
  },

  2: {
    scene: { name: 'Exchange-Invite', actors: ['mary'] },
    title: 'Join the club',
    description: ({scores}) => `Mary, a family friend, offers her condolences for the loss of your parents. 

    Grandma told Mary about the offer she made you and that you opened an investment account.

    
    
    ${scores.grandma != null ? `Mary wants to help you win Grandma's Challenge by connecting you with her investment club. `
                            : `Mary wants to help you feel comfortable to start investing by connecting you with her investment club.`}`,
  },

  3: {
    title: `Grandma's check-in`,
    scene: { name: 'Hotdogs', actors: ['grandma'], clips: {
      grandma: ['Standing.Sad', 'Standing.Sad'],
 //     character: [false, 'Standing.Agreeing/Upper']
    }  },
    description: ({ personalPortfolio }) =>  `Grandma is happy to see you're doing better. You notice she is looking tired. When she sees a concerned look form on your face, she quickly dismisses it as work being busy. 

    She pivots the conversation to how your investments are doing. You tell her that your return is ${formatters.currency(personalPortfolio.reduce((s, h) => s + h.potentialProfit, 0))} over the last two years. `,
  },

  4: {
    scene: { name: 'Park', actors: ['grandma']},
    title: `Grandma's got this`,
    description: `You are catching up with Grandma again and she's proud of how well you're doing.

    You ask if she needs help running Paper Chase Inc. In her usual loving way, she smiles and tells you to focus on achieving your goals. "Don't worry, Grandma's got this."`,
  },

  5: {
    title: 'An old friend returns',
    scene: { name: 'Cafe', actors: ['tomas'], clips: {
      tomas: ['Sitting.Laughing', 'Sitting.Laughing'],
      character: ['Sitting.Clapping', 'Sitting.Clapping'],
    } },
    description: ({study, education}) => {
      if (!education) {
        return `You receive good news from a childhood friend, Tomas. He moved back to the city!

        The two of you catch up, recalling good times before he moved away in high school when his dad's job relocated to another city. You're glad to have another friend back in your life.
        
        You tell him you're now the manager at the Burger Czar! He jokes about finally getting free burgers. 
        
        Tomas is excited about a few interviews he has lined up. He admits it has been a struggle to find and hold onto a good job.`
      } else if (!study) {
        return `You receive good news from a childhood friend, Tomas. He moved back to the city!

        The two of you catch up, recalling good times before he moved away in high school when his dad's job relocated to another city. You're glad to have another friend back in your life.
        
        You laugh at each other while sharing epic, but embarrassing, college stories. The conversation turns into how you're growing up with a full-time job. 
        
        Tomas is excited about a few interviews he has lined up. He admits it has been a struggle to find and hold onto a good job.`
      } else {
        return `You receive good news from a childhood friend, Tomas. He moved back to the city!

        The two of you catch up, recalling good times before he moved away in high school when his dad's job relocated to another city. You're glad to have another friend back in your life.
        
        You laugh at each other while sharing epic, but embarrassing, college stories. The conversation turns into how you are working on your PhD. 
        
        Tomas is excited about a few interviews he has lined up. He admits it has been a struggle to find and hold onto a good job.`
      }
    }
  },

  6: {
    title: 'Catching up with Mary',
    scene: { name: 'Exchange-Invite', actors: ['mary'], clips: {
      character: ['Standing.Agreeing', 'Standing.Agreeing'],
      mary: ['Standing.Talking', 'Standing.Talking']
    } },
    description: `Mary let it slip that she heard from Grandma that Paper Chase Inc. is hitting a rough patch. Grandma still won't let you help out at the office.

    Mary suggests that you could work on building your investments in the meantime so that you'll be ready to help out financially if she ever needs it.
    `
  },

  7: {
    title: 'The perks of club membership',
    scene: { name: 'Exchange-Club', actors: ['mary'] },
    description: `When catching up with Mary, you thank her for suggesting sectors and stocks.
    
    She's glad and reminds you that joining the investment club was what had helped her. She said that reading more of the club research led to more insights about the different economic news.
    `
  },

  8: {
    scene: { name: 'Park-Bench', actors: ['grandma'] },
    title: 'Things are starting to look Sinister',
    description: `You meet grandma and she seems more stressed than ever. The family business isn't doing well and Grandma keeps muttering something under her breath about Mr. Sinister. When you ask her who Mr. Sinister is, she only reveals that he is head of EVILCorp.`
  },

  9: {
    scene: { name: 'Hotdogs', actors: ['tomas'], clips: {
      tomas: ['Standing.Clapping', 'Standing.Clapping'],
      character: ['Standing.Jumping', 'Standing.Jumping']
    } },
    title: 'Party like it\'s 1999!',
    description: ({education}) => `
      ${education && education.tier == 'grad' 
      ? `You and Tomas are catching up when he congratulates you on completing your PhD! `
      : `You and Tomas are catching up when he congratulates you on your promotion!`}
      He asks if you've decided on a job yet. You tell him that you're meeting with a recruiter after! 

      You ask him how work is going. Not wanting to take attention away from your day, he keeps his answer short. His dad helped get him a job. He said it pays well if he keeps his head down and does what's asked of him.`
  },

  10: {
    scene: { name: 'Park-Decisions-2', actors: [false], clips: {
      character: ['Standing.Disappointed']
    } },
    title: `Grandma's accident`,
    description: ({choices: { paidOffGrandma }, scores, previous}) => {
      const hasHelped = previous.consequences.some((c) => c.kind == 'support')
      return  (scores.dividends != null 
        ? `Grandma is grateful for your generosity to help out with her bills and is especially proud that you decided to try using income from your investments.`
        : paidOffGrandma ? `Grandma is grateful for your generosity to help out with her bills.` : '')
        + `
        
        That winter, Grandma has a nasty fall when she slipped stepping off the curb on her way to work. Grandma says it's just a scratch and she's fine. When you take her to the hospital, it turns out she has several fractured bones. Despite health insurance, there is still a hefty $20K medical bill. `
    }
  },

  11: {
    scene: { name: 'Finance-Visit', actors: ['taxAdvisor', 'mary'] },
    title: `Much needed tax-advice`,

    
    description: ({scores, previous}) => {
      return  `At the investment club meeting, Mary asks if you are aware of how much you pay in taxes. 

      You tell her that you haven't been keeping track so she connects you with John, a tax advisor.
      
      She says that the average effective tax rate is about 35% and that, if we can, aim to be below that.`
    }
  },

  12: {
    // do something else
    scene: { name: 'Home-Roof', actors: ['tomas'], clips: {
      character: ['Sitting.Idle'],
      tomas: ['Sitting.Talking', 'Sitting.Talking']
    } },
    title: `Real estate advice`,
    
    description: ({ choices: { acceptedTomasLoan }}) => {
      return  acceptedTomasLoan
         ? `You look back through the terms of the loan you took from Tomas' acquaintance. It turns out he expects 20% interest each year for 7 years. Tomas apologizes for setting you up with that lender.  He just really wanted to help!
        
           When you comment on his nice clothes and flashy watch, he brushes it off as work perks.`
        : `You and Tomas are catching up over coffee when you comment on his nice clothes and flashy watch. He brushes it off as work perks.`
    }
  },

  13: {
    scene: { name: ({residence}) => residence ? 'Home-Work' : 'Dorm-Work' },
    title: `Looking into EVILCorp`,

    
    description: ({loans}) => {
      return  `One night, you see a commercial for EVILCorp showing all of the community service that they do. That's when you remember the time when your Grandma snapped at you a few years back.

      Mary knows a lot about the financial industry. You wonder if Mary knows anything about EVILCorp.`
    }
  },

  14: {
    scene: { name: 'Cafe', actors: ['tomas']},
    title: `What's up with Tomas?`,

    description: () => `You and Tomas are grabbing lunch when you tell Tomas that you've started following EVILCorp stock for the investment club. Suddenly anxious, Tomas asks for what you know.
    
    You look at him puzzled and tell him that you don't know much. He quickly changes the subject.`
  },

  15: {
    scene: { 
      name: ({residence}) => residence ? 'Home-Rest' : 'Dorm-Rest', 
      actors: ['grandma', 'character'], clips: {
      grandma: ['Standing.Talking']
    } },

    title: 'You learn the family business',

    description: () => `Grandma says she can't involve you with Paper Chase Inc. yet. Frustrated, you pressure Grandma to find out why.

    She keeps you out to protect you from some very unpleasant people.
    
    She admits she's been grooming your investment skills this whole time for the day when you can hopefully take over.`
  },

  16: {
    // Fixme: Talkin on the phone
    scene: { name: 'University-Study', actors: [false, 'character'], clips: {
      character: ['Standing.Calling', 'Standing.Calling']
    }},

    title: 'Mr. Sinister men',

    description: () => `Grandma calls you. She sounds scared. Mr. Sinister's men showed up at the office today trying to intimidate her.

    You tell her to stay home and that you'll be running things for her from now on.`
  },

  17: {
    scene: { name: 'Park-Bench', actors: ['grandma']},

    title: `Taking care of Grandma`,

    description: () => `Grandma is still a bit shook after the situation with Mr. Sinister's men. She get's startled easier and feels her age is really catching up to her. 

    You reassure Grandma that you'll take care of her.`
  },

  18: {
    scene: { name: 'Cafe', actors: ['grandma'] },

    title: 'Parentage reveal',

    description: () => `Grandma reveals that your folks had started Paper Chase Inc. with Mr. Sinister.
 
    When your parents discovered the Ponzi scheme he was running through their business, they made a deal. In exchange for their silence, your parents bought his stake in the company and he would leave. 
    
    It was a fragile agreement. Mr. Sinister didn't trust your parents to keep quiet but your parents knew exposing him would ruin their careers as well as your future.
    
    You suspect Mr. Sinister staged your parent's car accident.`
  },

  19: {
    scene: { name: ({residence}) => residence ? 'Home-Rest' : 'Dorm-Rest', actors: [false], clips: {
      character: ['Standing.Disappointed']
    } },

    title: 'Grandma passes away',

    meta: `1M of assets and +$40K/yr additional income ***but you can't sell it or anything***`,

    description: () => `Feeling nothing but pride and joy about the financially independent and sound investor that you've become, she slips peacefully into an unwakeable sleep
    
    The business has been left to you. `
  },

  20: {
    scene: { name: 'Park-Bench', actors: ['tomas']},

    title: 'Empathy from a friend',

    description: () => `Tomas empathizes with the recent loss of Grandma and offers his condolences. She had always been loving and caring toward him as well. `
  },

  21: { 
    scene: { name: 'Park-Bench', actors: ['tomas']},

    title: 'Tomas and EVILCorp',

    description: ({ choices: { acceptedTomasScam } }) => {
      

      return `Tomas is arrested on charges for insider trading on EVILCorp stock! He is found guilty and, due to the depth of his involvement, he is sentenced to 3 years in prison. In the fallout of an investigation by the SEC, you find out Tomas had been working for EVILCorp this whole time and you suspect that he was set up to be a fall guy by Mr. Sinister!!

      ${acceptedTomasScam ? 'You are also investigated by the SEC. As a participant, you are fined $150K.' : '' }`;
    }
    
  },

  22: {
    //Courthouse
    scene: { name: 'Bank-Visit', actors: ['character', false, false], clips: {
      character: ['Standing.Despair']
    } },

    title: 'Losing the family business',

    meta: `-$1M in assets and -$40K taxable income`,

    description: ({ choices: { acceptedTomasScam } }) => 
    acceptedTomasScam ? `Mr. Sinister uses your involvement in the insider trading case as leverage to go after you and take the family business. He has his lawyers pull some legal shenanigans and you lose the business to him!`
                 : `Even though you weren't involved in the insider trading scandal, Mr. Sinister uses your friendship with Tomas as leverage to go after you and take the family business. He has his lawyers pull some legal shenanigans and you lose the business to him!`
  },

  23: {
    scene: { name: 'Park-Bench', actors: ['mary', 'character'], clips: {
      mary: ['Sitting.Talking', 'Sitting.Talking'],
      character: ['Sitting.Idle', 'Sitting.Idle']
    }},

    title: 'No where to turn',

    description: () => `Emotional and not having anywhere to turn, you reach out to Mary.

    She reminds you what you learned about investing; you need time, patience, discipline, an ability to take losses, and face adversity without going crazy.`
  },

  24: {

    // Courthouse
    scene: { name: 'Park-Bench', actors: ['tomas'] },

    title: 'Tomas is redeemed',

    description: ({relationships: { tomas }, choices: { visitedTomas } }) => visitedTomas
    ? `You meet with Tomas when he is released from prison, and he wants to make amends. He's grateful that you visited him in prison.
    
    He shares some vital information about Mr. Sinister and EVILCorp that he learned while in prison.`
    : ` You meet with Tomas when he is released from prison, and he wants to make amends. When he asks why you didn't visit him, you tell him about the anonymous letter.
    
    ` + (tomas.level === 'good' ? `Despite his disappointment, he shares some vital information about Mr. Sinister and EVILCorp that he learned while in prison.`
                 : `He's extremely disappointed. You can tell there was something he was about to tell you but changed his mind and decided not to.`)
  },

  25: {
    scene: { name: ({residence}) => residence ? 'Home-Work' : 'Dorm-Work', actors: [false] },

    title: 'The Comeback',

    description: () => `Even though Tomas is back, you still feel like the rock hitting bottom. Grandma is gone. Tomas was framed. Worst of all, Mr. Sinister finally has your family business.
    
    Despite the setbacks, you've made it too far to stop now. You prepare all the evidence you've collected against Mr. Sinister. `
  },

  26: {
    title: 'Is this the end of EVILCorp?',

    scene: { name: 'Corporation-Meeting', actors: ['sinister', 'character'] },
 //   scene: { name: 'Evilcorp', actors: ['sinister'] },

    description: () => `You confront Mr. Sinister in person. Unintimidated, you tell him that you know about his past and what really happened to your parents. You promise him that you are going to use everything at your disposal to stop him and secure your family's legacy.`
  },


  27: {
    title: 'The verdict',

    scene: { name: 'University-Study', actors: ['sinister'], clips: {
      character: ({ choices }) => [!choices.defeatedBoss ? 'Standing.Despair' : 'Standing.Laughing'],
      sinister: ({ choices }) => [choices.defeatedBoss ? 'Standing.Despair' : 'Standing.Laughing']
    } },
    //scene: { name: 'Courthouse', actors: ['sinister'] },

    description: ({ choices }) => choices.defeatedBoss ? 
      `After a long journey you feel the incredible joy of success. Congratulations, you collected enough evidence for a conviction and Mr. Sinister is now behind bars!`
      : `You finally went after Mr. Sinister for everything: the death of your parents, threatening your Grandma, corrupting your friend. Unfortunately, you didn't have enough evidence for a conviction. Mr. Sinister walks. `
  },

  28: {
    title: "Reclaiming legacy",

    scene: { name: 'Corporation-Meeting', actors: [{name: 'woman', model: 'BusinessWoman', skin: 2, palette: 2}], clips: {
      character: ['Standing.Talking'],
      woman: ['Standing.Agreeing']
    } },
    //scene: { name: 'Courthouse', actors: ['mary'] },

    description: ({ choices }) => !choices.defeatedBoss ? 
      `Even though you failed to take him down, you know that he's ultimately a business man. So you decide to see if he would be willing to sell you the business back.`
      : `With Mr. Sinister behind bars and EVILCorp is crumbling without his leadership and they are selling off assets. You decide to reach out to see if they are interested in making a deal.`
  },

  29: {
    title: 'Your new legacy',

    scene: ({choices}) => choices.boughtBackBusiness ? {
      name: 'Exchange-Success',
      actors: ['mary', 'tomas', false ]
    } : {
      name: 'Exchange-Success',
      actors: [false, false, false ],
      clips: {
        character: ['Standing.Disappointed']
      }
    },

    description: ({choices}) => choices.boughtBackBusiness
      ? `You have Mary put together an all-star team from the investment club to run things
      You offer Tomas a job at the company to help him get back on his feet.
      Your family's legacy is preserved and it feels like a "family" business again`
      
      : ` You feel a painful sting in your heart and the weight of crushing disappointment on your shoulders. All of your choices led to this point. 

      With your family's legacy out of reach, you try to move on.`
  },

  30: {
    title: 'Time to reflect',

    description: ({choices}) => choices.defeatedBoss
      ? `You feel a sense of relief having avenged your parents. The city is looking a little brighter today. Grandma would be proud.`
      
      : `You did your best to stop Mr. Sinister and EVILCorp with what you had. In the end, it wasn't enough. You can't help but wonder if you could have done things differently.`
  },

  31: {
    title: 'Moving forward',
    scene: { name: 'Cafe-Start', actors: ['tomas'] },

    description: `You take a moment to acknowledge the end of one chapter and the beginning of another. 

    Thanks to the investing skills you've learned from Grandma, Mary, and Tomas, you're confident that you have the financial freedom to enjoy the rest of your life, whatever that might look like.`
  }
}