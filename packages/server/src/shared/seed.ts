import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../../../../db/index';
import { users } from '../../../../db/schema/index';
import { logger } from './logger';

export async function runSeed(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@vansh.app';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';

  const existing = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (existing) {
    logger.info({ email: adminEmail }, 'Admin user already exists');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.insert(users).values({
    email: adminEmail,
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    verificationStatus: 'verified',
  });
  logger.info({ email: adminEmail }, 'Admin user seeded');
}
