import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database connection and tables...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check if Timesheet table exists and has data
    console.log('📊 Checking Timesheet table...');
    try {
      const timesheetCount = await prisma.timesheet.count();
      console.log(`   ✅ Timesheet table exists`);
      console.log(`   📝 Total timesheets in database: ${timesheetCount}`);

      if (timesheetCount > 0) {
        const recentTimesheets = await prisma.timesheet.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            project: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        });

        console.log('\n   📋 Recent timesheets:');
        recentTimesheets.forEach((ts, idx) => {
          console.log(`   ${idx + 1}. ${ts.user.firstName} ${ts.user.lastName} - ${ts.project.name}`);
          console.log(`      Date: ${ts.date.toISOString().split('T')[0]}, Hours: ${ts.hours}, Status: ${ts.status}`);
        });
      } else {
        console.log('   ⚠️  No timesheets found in database');
      }
    } catch (error: any) {
      console.log(`   ❌ Error accessing Timesheet table: ${error.message}`);
      console.log('   ⚠️  Timesheet table may not exist. Run migrations!');
    }

    // Check other important tables
    console.log('\n📊 Checking other tables...');
    
    const tables = [
      { name: 'User', query: () => prisma.user.count() },
      { name: 'Project', query: () => prisma.project.count() },
      { name: 'Task', query: () => prisma.task.count() },
      { name: 'Customer', query: () => prisma.customer.count() },
      { name: 'Department', query: () => prisma.department.count() },
      { name: 'Stage', query: () => prisma.stage.count() },
    ];

    for (const table of tables) {
      try {
        const count = await table.query();
        console.log(`   ✅ ${table.name}: ${count} records`);
      } catch (error: any) {
        console.log(`   ❌ ${table.name}: Error - ${error.message}`);
      }
    }

    console.log('\n✅ Database check complete!');

  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error(`   Error: ${error.message}`);
    console.error('\n💡 Possible issues:');
    console.error('   1. Database not running');
    console.error('   2. DATABASE_URL not configured correctly');
    console.error('   3. Database does not exist');
    console.error('   4. Migrations not run');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

