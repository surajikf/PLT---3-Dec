import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Role distribution for consistency
const roleDistribution = {
  SUPER_ADMIN: 0.02, // 2% - Very few super admins
  ADMIN: 0.08, // 8% - Some admins
  PROJECT_MANAGER: 0.15, // 15% - Project managers
  TEAM_MEMBER: 0.70, // 70% - Most are team members
  CLIENT: 0.05, // 5% - Some clients
};

async function main() {
  console.log('🔧 Assigning roles to users...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠️  No users found in database.');
      return;
    }

    // Count users by role
    const usersByRole = users.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('📋 Current role distribution:');
    Object.entries(usersByRole).forEach(([role, count]) => {
      const percentage = ((count as number / users.length) * 100).toFixed(1);
      console.log(`   ${role}: ${count} (${percentage}%)`);
    });

    // Assign roles only to users who don't have roles (preserve existing roles)
    let updated = 0;
    let skipped = 0;

    // Calculate target counts for new assignments
    const targetCounts: any = {};
    Object.entries(roleDistribution).forEach(([role, percentage]) => {
      targetCounts[role] = Math.round(users.length * percentage);
    });

    // Track current counts
    const currentCounts: any = {
      SUPER_ADMIN: usersByRole.SUPER_ADMIN || 0,
      ADMIN: usersByRole.ADMIN || 0,
      PROJECT_MANAGER: usersByRole.PROJECT_MANAGER || 0,
      TEAM_MEMBER: usersByRole.TEAM_MEMBER || 0,
      CLIENT: usersByRole.CLIENT || 0,
    };

    // Assign roles only to users without roles
    for (const user of users) {
      // Skip if user already has a valid role (preserve existing roles)
      if (user.role && ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER', 'CLIENT'].includes(user.role)) {
        skipped++;
        continue;
      }

      // Determine which role to assign (default to TEAM_MEMBER)
      let newRole = 'TEAM_MEMBER';
      
      // Try to assign based on distribution, but prefer TEAM_MEMBER for unassigned users
      for (const [role, target] of Object.entries(targetCounts)) {
        if (currentCounts[role] < target && role !== 'TEAM_MEMBER') {
          newRole = role;
          break;
        }
      }

      // Update user role
      await prisma.user.update({
        where: { id: user.id },
        data: { role: newRole as any },
      });

      currentCounts[newRole] = (currentCounts[newRole] || 0) + 1;
      updated++;
      console.log(`   ✓ ${user.firstName} ${user.lastName}: ${user.role || 'None'} → ${newRole}`);
    }

    console.log(`\n✅ Role assignment complete!`);
    console.log(`   Updated: ${updated} users`);
    console.log(`   Skipped: ${skipped} users`);

    // Show final distribution
    const finalUsers = await prisma.user.findMany();
    const finalDistribution = finalUsers.reduce((acc: any, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Final role distribution:');
    Object.entries(finalDistribution).forEach(([role, count]) => {
      const percentage = ((count as number / finalUsers.length) * 100).toFixed(1);
      console.log(`   ${role}: ${count} (${percentage}%)`);
    });

  } catch (error: any) {
    console.error('\n❌ Error assigning roles!');
    console.error(`   Error: ${error.message}`);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

