const WARMING_SCHEDULE = [
  { dayFrom: 1, dayTo: 3, limitPerDomain: 10 },
  { dayFrom: 4, dayTo: 7, limitPerDomain: 20 },
  { dayFrom: 8, dayTo: 10, limitPerDomain: 30 },
  { dayFrom: 11, dayTo: 14, limitPerDomain: 40 },
  { dayFrom: 15, dayTo: 999, limitPerDomain: 50 },
];

function getDomainAgeDays(createdAt) {
  if (!createdAt) return 999;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
}

function getLimitForDomain(createdAt) {
  const age = getDomainAgeDays(createdAt);
  const schedule = WARMING_SCHEDULE.find((s) => age >= s.dayFrom && age <= s.dayTo);
  return schedule ? schedule.limitPerDomain : 50;
}

module.exports = { getLimitForDomain, getDomainAgeDays, WARMING_SCHEDULE };
