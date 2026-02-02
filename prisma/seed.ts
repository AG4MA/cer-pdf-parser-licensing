import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await hashPassword('admin123'),
        name: 'Admin',
        role: 'admin',
      },
    });
    console.log('✅ Admin user created (admin@example.com / admin123)');
  } else {
    console.log('ℹ️ Admin user already exists');
  }

  // Create demo application
  const existingApp = await prisma.application.findUnique({
    where: { slug: 'cer-pdf-parser' },
  });

  if (!existingApp) {
    await prisma.application.create({
      data: {
        name: 'CER PDF Parser',
        slug: 'cer-pdf-parser',
        description: 'Parser per documenti PDF CER',
        isActive: true,
      },
    });
    console.log('✅ Demo application created');
  } else {
    console.log('ℹ️ Demo application already exists');
  }

  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
