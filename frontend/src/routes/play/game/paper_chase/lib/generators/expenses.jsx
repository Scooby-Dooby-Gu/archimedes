export default function CostOfLiving({ job, age, study, salary }, actions) {
  return age >= 18 && (job || (study && study.tier !== 'college')) ? (salary) * 0.2 : 0;
}