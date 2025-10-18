import 'dotenv/config';
import { db } from './index';
import {
  affiliates,
  sap,
  asf,
  users,
  submissions,
  activityLogs,
} from './schema';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');

  // Seed users
  let user = await db.query.users.findFirst({ where: eq(users.email, 'testuser@example.com') });
  if (!user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    user = (await db.insert(users).values({
      id: '2021-00001',
      name: 'Test User',
      email: 'testuser@example.com',
      password: hashedPassword,
      role: 'student',
    }).returning())[0];
    console.log('Seeded 1 student user.');
  }

  let intimaUser = await db.query.users.findFirst({ where: eq(users.email, 'intima@inti.edu') });
  if (!intimaUser) {
    const intimaPassword = await bcrypt.hash('intima123', 10);
    intimaUser = (await db.insert(users).values({
      id: '2021-00002',
      name: 'INTIMA Admin',
      email: 'intima@inti.edu',
      password: intimaPassword,
      role: 'intima',
      permissions: JSON.stringify(['admin']),
    }).returning())[0];
    console.log('Seeded 1 intima user.');
  }

  // Seed affiliates
  let affiliate = await db.query.affiliates.findFirst({ where: eq(affiliates.name, 'Test Affiliate') });
  if (!affiliate) {
    affiliate = (await db.insert(affiliates).values({
      name: 'Test Affiliate',
      description: 'A test affiliate for seeding purposes.',
      category: 'Academic',
      status: 'Active',
      advisorId: 'prof-001',
      committeeMembers: JSON.stringify([user.id]),
    }).returning())[0];
    console.log('Seeded 1 affiliate.');
  }

  let debateSociety = await db.query.affiliates.findFirst({ where: eq(affiliates.name, 'Debate Society') });
  if (!debateSociety) {
    debateSociety = (await db.insert(affiliates).values({
      name: 'Debate Society',
      description: 'A club for debating.',
      category: 'Academic',
      status: 'Active',
      advisorId: 'prof-002',
      committeeMembers: JSON.stringify([user.id]),
    }).returning())[0];
    console.log('Seeded 1 affiliate.');
  }

  let photographyClub = await db.query.affiliates.findFirst({ where: eq(affiliates.name, 'Photography Club') });
  if (!photographyClub) {
    photographyClub = (await db.insert(affiliates).values({
      name: 'Photography Club',
      description: 'A club for photography enthusiasts.',
      category: 'Special Interest',
      status: 'Active',
      advisorId: 'prof-003',
      committeeMembers: JSON.stringify([user.id]),
    }).returning())[0];
    console.log('Seeded 1 affiliate.');
  }

  await db.update(users).set({ affiliates: JSON.stringify([affiliate.id, debateSociety.id, photographyClub.id]) }).where(eq(users.id, user.id));
  console.log('Updated test user with affiliates.');

  // Seed sap
  const sapEntry = await db.insert(sap).values({
    affiliateId: affiliate.id,
    activityName: 'Test SAP Activity',
    date: new Date(),
    description: 'A test SAP entry.',
    status: 'Approved',
    submittedBy: user.id,
  }).onConflictDoNothing().returning();
  if (sapEntry.length > 0) {
    console.log(`Seeded ${sapEntry.length} sap entries.`);
  }

  // Seed asf
  const asfEntry = await db.insert(asf).values({
    affiliateId: affiliate.id,
    activityName: 'Test ASF Activity',
    date: new Date(),
    description: 'A test ASF entry.',
    status: 'Approved',
    submittedBy: user.id,
  }).onConflictDoNothing().returning();
  if (asfEntry.length > 0) {
    console.log(`Seeded ${asfEntry.length} asf entries.`);
  }

  // Seed submissions
  if (sapEntry.length > 0) {
    const submission = await db.insert(submissions).values({
      submittedBy: user.id,
      formType: 'SAP',
      formId: sapEntry[0].id,
    }).onConflictDoNothing().returning();
    if (submission.length > 0) {
      console.log(`Seeded ${submission.length} submissions.`);
    }
  }

  // Seed activity logs
  if (sapEntry.length > 0) {
    const log = await db.insert(activityLogs).values({
      userId: user.id,
      action: 'Submitted SAP',
      relatedFormId: sapEntry[0].id,
      formType: 'sap',
      oldStatus: 'Pending Validation',
      newStatus: 'Approved',
    }).onConflictDoNothing().returning();
    if (log.length > 0) {
      console.log(`Seeded ${log.length} activity logs.`);
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});