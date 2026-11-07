export function ExpertiseBaseline({ skills }) {
  const economist = skills.find((skill) => skill.name === 'Economist');
  if (economist && economist.level >= 5) {
    return 3;
  } else if (economist && economist.level >= 3) {
    return 2;
  } else if (economist && economist.level >= 1) {
    return 1;
  } else {
    return 0;
  }
}

export function Expertise({ expertiseBaseline, year }, actions) {
  const categories = ['World news', 'Economics', 'Politics'];

  return categories.reduce((expertise, category) => {
    expertise[category] = actions.reduce((exp, action) => {
      return exp + (action.year === year 
        && (action.type === 'buyReport' || action.type === 'consult') 
        && action.category === category ? 2 : 0)
    }, expertiseBaseline);
    return expertise;
  }, {});
}

export function ConsultationsYearly({ skills, age }) {
  const economist = skills.find((skill) => skill.name === 'Economist');
  if (economist && economist.level >= 4) {
    return 2;
  } else if (economist && economist.level >= 2) {
    return 1;
  }
  return 0;
}

export function ConsultationsAvailable({ consultationsYearly, year }, actions) {
  return Math.max(0, actions.reduce((c, action) => {
    return c - (action.year === year && action.type === 'consult' ? 1 : 0)
  }, consultationsYearly));
}