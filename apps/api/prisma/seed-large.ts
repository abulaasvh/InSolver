import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding large synthetic dataset for latency and k6 load testing (500 institutions, 2000 cases)...');
  const passwordHash = await bcrypt.hash('Demo@1234', 10);

  // Ensure bureaus exist
  const bureaus = await prisma.bureau.findMany();
  if (bureaus.length === 0) {
    console.log('Run normal seed first!');
    return;
  }

  const regions = ['North', 'South', 'East', 'West', 'Central'];
  const categories = ['Approval Norms', 'Policy & Academic', 'Anti-Ragging', 'Women Safety', 'Fee Dispute'];
  const statuses = ['New', 'Under Process', 'Transferred', 'Disposed', 'Overdue'];

  const instBatch = [];
  for (let i = 100; i < 600; i++) {
    instBatch.push({
      aicte_permanent_id: `PERM-IND-${10000 + i}`,
      canonical_name: `Synthetic Technical Institute #${i}`,
      aliases: [`STI-${i}`, `Institute ${i}`],
      region: regions[i % regions.length],
      address: `Campus Road ${i}, City ${i}`,
      verification_status: 'verified'
    });
  }

  console.log(`Inserting ${instBatch.length} institutions...`);
  await prisma.institution.createMany({
    data: instBatch,
    skipDuplicates: true
  });

  const createdInsts = await prisma.institution.findMany({ select: { id: true, aicte_permanent_id: true } });

  const casesBatch = [];
  for (let c = 1000; c < 3000; c++) {
    const inst = createdInsts[c % createdInsts.length];
    const bureau = bureaus[c % bureaus.length];
    const cat = categories[c % categories.length];
    const status = statuses[c % statuses.length];

    casesBatch.push({
      case_code: `CASE-SYN-${c}`,
      source_system: 'AICTE_PORTAL',
      source_case_id: `SRC-SYN-${c}`,
      institution_id: inst.id,
      subject: `Synthetic complaint ${c} regarding ${cat} issues and compliance in department ${c % 10}`,
      category: cat,
      status: status,
      bureau_id: bureau.id,
      received_at: new Date(Date.now() - (c % 180) * 86400000),
      due_at: new Date(Date.now() + ((c % 30) - 10) * 86400000),
      synced_at: new Date()
    });
  }

  console.log(`Inserting ${casesBatch.length} synthetic cases...`);
  await prisma.case.createMany({
    data: casesBatch,
    skipDuplicates: true
  });

  console.log('✅ Large dataset seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Large seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
