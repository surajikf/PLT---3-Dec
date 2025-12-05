import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking resources in database...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    const resources = await prisma.resource.findMany({
      take: 50,
      include: {
        project: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalResources = await prisma.resource.count();
    console.log(`📊 Total resources in database: ${totalResources}\n`);

    if (resources.length > 0) {
      console.log(`📋 Showing first ${resources.length} resources:\n`);
      resources.forEach((resource, idx) => {
        const projectName = resource.project ? `${resource.project.name} (${resource.project.code})` : 'No Project';
        console.log('────────────────────────────────────────────────────────────────────────────────────────────────────');
        console.log(`${idx + 1}. ${resource.name}`);
        console.log(`   ID: ${resource.id}`);
        console.log(`   Type: ${resource.type}`);
        console.log(`   Description: ${resource.description || 'N/A'}`);
        console.log(`   URL: ${resource.url || 'N/A'}`);
        console.log(`   Access Level: ${resource.accessLevel}`);
        console.log(`   Project: ${projectName}`);
        console.log(`   Created: ${resource.createdAt.toISOString()}`);
      });
      console.log('────────────────────────────────────────────────────────────────────────────────────────────────────\n');
    } else {
      console.log('   ⚠️  No resources found in database.');
      console.log('   💡 Run: npm run add-resources');
    }

    console.log('✅ Resource check complete!\n');

  } catch (error: any) {
    console.error('\n❌ Database operation failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Possible issues:');
    console.error('   1. Database not running');
    console.error('   2. DATABASE_URL not configured correctly');
    console.error('   3. Resources table does not exist');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

