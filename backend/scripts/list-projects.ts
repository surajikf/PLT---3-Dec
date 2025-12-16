import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking projects in database...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    const projects = await prisma.project.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            timesheets: true,
            tasks: true,
          },
        },
      },
    });

    const totalCount = await prisma.project.count();

    console.log(`📊 Total projects in database: ${totalCount}\n`);

    if (projects.length === 0) {
      console.log('⚠️  No projects found in database.');
      console.log('💡 You may need to run seed scripts to add projects.');
      console.log('   Try: npm run add-dummy-data or npm run add-indian-demo\n');
    } else {
      console.log(`📋 Showing first ${projects.length} projects:\n`);
      console.log('─'.repeat(100));
      
      projects.forEach((project, idx) => {
        console.log(`\n${idx + 1}. ${project.name}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   Code: ${project.code}`);
        console.log(`   Status: ${project.status}`);
        console.log(`   Customer: ${project.customer?.name || 'N/A'}`);
        console.log(`   Manager: ${project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'N/A'}`);
        console.log(`   Department: ${project.department?.name || 'N/A'}`);
        console.log(`   Budget: $${project.budget.toLocaleString()}`);
        console.log(`   Members: ${project._count.members} | Timesheets: ${project._count.timesheets} | Tasks: ${project._count.tasks}`);
        console.log(`   URL: http://localhost:5173/projects/${project.id}`);
        console.log('─'.repeat(100));
      });

      console.log('\n✅ Project listing complete!');
      console.log('\n💡 To test the project details page:');
      console.log(`   Copy any project ID above and visit: http://localhost:5173/projects/{project-id}`);
      console.log(`   Example: http://localhost:5173/projects/${projects[0]?.id || 'your-project-id'}\n`);
    }

  } catch (error: any) {
    console.error('\n❌ Error checking projects!');
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




