import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding InSolver database with synthetic demo data...');

  // 1. Clean up existing data in reverse order of foreign keys
  await prisma.auditEvent.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.caseEvent.deleteMany({});
  await prisma.caseRelationship.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.routingRule.deleteMany({});
  await prisma.institution.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.bureau.deleteMany({});
  await prisma.ingestionRun.deleteMany({});

  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  // 2. Seed Bureaus & Cells
  const bureausData = [
    { name: 'Approval Bureau', type: 'Bureau', active: true },
    { name: 'Policy Bureau', type: 'Bureau', active: true },
    { name: 'Anti-Ragging Cell', type: 'Cell', active: true },
    { name: 'Women Cell', type: 'Cell', active: true },
    { name: 'PGRC', type: 'Cell', active: true }
  ];

  const bureausMap: Record<string, any> = {};
  for (const b of bureausData) {
    const created = await prisma.bureau.create({ data: b });
    bureausMap[b.name] = created;
  }
  console.log(`Created ${Object.keys(bureausMap).length} bureaus/cells.`);

  // 3. Seed Users
  const usersData = [
    {
      name: 'A. Rao',
      email: 'a.rao@aicte.gov.in',
      password_hash: passwordHash,
      role: 'supervisor',
      bureau_scope: null,
      region_scope: null,
      active: true
    },
    {
      name: 'S. Iyer',
      email: 's.iyer@aicte.gov.in',
      password_hash: passwordHash,
      role: 'officer',
      bureau_scope: 'PGRC',
      region_scope: null,
      active: true
    },
    {
      name: 'R. Sharma',
      email: 'r.sharma@aicte.gov.in',
      password_hash: passwordHash,
      role: 'management',
      bureau_scope: null,
      region_scope: null,
      active: true
    },
    {
      name: 'V. Nair',
      email: 'v.nair@aicte.gov.in',
      password_hash: passwordHash,
      role: 'regional',
      bureau_scope: null,
      region_scope: 'South',
      active: true
    },
    {
      name: 'System Admin',
      email: 'admin@aicte.gov.in',
      password_hash: passwordHash,
      role: 'admin',
      bureau_scope: null,
      region_scope: null,
      active: true
    },
    {
      name: 'Independent Auditor',
      email: 'auditor@aicte.gov.in',
      password_hash: passwordHash,
      role: 'auditor',
      bureau_scope: null,
      region_scope: null,
      active: true
    }
  ];

  const usersMap: Record<string, any> = {};
  for (const u of usersData) {
    const created = await prisma.user.create({ data: u });
    usersMap[u.name] = created;
  }
  console.log(`Created ${Object.keys(usersMap).length} seeded users.`);

  // 4. Seed Institutions
  const institutionsData = [
    {
      aicte_permanent_id: 'DEMO-1042',
      canonical_name: 'Institute X of Technology & Science',
      aliases: ['Institute X', 'IXTS South', 'X Tech Academy'],
      region: 'South',
      address: 'Plot 42, Knowledge Park, Bengaluru, Karnataka - 560100',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-2011',
      canonical_name: 'Apex Institute of Engineering & Technology',
      aliases: ['Apex Engg', 'AIET North', 'Apex Tech'],
      region: 'North',
      address: 'Sector 12, Tech Zone, Greater Noida, Uttar Pradesh - 201310',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-3044',
      canonical_name: 'Global Institute of Management & Research',
      aliases: ['GIMR Pune', 'Global Management West'],
      region: 'West',
      address: 'Shivaji Nagar, Pune, Maharashtra - 411005',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-4098',
      canonical_name: 'National Polytechnic Institute',
      aliases: ['NPI Kolkata', 'National Poly East'],
      region: 'East',
      address: 'Salt Lake Sector V, Kolkata, West Bengal - 700091',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-5012',
      canonical_name: 'St. Jude Institute of Pharmacy',
      aliases: ['St. Jude Bhopal', 'SJIP Central'],
      region: 'Central',
      address: 'Arera Colony, Bhopal, Madhya Pradesh - 462016',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-6077',
      canonical_name: 'Deccan Technical Campus',
      aliases: ['DTC Hyderabad', 'Deccan Engg'],
      region: 'South',
      address: 'Gachibowli, Hyderabad, Telangana - 500032',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-7089',
      canonical_name: 'Metro Engineering College',
      aliases: ['MEC Delhi', 'Metro Tech'],
      region: 'North',
      address: 'Rohini Sector 14, New Delhi - 110085',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-8023',
      canonical_name: 'Western Institute of Technology',
      aliases: ['WIT Ahmedabad', 'Western Tech Gujarat'],
      region: 'West',
      address: 'SG Highway, Ahmedabad, Gujarat - 380054',
      verification_status: 'verified'
    },
    {
      aicte_permanent_id: 'DEMO-TEMP-99',
      canonical_name: 'Apex College of Applied Sciences',
      aliases: ['Apex Applied', 'Ambiguous Apex'],
      region: 'North',
      address: 'Civil Lines, Kanpur, Uttar Pradesh',
      verification_status: 'pending' // Ambiguous match verification queue
    }
  ];

  const institutionsMap: Record<string, any> = {};
  for (const inst of institutionsData) {
    const created = await prisma.institution.create({ data: inst });
    institutionsMap[inst.aicte_permanent_id] = created;
  }
  console.log(`Created ${Object.keys(institutionsMap).length} institutions.`);

  // 5. Seed Routing Rules
  const routingRulesData = [
    {
      keywords: ['ragging', 'harassment', 'fresher abuse', 'hostel bullying', 'mental agony'],
      category: 'Anti-Ragging',
      bureau_id: bureausMap['Anti-Ragging Cell'].id,
      priority: 10
    },
    {
      keywords: ['fee refund', 'tuition fee', 'excess fee', 'caution deposit', 'document withholding', 'refund delay'],
      category: 'Fee Dispute',
      bureau_id: bureausMap['PGRC'].id,
      priority: 10
    },
    {
      keywords: ['women', 'safety', 'sexual harassment', 'posh', 'hostel safety', 'internal complaints committee'],
      category: 'Women Safety',
      bureau_id: bureausMap['Women Cell'].id,
      priority: 10
    },
    {
      keywords: ['approval', 'approval norms', 'intake capacity', 'sanction', 'land norm', 'infrastructure defect', 'affiliation'],
      category: 'Approval Norms',
      bureau_id: bureausMap['Approval Bureau'].id,
      priority: 10
    },
    {
      keywords: ['curriculum', 'syllabus', 'credits', 'nep policy', 'internship', 'academic calendar', 'examination guideline'],
      category: 'Policy & Academic',
      bureau_id: bureausMap['Policy Bureau'].id,
      priority: 10
    }
  ];

  for (const r of routingRulesData) {
    await prisma.routingRule.create({ data: r });
  }
  console.log(`Created ${routingRulesData.length} keyword routing rules.`);

  // 6. Seed Cases
  const instX = institutionsMap['DEMO-1042'];
  const instApex = institutionsMap['DEMO-2011'];
  const instGlobal = institutionsMap['DEMO-3044'];
  const instPoly = institutionsMap['DEMO-4098'];
  const instJude = institutionsMap['DEMO-5012'];
  const instDeccan = institutionsMap['DEMO-6077'];
  const instMetro = institutionsMap['DEMO-7089'];
  const instWest = institutionsMap['DEMO-8023'];

  const sIyer = usersMap['S. Iyer'];
  const aRao = usersMap['A. Rao'];

  const casesData = [
    // --- Institute X (DEMO-1042) target cases ---
    {
      case_code: 'CASE-0137',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-APP-1042-01',
      institution_id: instX.id,
      subject: 'Approval norms query regarding lab space deficit',
      category: 'Approval Norms',
      status: 'Under Process',
      bureau_id: bureausMap['Approval Bureau'].id,
      officer_id: null,
      received_at: new Date('2026-09-02T10:00:00Z'),
      last_action: 'Scrutiny of physical verification report',
      last_action_at: new Date('2026-09-18T14:30:00Z'),
      next_action: 'Issue compliance clarification letter',
      due_at: new Date('2026-11-10T18:00:00Z'),
      synced_at: new Date('2026-10-28T09:15:00Z')
    },
    {
      case_code: 'CASE-0136',
      source_system: 'PGRC_PORTAL',
      source_case_id: 'SRC-PGRC-1042-02',
      institution_id: instX.id,
      subject: 'Fee refund not processed after admission withdrawal',
      category: 'Fee Dispute',
      status: 'Under Process',
      bureau_id: bureausMap['PGRC'].id,
      officer_id: sIyer.id,
      received_at: new Date('2026-09-09T11:30:00Z'),
      last_action: 'Documents requested from institute',
      last_action_at: new Date('2026-10-24T16:00:00Z'),
      next_action: 'Joint reply with Approval Bureau',
      due_at: new Date('2026-10-31T18:00:00Z'), // Due in ~2 days (Due soon!)
      synced_at: new Date('2026-10-29T08:00:00Z'),
      lead_team: 'PGRC',
      coordination_note: 'Approval Bureau supports the joint reply.'
    },
    {
      case_code: 'CASE-0139',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-WOM-1042-03',
      institution_id: instX.id,
      subject: 'Hostel safety concern and inadequate lighting',
      category: 'Women Safety',
      status: 'Transferred',
      bureau_id: bureausMap['Women Cell'].id,
      officer_id: null,
      received_at: new Date('2026-09-21T09:00:00Z'),
      last_action: 'Transferred to State Higher Education Council',
      last_action_at: new Date('2026-10-05T12:00:00Z'),
      next_action: 'Awaiting state report',
      due_at: new Date('2026-11-15T18:00:00Z'),
      synced_at: new Date('2026-10-27T10:00:00Z')
    },
    {
      case_code: 'CASE-0141',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-RAG-1042-04',
      institution_id: instX.id,
      subject: 'Ragging reported in hostel block B by 1st year students',
      category: 'Anti-Ragging',
      status: 'New',
      bureau_id: bureausMap['Anti-Ragging Cell'].id,
      officer_id: null,
      received_at: new Date('2026-10-28T14:45:00Z'),
      last_action: 'Intake triage complete',
      last_action_at: new Date('2026-10-28T15:00:00Z'),
      next_action: 'Assign investigative officer & summon squad',
      due_at: new Date('2026-11-04T18:00:00Z'),
      synced_at: new Date('2026-10-28T15:00:00Z')
    },

    // --- Other institutions & overdue cases ---
    {
      case_code: 'CASE-0129',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-APP-2011-01',
      institution_id: instApex.id,
      subject: 'Approval documents pending for new course addition',
      category: 'Approval Norms',
      status: 'Overdue',
      bureau_id: bureausMap['Approval Bureau'].id,
      officer_id: null,
      received_at: new Date('2026-08-15T10:00:00Z'),
      last_action: 'First reminder sent to institute registrar',
      last_action_at: new Date('2026-09-10T11:00:00Z'),
      next_action: 'Immediate physical inspection or sanction penalty',
      due_at: new Date('2026-10-15T18:00:00Z'), // Past due -> Overdue!
      synced_at: new Date('2026-10-28T09:00:00Z')
    },
    {
      case_code: 'CASE-0128',
      source_system: 'PGRC_PORTAL',
      source_case_id: 'SRC-PGRC-2011-02',
      institution_id: instApex.id,
      subject: 'Excess fee charged above regulatory cap',
      category: 'Fee Dispute',
      status: 'Under Process',
      bureau_id: bureausMap['PGRC'].id,
      officer_id: sIyer.id,
      received_at: new Date('2026-09-12T10:15:00Z'),
      last_action: 'Audit of institute balance sheet',
      last_action_at: new Date('2026-10-12T15:00:00Z'),
      next_action: 'Hearing scheduled with grievance redressal committee',
      due_at: new Date('2026-11-05T18:00:00Z'),
      synced_at: new Date('2026-10-28T12:00:00Z')
    },
    {
      case_code: 'CASE-0130',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-POL-3044-01',
      institution_id: instGlobal.id,
      subject: 'Non-compliance with NEP curriculum credits guidelines',
      category: 'Policy & Academic',
      status: 'Under Process',
      bureau_id: bureausMap['Policy Bureau'].id,
      officer_id: null,
      received_at: new Date('2026-09-20T11:00:00Z'),
      last_action: 'Academic council report reviewed',
      last_action_at: new Date('2026-10-14T10:00:00Z'),
      next_action: 'Issue advisory to university registrar',
      due_at: new Date('2026-11-20T18:00:00Z'),
      synced_at: new Date('2026-10-26T16:00:00Z')
    },
    {
      case_code: 'CASE-0131',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-RAG-4098-01',
      institution_id: instPoly.id,
      subject: 'Verbal harassment and abusive conduct in mechanical workshop',
      category: 'Anti-Ragging',
      status: 'Disposed',
      bureau_id: bureausMap['Anti-Ragging Cell'].id,
      officer_id: null,
      received_at: new Date('2026-08-01T09:30:00Z'),
      last_action: 'Disciplinary action taken by college anti-ragging squad',
      last_action_at: new Date('2026-08-25T14:00:00Z'),
      next_action: 'Case closed, file archived',
      due_at: new Date('2026-08-30T18:00:00Z'),
      synced_at: new Date('2026-10-20T10:00:00Z')
    },
    {
      case_code: 'CASE-0132',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-WOM-5012-01',
      institution_id: instJude.id,
      subject: 'Absence of functional Internal Complaints Committee (ICC)',
      category: 'Women Safety',
      status: 'Overdue',
      bureau_id: bureausMap['Women Cell'].id,
      officer_id: null,
      received_at: new Date('2026-08-10T10:00:00Z'),
      last_action: 'Show cause notice issued',
      last_action_at: new Date('2026-09-01T11:00:00Z'),
      next_action: 'Recommend suspension of approval to Approval Bureau',
      due_at: new Date('2026-09-30T18:00:00Z'),
      synced_at: new Date('2026-10-25T08:00:00Z')
    },
    {
      case_code: 'CASE-0133',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-APP-6077-01',
      institution_id: instDeccan.id,
      subject: 'Faculty-student ratio norm violation in Computer Science',
      category: 'Approval Norms',
      status: 'Under Process',
      bureau_id: bureausMap['Approval Bureau'].id,
      officer_id: null,
      received_at: new Date('2026-09-25T14:00:00Z'),
      last_action: 'Faculty roster requested',
      last_action_at: new Date('2026-10-15T16:00:00Z'),
      next_action: 'Scrutiny of Aadhaar-linked faculty roster',
      due_at: new Date('2026-11-12T18:00:00Z'),
      synced_at: new Date('2026-10-27T14:00:00Z')
    },
    {
      case_code: 'CASE-0134',
      source_system: 'PGRC_PORTAL',
      source_case_id: 'SRC-PGRC-7089-01',
      institution_id: instMetro.id,
      subject: 'Original 10th and 12th certificates retained unlawfully',
      category: 'Fee Dispute',
      status: 'New',
      bureau_id: bureausMap['PGRC'].id,
      officer_id: null,
      received_at: new Date('2026-10-27T11:15:00Z'),
      last_action: 'Initial notice sent to principal',
      last_action_at: new Date('2026-10-27T12:00:00Z'),
      next_action: 'Mandatory certificate return direction',
      due_at: new Date('2026-11-06T18:00:00Z'),
      synced_at: new Date('2026-10-28T09:30:00Z')
    },
    {
      case_code: 'CASE-0135',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-POL-8023-01',
      institution_id: instWest.id,
      subject: 'Mandatory internship credits not awarded to final year batch',
      category: 'Policy & Academic',
      status: 'Disposed',
      bureau_id: bureausMap['Policy Bureau'].id,
      officer_id: null,
      received_at: new Date('2026-07-20T10:00:00Z'),
      last_action: 'University senate resolution obtained',
      last_action_at: new Date('2026-08-30T15:00:00Z'),
      next_action: 'Resolved and closed',
      due_at: new Date('2026-09-01T18:00:00Z'),
      synced_at: new Date('2026-10-15T11:00:00Z')
    },
    {
      case_code: 'CASE-0142',
      source_system: 'AICTE_PORTAL',
      source_case_id: 'SRC-APP-1042-05',
      institution_id: instX.id,
      subject: 'Intake expansion proposal for AI & Data Science program',
      category: 'Approval Norms',
      status: 'New',
      bureau_id: bureausMap['Approval Bureau'].id,
      officer_id: null,
      received_at: new Date('2026-10-26T16:00:00Z'),
      last_action: 'Application received online',
      last_action_at: new Date('2026-10-26T16:00:00Z'),
      next_action: 'Document verification and committee formation',
      due_at: new Date('2026-11-25T18:00:00Z'),
      synced_at: new Date('2026-10-28T10:00:00Z')
    }
  ];

  const casesMap: Record<string, any> = {};
  for (const c of casesData) {
    const created = await prisma.case.create({ data: c });
    casesMap[c.case_code] = created;
  }
  console.log(`Created ${Object.keys(casesMap).length} seeded cases.`);

  // 7. Seed Case Relationships (Overlaps)
  // Relationship 1: Confirmed overlap (CASE-0136 & CASE-0137 inside Institute X)
  await prisma.caseRelationship.create({
    data: {
      case_a_id: casesMap['CASE-0136'].id,
      case_b_id: casesMap['CASE-0137'].id,
      relationship_type: 'cross_cell_overlap',
      confidence_band: 'High',
      score: 0.88,
      reasons: [
        { label: 'Same institution ID', detail: 'DEMO-1042 (Institute X)' },
        { label: 'Close dates', detail: 'Received 7 days apart (02 Sep & 09 Sep 2026)' },
        { label: 'Coordination required', detail: 'Fee dispute references pending approval status' }
      ],
      review_status: 'confirmed',
      reviewed_by: aRao.id,
      reviewed_at: new Date('2026-10-20T11:45:00Z'),
      reason: 'Joint coordination confirmed between PGRC and Approval Bureau for fee dispute related to provisional approval.'
    }
  });

  // Relationship 2: Rejected overlap (CASE-0139 Women Cell & CASE-0141 Anti-Ragging Cell inside Institute X)
  await prisma.caseRelationship.create({
    data: {
      case_a_id: casesMap['CASE-0139'].id,
      case_b_id: casesMap['CASE-0141'].id,
      relationship_type: 'cross_cell_overlap',
      confidence_band: 'Medium',
      score: 0.62,
      reasons: [
        { label: 'Same institution ID', detail: 'DEMO-1042 (Institute X)' },
        { label: 'Similar subject', detail: 'Hostel safety vs Ragging in hostel' }
      ],
      review_status: 'rejected',
      reviewed_by: aRao.id,
      reviewed_at: new Date('2026-10-28T16:20:00Z'),
      reason: 'Different issue, handled separately'
    }
  });

  // Relationship 3: Suggested overlap for live demo review (CASE-0141 & CASE-0137 inside Institute X)
  await prisma.caseRelationship.create({
    data: {
      case_a_id: casesMap['CASE-0141'].id,
      case_b_id: casesMap['CASE-0137'].id,
      relationship_type: 'cross_cell_overlap',
      confidence_band: 'Medium',
      score: 0.58,
      reasons: [
        { label: 'Same institution ID', detail: 'DEMO-1042 (Institute X)' },
        { label: 'Active concurrent cases', detail: 'Both cases currently under active processing' }
      ],
      review_status: 'suggested',
      reviewed_by: null,
      reviewed_at: null,
      reason: null
    }
  });
  console.log('Created seeded case relationships (confirmed, rejected, suggested).');

  // 8. Seed Case Events
  await prisma.caseEvent.createMany({
    data: [
      {
        case_id: casesMap['CASE-0136'].id,
        actor_id: aRao.id,
        event_type: 'owner_assigned',
        remarks: 'Owner set to S. Iyer (PGRC)',
        created_at: new Date('2026-09-10T10:00:00Z')
      },
      {
        case_id: casesMap['CASE-0136'].id,
        actor_id: sIyer.id,
        event_type: 'note_added',
        remarks: 'Coordination note added: Lead team: PGRC. Approval Bureau supports the joint reply.',
        created_at: new Date('2026-10-22T14:10:00Z')
      },
      {
        case_id: casesMap['CASE-0129'].id,
        actor_id: aRao.id,
        event_type: 'status_change',
        remarks: 'CASE-0129 marked Overdue (SLA breach 15 Oct 2026)',
        created_at: new Date('2026-10-16T09:00:00Z')
      },
      {
        case_id: casesMap['CASE-0129'].id,
        actor_id: aRao.id,
        event_type: 'escalation',
        remarks: 'Escalated to supervisor A. Rao due to persistent non-response from institute',
        created_at: new Date('2026-10-16T09:05:00Z')
      }
    ]
  });
  console.log('Created seeded case events.');

  // 9. Seed Alerts
  await prisma.alert.createMany({
    data: [
      {
        case_id: casesMap['CASE-0136'].id,
        rule: 'SLA_DUE_SOON',
        triggered_at: new Date('2026-10-29T08:00:00Z'),
        recipient_id: sIyer.id,
        delivery_status: 'delivered',
        resolved_at: null
      },
      {
        case_id: casesMap['CASE-0129'].id,
        rule: 'SLA_OVERDUE',
        triggered_at: new Date('2026-10-16T09:00:00Z'),
        recipient_id: aRao.id,
        delivery_status: 'delivered',
        resolved_at: null
      }
    ]
  });
  console.log('Created seeded alerts.');

  // 10. Seed Audit Events (Append-only)
  await prisma.auditEvent.createMany({
    data: [
      {
        actor_id: aRao.id,
        action: 'case.assign',
        entity_type: 'case',
        entity_id: casesMap['CASE-0136'].id,
        metadata: { officer: 'S. Iyer', bureau: 'PGRC' },
        created_at: new Date('2026-09-10T10:00:00Z')
      },
      {
        actor_id: aRao.id,
        action: 'link.confirm',
        entity_type: 'case_relationship',
        entity_id: casesMap['CASE-0136'].id,
        metadata: {
          case_a: 'CASE-0136',
          case_b: 'CASE-0137',
          reason: 'Joint coordination confirmed between PGRC and Approval Bureau'
        },
        created_at: new Date('2026-10-20T11:45:00Z')
      },
      {
        actor_id: sIyer.id,
        action: 'case.coordination_note',
        entity_type: 'case',
        entity_id: casesMap['CASE-0136'].id,
        metadata: { note: 'Lead team: PGRC. Approval Bureau supports the joint reply.' },
        created_at: new Date('2026-10-22T14:10:00Z')
      },
      {
        actor_id: aRao.id,
        action: 'link.reject',
        entity_type: 'case_relationship',
        entity_id: casesMap['CASE-0139'].id,
        metadata: {
          case_a: 'CASE-0139',
          case_b: 'CASE-0141',
          reason: 'Different issue, handled separately'
        },
        created_at: new Date('2026-10-28T16:20:00Z')
      },
      {
        actor_id: aRao.id,
        action: 'case.overdue_escalation',
        entity_type: 'case',
        entity_id: casesMap['CASE-0129'].id,
        metadata: { reason: 'SLA deadline exceeded, marked Overdue' },
        created_at: new Date('2026-10-16T09:05:00Z')
      }
    ]
  });
  console.log('Created seeded audit events.');

  console.log('✅ Seed completed successfully with full synthetic AICTE dataset.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
