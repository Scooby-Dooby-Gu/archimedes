import update from "immutability-helper";
import * as MATH from '/lib/math';
import * as formatters from '/lib/formatters';
import { actions } from "../actions/stocks";
import { isLessonComplete, getLessonById, getSkills } from "/lib/data";
import { tomasQuestions } from './choices';

export default [
  // grandma challenge
  {
    type: 'opinion',
    person: 'grandma',

    condition: ({ turn, activeChallenges: { grandma }  }, actions, consequence) => {
      if (turn === 2) {
        if (grandma) {
          return update(consequence, {
            $merge: {
              icon: 'Approve',
              level: 'good',
              effects: {
                grandma: +1
              },
              description: `Happy you accepted her offer`,
            }
          })
        } else {
          return update(consequence, {
            $merge: {
              icon: 'Disapprove',
              level: 'bad',
              effects: {
                grandma: -1
              },
              description: `Sad you didn't accept her offer.`,
            }
          })
        }
      }
    }
  },
  {
    type: 'opinion',
    kind: 'grandma',
    challenge: 'leverage',
    person: 'grandma',
    condition: ({ age, activeChallenges: { leverage } }, actions, consequence) => {
      if (!leverage)
        return;
      if (leverage.succeeding) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            description: `Pleased to see your debt under control.`,
            effects: {
              grandma: 1
            },
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            description: `Worried you have too much debt.`,
            effects: {
              grandma: -1
            },
          }
        })
      }
    }
  },
  {
    type: 'opinion',
    person: 'mary',
    condition: ({ year, activeChallenges: { homework } }, actions, consequence) => {
      if (!homework )
        return;

      if (homework.succeeding) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            description: `Happy you completed the lesson!`,
            effects: {
              mary: 1
            },
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            description: `Sad you didn't complete the lesson.`,
            effects: {
              mary: -1
            },
          }
        })
      }
    }
  },
  {
    type: 'opinion',
    person: 'mary',
    condition: ({ activeChallenges: { economist }, turn }, actions, consequence, data) => {
      if (!economist || !economist.justFinished) return;
      if (economist.passed) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            description: `Happy to see you've made it to the next level!`,
            effects: {
              mary: 1
            },
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            description: `Disappointed you didn't level up.`,
            effects: {
              mary: -1
            },
          }
        })
      }
    }
  },
  {
    person: 'grandma',
    challenge: 'grandma',
    condition: ({activeChallenges: { grandma }}, actions, consequence) => {
      if (!grandma || !grandma.justFinished) return;

      if (grandma.passed) {
        return update(consequence, {
          $merge: {
            icon: 'Approve',
            level: 'good',
            //achievement: 'game_happy_grandma',
            effects: {
              grandma: +1,
              cash: 10000
            },
            description: `Happy you won the challenge!`
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            icon: 'Disapprove',
            level: 'bad',
            effects: {
              grandma: -1
            },
            description: `Disappointed you didn't win the challenge.`
          }
        })
      }
    }
  },
  {
    person: 'grandma',
    condition: ({turn, year, activeChallenges: { dividend }, choices: { paidGrandmaOff }}, actions, consequence) => {
      if (turn !== 10) return; 
      const help = dividend || paidGrandmaOff
      if (help && help.year == year - 1) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              grandma: 1
            },
            description: 'Appreciates you helping her out.',
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              grandma: 0
            },
            description: 'Asks you to help her out next time.',
          }
        })
        
      }
    }
  },
  {
    person: 'grandma',
    condition: ({turn, year, activeChallenges: { dividend }}, actions, consequence) => {
      if (!dividend || !dividend.passed) return; 
      return update(consequence, {
        $merge: {
          level: 'good',
          icon: 'Approve',
          effects: {
            grandma: 1
          },
          description: 'Proud you used investing skills to help her!',
        }
      })
    }
  },
  {
    person: 'tomas',
    condition: ({turn, year, choices: { acceptedTomasLoan }}, actions, consequence) => {
      if (turn !== 11) return; 
      if (acceptedTomasLoan) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1
            },
            description: 'Excited that you accepted his help!',
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            },
            description: `Sad you didn't take his help.`,
          }
        })
        
      }
    }
  },

  {
    person: 'mary',
    condition: ({turn, year, choices: { hiredTaxAdvisor }}, actions, consequence) => {
      if (hiredTaxAdvisor && hiredTaxAdvisor.year == year - 1) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              mary: 1
            },
            description: `Glad you decided to hire John!`,
          }
        })
      } else if (turn === 12) {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              mary: -1
            },
            description: `Disappointed you didn't go with professional help.`,
          }
        })
        
      }
    }
  },
  {
    person: 'mary',
    condition: ({turn, year, activeChallenges: { tax } }, actions, consequence) => {
      if (!tax)
        return;

      if (tax.succeeding) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              mary: 1
            },
            description: `Pleased you're managing your taxes well.`,
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              mary: -1
            },
            description: `Concerned by your tax cability this year`,
          }
        })
        
      }
    }
  },
  {
    person: 'grandma',
    condition: ({activeChallenges, year, previous}, actions, consequence) => {
      if (!activeChallenges['return']) return;

      if (activeChallenges['return'].succeeding) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              grandma: 1
            },
            description: `Would be proud of your success.`
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              grandma: -1
            },
            description: `Would want you to persevere.`,
          }
        })
        
      }
    }
  },
  {

    person: 'mary',

    condition: ({ activeChallenges: { news }, year}, actions, consequence) => {
      if (!news) return;
      if (news.succeeding) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              mary: 1
            },
            description: `Appreciates your insight.`
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              mary: -1
            },
            description: `Dissatisfied with your answer.`,
          }
        })
      }
    }
  },
  {
    effects: {},

    condition: ({ previous, activeChallenges: { news }, choices: { newsPredictions }, year }, actions, consequence) => {

      if (!news) return;
      const ticker = previous.companies.find((company) => company.ticker === 'EVIL');
      const event = ticker.events[0];
      const prediction = newsPredictions.find((p) => p.year == year - 1)
      if (!prediction) return false;
      
      if (ticker.price >= ticker.previousPrice && previous.marketMovement >= 0) {
        var reasoningIndex = 0
      } else if (ticker.price >= ticker.previousPrice && previous.marketMovement <= 0) {
        var reasoningIndex = 1
      } else {
        var reasoningIndex = 2;
      }
      if (prediction.direction == 'up') {
        if (ticker.price >= ticker.previousPrice) {
          return update(consequence, {
            $merge: {
              icon: "Checkmark",
              title: 'Correctly predicted EVILCorp price rising',
              level: 'good',
              description: event.correct[reasoningIndex]
            }
          })
        } else {
          return update(consequence, {
            $merge: {
              icon: "Close",
              title: 'Incorrectly predicted EVILCorp price rising',
              level: 'bad',
              description: event.incorrect[reasoningIndex]
            }
          })
        }
      } else {
        if (ticker.price < ticker.previousPrice) {
          return update(consequence, {
            $merge: {
              icon: "Checkmark",
              title: 'Correctly predicted EVILCorp price falling',
              level: 'good',
              description: event.correct[reasoningIndex]
            }
          })
        } else {
          return update(consequence, {
            $merge: {
              icon: "Close",
              title: 'Incorrectly predicted EVILCorp price falling',
              level: 'bad',
              description: event.incorrect[reasoningIndex]
            }
          })
        }
      }

    }
  },
  {
    person: 'tomas',
    condition: ({houses, turn}, actions, consequence) => {
      if (turn != 13) return;
      if (houses.length) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1
            },
            description: `Impressed that you're able to buy property!`,
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            },
            description: `Hoped you'd invest in property.`,
          }
        })
        
      }
    }
  },
  {
    person: 'tomas',
    condition: ({houses, turn, activeChallenges: { property }}, actions, consequence) => {
      if (turn != 15) return;
      if (houses.find((h) => h.kind == 'holiday')) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1
            },
            description: `Sharing this property makes your friendship stronger.`,
          }
        })
      } else if (!property) {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            },
            description: `You've missed out on something great.`,
          }
        })
        
      }
    }
  },
  
  {
    person: 'grandma',
    condition: ({houses, turn, year, residence}, actions, consequence) => {
      if (turn != 18 && turn != 19) return;

      if (actions.find((a) => a.title == 'Made Grandma a roommate')) {
        if (residence) {
          if (turn == 19) return;
          return update(consequence, {
            $merge: {
              level: 'good',
              icon: 'Approve',
              effects: {
                grandma: 1
              },
              description: `Happy and safe living with you.`
            }
          })
        } else {
          return update(consequence, {
            $merge: {
              level: 'bad',
              icon: 'Disapprove',
              effects: {
                grandma: -1
              },
              description: `Uncomfortable in the cramped apartment.`,
            }
          })
        }
      } else {
        if (turn == 19) return;
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              grandma: -1
            },
            description: `Wishes she saw you more.`,
          }
        })
      }
    }
  },
  {
    person: 'tomas',
    condition: ({turn, choices: { acceptedTomasScam }}, actions, consequence) => {
      if (turn !== 21) return; 
      if (acceptedTomasScam) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1,
              fine: 150000
            },
            description: 'Excited to be investing with you.',
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            },
            description: 'Bummed you passed on a once in a lifetime opportunity!',
          }
        })
        
      }
    }
  },
  {
    person: 'tomas',
    condition: ({year, activeChallenges: { teachingTomas }, choices: { tomasAnswers }}, actions, consequence) => {
      if (!teachingTomas) return; 
      const answer = tomasAnswers.find((p) => year == p.year + 1);
      if (!answer) return;
      
      if (answer && answer.correct) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1,
            },
            description: 'Grateful for your help!',
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            },
            description: 'Skeptical of your advice.',
          }
        })
        
      }
    }
  },
  {
    effects: {},
    condition: ({year, activeChallenges: { teachingTomas }, choices: { tomasAnswers }}, actions, consequence) => {
      if (!teachingTomas) return; 
      const answer = tomasAnswers.find((p) => year == p.year + 1);
      if (!answer) return;
      const question = tomasQuestions[answer.index]
      if (answer && answer.correct) {
        return update(consequence, {
          $merge: {
            title: 'Correctly answered Tomas\'s question',
            level: 'good',
            icon: 'Checkmark',
            description: question.correct,
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            title: 'Incorrectly answered Tomas\'s question',
            level: 'bad',
            icon: 'Close',
            description: question.incorrect,
          }
        })
        
      }
    }
  },
  {
    person: 'tomas',
    condition: ({ choices: { visitedTomas }, turn, }, actions, consequence) => {
      if (turn != 23) return;
      if (visitedTomas) {
        return update(consequence, {
          $merge: {
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1
            },
            description: `Happy to see you.`,
          }
        })
      } else {
        return update(consequence, {
          $merge: {
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            },
            description: `Disappointed you abandoned him.`,
          }
        })
        
      }
    }
  },
  {
    title: `Your former startup IPOs!`,
    icon: 'Stocks',
    effects: {},
    level: 'great',
    condition: ({year, previous, seed, job}, actions, consequence) => {
      const exercise = actions.find((action) => action.type == 'exercise' && action.year + 5 == year);
      if (exercise) {
        const random = MATH.seed(seed + year * 197);
        if (random() < exercise.chance) {
          return update(consequence, {
            $merge: {
              title: job.id === exercise.id ? 'Your startup IPOs!' : 'Your former startup IPOs!',
              effects: {
                longTermCapitalGain: exercise.price * 200
              },
              meta: `+${formatters.currency(exercise.price * 200)}`,
              description: `All of our hard work *finally* paid off and I can’t be more excited for everyone! I am glad I exercised my shares because I was able to cash in for \`${formatters.currency(exercise.price * 200)}\` after lockups expire.`
            }
          })
        }
      }
      return;
    }
  },
  {
    icon: 'Property',
    challenge: 'property',
    person: 'tomas',
    level: 'neutral',
    effects: {},
    condition: ({activeChallenges: { property }}, actions, consequence) => {
      if (!property || !property.justFinished) return;
      if (!property.passed) {

        return update(consequence, {
          $merge: {
            description: `Will never let you forget you lost!`,
            level: 'bad',
            icon: 'Disapprove',
            effects: {
              tomas: -1
            }
          }
        })
      } else {

        return update(consequence, {
          $merge: {
            description: `Enjoyed your friendly wager!`,
            level: 'good',
            icon: 'Approve',
            effects: {
              tomas: 1
            }
          }
        })
      }
    }
  },
]