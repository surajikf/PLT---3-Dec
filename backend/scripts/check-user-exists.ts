import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'rajeshjadhav@ikf.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (user) {
      console.log('✅ User found in database:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('❌ User NOT found in database');
      console.log('Email: rajeshjadhav@ikf.com');
    }

    // Also check all users with similar names
    const similarUsers = await prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: 'Rajesh', mode: 'insensitive' } },
          { lastName: { contains: 'Jadhav', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (similarUsers.length > 0) {
      console.log('\n📋 Similar users found:');
      similarUsers.forEach((u) => {
        console.log(`  - ${u.firstName} ${u.lastName} (${u.email}) - ${u.role} - ${u.isActive ? 'Active' : 'Inactive'}`);
      });
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();





