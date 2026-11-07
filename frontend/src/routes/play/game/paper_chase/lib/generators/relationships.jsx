const people = {
  grandma: {
    name: 'Grandma',
    id: 'grandma',
    icon: '/assets/images/icons/781247.svg',
    firstAppearance: 1,
    threshold: () => 5,
    thoughts: ({turn}) => turn < 20 
      ? ['is busy at work', 'is worried about you', 'is proud of you', 'brags about you to everyone']
      : ['is dead', 'would be worried about you', 'would be proud of you', 'is smiling down on you'],
    
    evidence: {
      9: {
        icon: 'Misfortune',
        title: 'Threatening voicemail from Mr. Sinister',
        description: 'Grandma shares a voicemail from Mr. Sinister saying the family business must not be doing well without your parents. He cautions unexpected things happen to good people.'
      },
      16: {
        icon: 'Pages',
        title: 'Emails from your parents to an employee',
        description: 'The emails indicate your parents found out an employee had been embezzling money from Paper Chase Inc. but the name is blacked out.'
      },
      19: {
        icon: 'Pages',
        title: `Details from your parent's accident`,
        description: 'Grandma shares a photo of the first day your parents and Mr. Sinister opened the office, an email he sent on the day of the car accident cautioning my parents that unexpected things happen, and newspaper clippings of the reports.'
      },
      26: {
        icon: 'Pages',
        title: 'Falsified client Documents',
        description: `You're cleaning out Grandma's stuff when you find the falsified client documents your parents used to uncover the Ponzi scheme Mr. Sinister was running through Paper Chase Inc.`
      }
    }
  },
  mary: {
    name: 'Mary',
    id: 'mary',
    icon: '/assets/images/icons/economist.svg',
    firstAppearance: 3,
    changes: [0,0,0],
    threshold: ({turn}) => turn < 11 ? 2 : 3,
    thoughts: () => ['doesn\'t know you', 'is unimpressed by your performance', 'thinks you have potential', 'is impressed by you'],
    evidence: {
      10: {
        icon: 'Pages',
        title: `Letters of corporate bribery`,
        description: `Mary shares with you letters from EVILCorp that bribe investment club organizers.`
      },
      14: {
        icon: 'Pages',
        title: 'A scandalous folder',
        description: 'Mary shares with you a folder with reports of previous scandals that board members of EVILCorp have been associated with.'
      },
      24: {
        icon: 'finance',
        title: `Accounting irregularities`,
        description: `After digging though your research on EVILCorp, Mary finds questionable accounting practices with the acquisition of M&P Financial Services and the reported earnings afterwards.`
      }
    },
  },
  tomas: {
    name: 'Tomas',
    id: 'tomas',
    icon: '/assets/images/icons/tomas.svg',
    firstAppearance: 6,
    changes: [0,0,0],
    threshold: () => 2,
    thoughts: () => ['is in another town', 'feels like you two are drifting apart', 'is a good friend of yours', 'is your best friend'],
    evidence: {
      13: {
        icon: 'Pages',
        title: 'Predatory lending documents',
        description: `Tomas provides documents that could connect the predatory lending back to EVILCorp and Mr. Sinister'`
      },

      17: {
        icon: 'Career', 
        title: 'Tomas video recording',
        description: `Tomas was on his way to say hello to Grandma when he saw Mr. Sinister's men walk into Paper Chase Inc. He caught the whole thing on video!`
      },

      22: {
        icon: 'Pages',
        title: 'Private memo from Mr. Sinister',
        description: `Tomas leaves an envelope under your door. It's a private memo from Mr. Sinister suggesting he orchestrated the insider trading by blackmailing the insider who gave the tip to Tomas.`
      },

      25: {
        icon: 'Pages',
        title: 'Fake customer account documents',
        description: `Tomas provides evidence that EVILCorp has been creating fake customer accounts to launder money...but he doesn't know who the laundered money is for.`,
        // visited tomas
        condition: ({ choices: { visitedTomas } }) => visitedTomas
      },
    },
  },
}

export function Relationships({history = [], turn, consequences}, log) {
  return Object.keys(people).reduce((relationships, name) => {
    const person = people[name];
    const allConsequences = history.map((year) => year.consequences).concat(consequences).flat()
    const score = allConsequences.reduce((score, consequence) => {
      return (consequence.effects[name] || 0) + score;
    }, 0);
    const threshold = person.threshold({turn});
    const level = (() => {
      if (score <= -Math.ceil(threshold / 2)) {
        return 'bad'
      } else if (score >= threshold) {
        return 'good';
      }
      return 'neutral'
    })();
    const isKnown = person.firstAppearance <= turn;
    const thoughts = person.thoughts({ turn })
    const thought = (() => {
      if (!isKnown) {
        return thoughts[0]
      } else if (level == 'neutral') {
        return thoughts[2];
      } else if (level == 'bad') {
        return thoughts[1];
      } else {
        return thoughts[3];
      }
    })()
    relationships[name] = {
      ...person,
      score,
      level,
      thought,
      isKnown,
    }  

    return relationships
  }, {})
}

export function Evidence(state) {
  const {previous, relationships, turn} = state;
  return Object.values(relationships).reduce((evidence, relationship) => {
    if (relationship.evidence[turn] && (relationship.level == 'good' || relationship.evidence[turn].condition && relationship.evidence[turn].condition(state))) {
      return evidence.concat({
        turn,
        relationship: relationship,
        person: relationship.id,
        ...relationship.evidence[turn]
      });
    }
    return evidence;
  }, previous.evidence || [])
}