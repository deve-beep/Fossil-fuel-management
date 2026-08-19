require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Production = require('../models/Production');
const Reserve = require('../models/Reserve');
const Logistics = require('../models/Logistics');
const FSA = require('../models/FSA');
const CrisisReport = require('../models/CrisisReport');
const { ROLES } = require('../config/roles');

const run = async () => {
  await connectDB();
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Production.deleteMany({}),
    Reserve.deleteMany({}),
    Logistics.deleteMany({}),
    FSA.deleteMany({}),
    CrisisReport.deleteMany({})
  ]);

  console.log('[Seed] Creating demo users...');
  const admin = await User.create({
    name: 'Anil Kumar Sharma', email: 'admin@ffrscm.gov.in', password: 'Admin@12345',
    role: ROLES.ADMIN, organization: 'Ministry of Petroleum & Natural Gas', designation: 'Joint Secretary'
  });
  const analyst = await User.create({
    name: 'Priya Deshmukh', email: 'analyst@ffrscm.gov.in', password: 'Analyst@12345',
    role: ROLES.ANALYST, organization: 'Petroleum Planning & Analysis Cell', designation: 'Senior Energy Analyst'
  });
  const stakeholder = await User.create({
    name: 'Rohan Mehta', email: 'stakeholder@tatapower.com', password: 'Stake@12345',
    role: ROLES.STAKEHOLDER, organization: 'Tata Power Ltd', designation: 'Fuel Procurement Manager'
  });

  console.log('[Seed] Creating production/consumption/import records...');
  const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
  const fuelSeeds = {
    coal: { unit: 'MT', baseProd: 82, baseTarget: 90, baseCons: 88, baseImp: 18 },
    crude_oil: { unit: 'MMT', baseProd: 2.4, baseTarget: 2.9, baseCons: 21, baseImp: 19 },
    natural_gas: { unit: 'BCM', baseProd: 2.8, baseTarget: 3.2, baseCons: 5.6, baseImp: 2.9 }
  };
  for (const [fuelType, cfg] of Object.entries(fuelSeeds)) {
    for (let i = 0; i < months.length; i++) {
      const drift = (i - 2.5) * 0.01;
      await Production.create({
        fuelType, state: 'National', period: months[i], unit: cfg.unit,
        productionActual: +(cfg.baseProd * (1 + drift)).toFixed(2),
        productionTarget: cfg.baseTarget,
        consumption: +(cfg.baseCons * (1 + drift * 1.2)).toFixed(2),
        imports: +(cfg.baseImp * (1 - drift)).toFixed(2),
        createdBy: analyst._id
      });
    }
  }
  await Production.create({
    fuelType: 'coal', state: 'Jharkhand', period: '2026-03', unit: 'MT',
    productionActual: 21.4, productionTarget: 24, consumption: 19.8, imports: 0, createdBy: analyst._id
  });
  await Production.create({
    fuelType: 'natural_gas', state: 'Assam', period: '2026-03', unit: 'BCM',
    productionActual: 0.31, productionTarget: 0.35, consumption: 0.28, imports: 0, createdBy: analyst._id
  });

  console.log('[Seed] Creating strategic reserves...');
  await Reserve.create([
    { fuelType: 'crude_oil', facilityName: 'Visakhapatnam SPR', location: 'Andhra Pradesh', capacity: 1.33, currentStock: 0.98, unit: 'million MT', daysOfCoverEstimate: 9, updatedBy: admin._id },
    { fuelType: 'crude_oil', facilityName: 'Mangalore SPR', location: 'Karnataka', capacity: 1.5, currentStock: 1.42, unit: 'million MT', daysOfCoverEstimate: 12, updatedBy: admin._id },
    { fuelType: 'crude_oil', facilityName: 'Padur SPR', location: 'Karnataka', capacity: 2.5, currentStock: 0.6, unit: 'million MT', daysOfCoverEstimate: 5, notes: 'Drawn down for winter demand buffering', updatedBy: admin._id },
    { fuelType: 'coal', facilityName: 'NTPC Pithead Stock - Eastern Grid', location: 'Odisha', capacity: 12, currentStock: 9.1, unit: 'MT', daysOfCoverEstimate: 18, updatedBy: admin._id },
    { fuelType: 'coal', facilityName: 'Coal India Pooled Stock', location: 'Multi-state', capacity: 45, currentStock: 38.7, unit: 'MT', daysOfCoverEstimate: 22, updatedBy: admin._id },
    { fuelType: 'natural_gas', facilityName: 'GAIL LNG Buffer - Dahej', location: 'Gujarat', capacity: 5, currentStock: 3.1, unit: 'BCM equiv.', daysOfCoverEstimate: 14, updatedBy: admin._id }
  ]);

  console.log('[Seed] Creating logistics/distribution records...');
  await Logistics.create([
    { mode: 'rail_rake', fuelType: 'coal', routeName: 'Talcher–Kolaghat', origin: 'Talcher, Odisha', destination: 'Kolaghat, West Bengal', rakesPlanned: 12, rakesDispatched: 11, status: 'on_schedule', reportedBy: admin._id },
    { mode: 'rail_rake', fuelType: 'coal', routeName: 'Korba–Vindhyachal', origin: 'Korba, Chhattisgarh', destination: 'Vindhyachal, MP', rakesPlanned: 10, rakesDispatched: 6, status: 'delayed', delayReason: 'Track maintenance block', reportedBy: admin._id },
    { mode: 'pipeline', fuelType: 'crude_oil', routeName: 'Salaya–Mathura Pipeline', origin: 'Salaya, Gujarat', destination: 'Mathura, UP', pipelineCapacity: 8.4, pipelineThroughput: 7.6, status: 'on_schedule', reportedBy: admin._id },
    { mode: 'pipeline', fuelType: 'natural_gas', routeName: 'HVJ (HBJ) Pipeline', origin: 'Hazira, Gujarat', destination: 'Jagdishpur, UP', pipelineCapacity: 33.4, pipelineThroughput: 29.1, status: 'on_schedule', reportedBy: admin._id },
    { mode: 'pipeline', fuelType: 'natural_gas', routeName: 'Kochi–Bengaluru Pipeline', origin: 'Kochi, Kerala', destination: 'Bengaluru, Karnataka', pipelineCapacity: 12, pipelineThroughput: 5.4, status: 'disrupted', delayReason: 'Right-of-way dispute halting a 40km segment', reportedBy: admin._id },
    { mode: 'coastal_shipping', fuelType: 'crude_oil', routeName: 'Jamnagar–Paradip Coastal Run', origin: 'Jamnagar, Gujarat', destination: 'Paradip, Odisha', pipelineCapacity: 3, pipelineThroughput: 2.7, status: 'on_schedule', reportedBy: admin._id }
  ]);

  console.log('[Seed] Creating Fuel Supply Agreements...');
  await FSA.create([
    { agreementCode: 'FSA-CIL-TATA-2025-014', fuelType: 'coal', supplier: 'Coal India Ltd', consumer: 'Tata Power Ltd', consumerSector: 'power', annualContractedQuantity: 9.2, unit: 'MT', tenureStart: '2025-04-01', tenureEnd: '2028-03-31', suppliedTillDate: 6.9, status: 'active', complianceStatus: 'compliant', proposedBy: stakeholder._id, approvedBy: admin._id },
    { agreementCode: 'FSA-GAIL-TATA-2025-021', fuelType: 'natural_gas', supplier: 'GAIL India Ltd', consumer: 'Tata Power Ltd', consumerSector: 'power', annualContractedQuantity: 0.85, unit: 'BCM', tenureStart: '2025-07-01', tenureEnd: '2027-06-30', suppliedTillDate: 0.31, status: 'active', complianceStatus: 'shortfall', remarks: 'Q3 offtake below contracted minimum due to plant maintenance', proposedBy: stakeholder._id, approvedBy: admin._id },
    { agreementCode: 'FSA-ONGC-IOCL-2026-003', fuelType: 'crude_oil', supplier: 'ONGC', consumer: 'Indian Oil Corporation Ltd', consumerSector: 'refining', annualContractedQuantity: 4.1, unit: 'MMT', tenureStart: '2026-01-01', tenureEnd: '2026-12-31', suppliedTillDate: 0.9, status: 'pending_approval', proposedBy: stakeholder._id }
  ]);

  console.log('[Seed] Creating crisis/policy reports...');
  await CrisisReport.create([
    {
      title: 'Brent crude price spike following Strait of Hormuz tensions',
      category: 'geopolitical', fuelType: 'crude_oil', severity: 'high',
      affectedRegions: ['National'], description: 'Benchmark crude prices rose sharply amid regional shipping-lane tensions, raising import bill pressure.',
      impactSummary: 'Landed cost up ~11% week-on-week; refining margins compressed.',
      mitigationActions: ['Activated SPR draw-down protocol at Padur', 'Diversified spot cargo sourcing to West Africa'],
      status: 'monitoring', reportedBy: analyst._id
    },
    {
      title: 'Cyclone-related disruption to Kakinada coastal gas terminal',
      category: 'natural_disaster', fuelType: 'natural_gas', severity: 'moderate',
      affectedRegions: ['Andhra Pradesh', 'Telangana'], description: 'Cyclonic weather forced a 48-hour shutdown of regasification operations.',
      impactSummary: 'Approx. 0.4 BCM deferred supply to eastern grid city-gas networks.',
      mitigationActions: ['Rerouted LNG cargo to Dahej terminal', 'Drew down GAIL buffer stock'],
      status: 'mitigated', reportedBy: analyst._id, resolvedAt: new Date()
    },
    {
      title: 'Rail rake shortage on Korba–Vindhyachal coal corridor',
      category: 'infrastructure_failure', fuelType: 'coal', severity: 'moderate',
      affectedRegions: ['Chhattisgarh', 'Madhya Pradesh'], description: 'Track maintenance reduced rake availability, threatening thermal plant coal-day cover.',
      impactSummary: '5 rakes/day shortfall against plan for 6 consecutive days.',
      mitigationActions: ['Prioritized critical-stock power plants', 'Requested Railway Board expedited clearance'],
      status: 'open', reportedBy: admin._id
    }
  ]);

  console.log('[Seed] Done. Demo accounts:');
  console.log('  Admin:       admin@ffrscm.gov.in / Admin@12345');
  console.log('  Analyst:     analyst@ffrscm.gov.in / Analyst@12345');
  console.log('  Stakeholder: stakeholder@tatapower.com / Stake@12345');
  process.exit(0);
};

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
