export function Education(state, actions) {
  return actions.slice().reverse().find((a) => a.type === 'enroll' && a.year + a.years <= state.year);
}

export function Educations(state, actions) {
  return actions.slice().reverse().filter((a) => a.type === 'enroll' && a.year + a.years <= state.year);
}

export function Study({ year }, actions) {
  return actions.find((a) => a.type === 'enroll' && a.year + a.years > year && a.year <= year)
}

export function Stipend({ study }) {
  return study && study.stipend || 0;
}
export function Earnings({ salary, stipend }) {
  return salary + stipend
}

export function Job({ study, year, educations }, actions) {
  const lastJob = actions.slice().reverse().find((a) => a.type === 'work' && a.year <= year);
  if (lastJob && !study && !educations.find((e) => e.year > lastJob.year)) {
    return lastJob;
  }
  return null;
}

export function Company({ job, companies }) {
  return job && companies.find((company) => company.name === job.context)
}

export function ExperienceInPosition( { year, job, study, experienceInPosition  = 0 }) {
  if (job && job.year === year) {
    return 1;
  }
  return !study && job ? experienceInPosition + 1 : experienceInPosition;
}

export function Experience( { job, study, experience = 0 }) {
  return !study && job ? experience + 1 : experience;
}

export function Business ({turn, startingYear, choices}, actions) {
  if (turn >= 19 && turn <= 21 || choices.boughtBackBusiness) {
    return { name: 'Paper Chase Inc', valuation: choices.boughtBackBusiness ? choices.boughtBackBusiness.sum : 1000000, salary: 30000, year: startingYear + 19}
  }
}

export function Baseline({ experience, baseline, job }) {
  const current = baseline || 75000;
  if (!job) {
    var growth = 0;
  } else if (experience < 10) {
    var growth = 0.04;
  } else if (experience < 20) {
    var growth = 0.03;
  } else if (experience < 30) {
    var growth = 0.02;
  } else {
    var growth = 0.01;
  }
  return current + current * growth;
}

export function SalaryExpectation({ baseline, education }) {
  if (!education) {
    return baseline / 2.5;
  }
  if (education.tier === 'college') {
    return baseline * 1 * (education.level === 'elite' ? 1.2 : 1)
  }
  if (education.tier === 'grad') {
    return baseline * 2 * (education.level === 'elite' ? 1.2 : 1)
  }
}

export function Options({ previous, job, year }) {
  if (previous.job && previous.job.context === 'Startup') {
    return previous.job;
  } else if (job && job.context === 'Startup' && job.year < year) {
    return job;
  }
}

export function ExercisedOptions({ options, age }, actions, previous) {
  return options && actions.find((action) => action.type === 'exercise' && action.id === options.id);
}

export function Salary({ job, salaryExpectation, tickers }) {
  if (job) {
    const company = tickers.find((ticker) => ticker.name === job.stock);
    return (job.multiplier || 1) * (company ? company.salaryPortion : 1) * salaryExpectation;
  }
  return 0;

}
