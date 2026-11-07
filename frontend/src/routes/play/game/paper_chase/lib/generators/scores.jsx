import { getLessonById, findSubmission } from "/lib/data";

export function Scores(state, actions, previous, data) {
  const { year, scores } = state;
  const challengesTaken = actions.filter((action) => action.type === 'challenge');

  return challengesTaken.reduce((newScores, challenge) => {
    if (challenge.year + challenge.years > year) {
      const score = getChallengeScore(challenge, state, data);
      if (score != null) {
        newScores[challenge.kind] = score;
      }
    } else if (newScores[challenge.kind] != null) {
      if (!getChallengeQualification(challenge, newScores[challenge.kind])) {
        delete newScores[challenge.kind];
      }
    }
    return newScores
  }, { 
    ...scores,
    achievements: state.achievements.filter((a) => a.includes('game_')).length,
    evidence: state.evidence.length,
    total: state.networth
  })
} 

export function Challenges({ year }, actions) {
  return actions.filter((a) => a.type == 'challenge')
    .reduce((challenges, challenge) => {
      return {
        ...challenges, 
        [challenge.kind]: {
          ...challenge,
          ongoing:      challenge.year < year && challenge.year + challenge.years - 1 <= year,
          justStarted:  challenge.year == year,
          justFinished: challenge.year + challenge.years - 1 == year,
          finished:     challenge.year + challenge.years - 1 <= year,
          active:       challenge.year + challenge.years > year,
        }, 
      };
    }, {})
}

export function computeYearlySuccess(challenge, state, callback) {
  var yearState = state;
  var yearsOfSuccess = 0;
  for (var i = 0; i < challenge.years; i++) {
    if (callback(yearState)) {
      yearsOfSuccess++;
    }
    yearState = yearState.previous;
    if (yearState.year < challenge.year) break;
  }
  return yearsOfSuccess;
}

export function computeYearlyTotal(challenge, state, callback) {
  var yearState = state;
  var value = 0;
  for (var i = 0; i < challenge.years; i++) {
    value += callback(yearState);
    yearState = yearState.previous;
    if (yearState.year < challenge.year) break;
  }
  return value;
}


export function getChallengeScore(challenge, state, data) {
  switch (challenge.kind) {
    case 'grandma':
      return state.personalPortfolio.reduce((s, h) => s + h.potentialProfit, 0);

    case 'return':
      return computeYearlySuccess(challenge, state, (yearState) => {
        return yearState.brokeragePortfolio[0] ? yearState.brokeragePortfolio[0].totalReturn >= 0.1 : false
      })
  
    case 'tax':
      return computeYearlySuccess(challenge, state, (yearState) => {
        return (yearState.taxes.state + yearState.taxes.federal + yearState.taxes.socialSecurity) / yearState.income < 0.35
      })
    
    case 'leverage':
      return computeYearlySuccess(challenge, state, (yearState) => {
        return yearState.loans.reduce((payment, loan) => payment + loan.yearlyPayment, 0) / yearState.income < 0.35
      })
    case 'dividend':
      return computeYearlyTotal(challenge, state, (yearState) => {
        return yearState.dividends;
      })

    case 'news':
      return computeYearlySuccess(challenge, state, (yearState) => {
        const prediction = yearState.choices.newsPredictions.find((p) => yearState.year == p.year);
        const ticker = yearState.companies.find((company) => company.ticker == 'EVIL');
        return (prediction && ((prediction.direction === 'up') ^ (ticker.price < ticker.previousPrice)));
      })

    case 'property':
      return computeYearlyTotal(challenge, state, (yearState) => {
        return yearState.dividends;
      });

    case 'saving':
      return state.networth;
    
    case 'economist':
      const allComplete = false/*getLessonsByTag('Economist 2', data.courses).every((lesson) => {
        const submission = findSubmission(data.submissions, 'lesson', lesson.id);
        if (submission && submission.isComplete) {
          if (!state.yearFinishedAt || new Date(state.yearFinishedAt) >= new Date(submission.createdAt)) {
            return 1;
          }
        }
        return 0;
      });*/
      return allComplete ? 1 : 0;
  
    case 'homework':
      const lessonId = challenge.lessonId;
      const lesson = getLessonById(lessonId, data.courses);
      if (!lesson) return 0;
      const submission = findSubmission(data.submissions, 'lesson', lesson.id);
      if (submission && submission.isComplete) {
        if (!state.yearFinishedAt || new Date(state.yearFinishedAt) >= new Date(submission.createdAt)) {
          return 1;
        }
      }
      return 0;
      
    case 'teachingTomas':
      return computeYearlySuccess(challenge, state, (yearState) => {
        const answer = yearState.choices.tomasAnswers.find((p) => yearState.year == p.year);
        return answer && answer.correct;
      })
  }
}

export function ActiveChallenges({ age, challenges, activeChallenges, scores, year, previous }, actions) {
  return Object.values(challenges).reduce((challenges, challenge) => {
    const active = challenge.year + challenge.years > year;
    if (!active) return challenges;
    const score = scores[challenge.kind];
    const challengeWithResults = active 
      ? {
        ...challenge,
        score: score,
        succeeding: score > (previous.scores[challenge.kind] || 0),
        stalling: score == (previous.scores[challenge.kind] || 0),
        failing: score < (previous.scores[challenge.kind] || 0),
        passed: year == challenge.year + challenge.years - 1 ? getChallengeQualification(challenge, score) : false 
      }
      : activeChallenges[challenge.kind];

    return {
      ...challenges, 
      [challenge.kind]: challengeWithResults
    };
  }, {})
}


export function getChallengeQualification(challenge, score) {
  switch (challenge.kind) {
    case 'grandma':
      return score > 0;
    case 'tax':
      return score == 5;
    case 'news':
      return score == 5;
    case 'return':
      return score == 8;
    case 'economist':
      return score == 1;
    case 'dividend':
      return score > 8000;
    case 'leverage':
      return score === 15;
    case 'property':
      return score > 37500;
    case 'homework':
      return score == 1;
    case 'saving':
      return score > 1000000;
    case 'teachingTomas':
      return score == 5;
    default:
      return true;
  }
}