const ROLES = Object.freeze({
  ADMIN: 'government_admin',
  ANALYST: 'energy_analyst',
  STAKEHOLDER: 'industrial_stakeholder'
});

const PERMISSIONS = Object.freeze({
  production: { read: [ROLES.ADMIN, ROLES.ANALYST, ROLES.STAKEHOLDER], write: [ROLES.ADMIN, ROLES.ANALYST] },
  reserves:   { read: [ROLES.ADMIN, ROLES.ANALYST, ROLES.STAKEHOLDER], write: [ROLES.ADMIN] },
  logistics:  { read: [ROLES.ADMIN, ROLES.ANALYST, ROLES.STAKEHOLDER], write: [ROLES.ADMIN, ROLES.ANALYST] },
  fsa:        { read: [ROLES.ADMIN, ROLES.ANALYST, ROLES.STAKEHOLDER], write: [ROLES.ADMIN, ROLES.STAKEHOLDER] },
  crisis:     { read: [ROLES.ADMIN, ROLES.ANALYST, ROLES.STAKEHOLDER], write: [ROLES.ADMIN, ROLES.ANALYST] },
  users:      { read: [ROLES.ADMIN], write: [ROLES.ADMIN] }
});

module.exports = { ROLES, PERMISSIONS };
