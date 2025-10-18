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

async function clear() {
  console.log('Clearing database...');

  await db.delete(activityLogs);
  await db.delete(submissions);
  await db.delete(asf);
  await db.delete(sap);
  await db.delete(affiliates);
  await db.delete(users);

  console.log('Database cleared.');
  process.exit(0);
}

clear().catch((err) => {
  console.error('Clearing failed:', err);
  process.exit(1);
});
