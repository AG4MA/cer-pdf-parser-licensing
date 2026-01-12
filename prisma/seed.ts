import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_SEED_PASSWORD || 'changeme123';

  console.log('🌱 Seeding database...');

  // Create admin user
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const password_hash = await argon2.hash(password);
    await prisma.adminUser.create({
      data: {
        email,
        password_hash,
      },
    });
    console.log(`✅ Created admin user: ${email}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${email}`);
  }

  // Create demo license
  const demoLicenseKey = 'DEMO-' + nanoid(16).toUpperCase();
  const existingLicense = await prisma.license.findFirst({
    where: { label: 'Demo License' },
  });

  if (!existingLicense) {
    await prisma.license.create({
      data: {
        license_key: demoLicenseKey,
        label: 'Demo License',
        notes: 'This is a demo license created during seed.',
        enabled: true,
      },
    });
    console.log(`✅ Created demo license: ${demoLicenseKey}`);
  } else {
    console.log(`ℹ️  Demo license already exists: ${existingLicense.license_key}`);
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
