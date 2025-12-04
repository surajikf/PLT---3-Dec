import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProjectsQuery() {
  try {
    console.log('🔍 Testing Projects Query...\n');

    // Test 1: Check database connection
    console.log('[1/5] Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected\n');

    // Test 2: Check if projects table exists and has data
    console.log('[2/5] Checking projects in database...');
    const allProjects = await prisma.project.findMany({
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        isArchived: true,
        status: true,
      },
    });
    console.log(`   ✅ Found ${allProjects.length} projects (showing first 5):`);
    allProjects.forEach((p, i) => {
      console.log(`      ${i + 1}. ${p.code} - ${p.name} (Archived: ${p.isArchived}, Status: ${p.status})`);
    });
    console.log('');

    // Test 3: Count total projects
    console.log('[3/5] Counting total projects...');
    const totalCount = await prisma.project.count();
    const archivedCount = await prisma.project.count({ where: { isArchived: true } });
    const activeCount = await prisma.project.count({ 
      where: { 
        isArchived: { not: true },
      },
    });
    console.log(`   ✅ Total: ${totalCount}, Active: ${activeCount}, Archived: ${archivedCount}\n`);

    // Test 4: Test the actual query used by the API
    console.log('[4/5] Testing API query (default - exclude archived)...');
    const where: any = {
      isArchived: { not: true },
    };
    const testProjects = await prisma.project.findMany({
      where,
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        isArchived: true,
      },
    });
    console.log(`   ✅ Query returned ${testProjects.length} projects\n`);

    // Test 5: Test with include relations
    console.log('[5/5] Testing query with relations (as used in API)...');
    const projectsWithRelations = await prisma.project.findMany({
      where: {
        isArchived: { not: true },
      },
      take: 3,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            members: true,
            timesheets: true,
          },
        },
      },
    });
    console.log(`   ✅ Query with relations returned ${projectsWithRelations.length} projects`);
    if (projectsWithRelations.length > 0) {
      console.log('   Sample project:');
      const sample = projectsWithRelations[0];
      console.log(`      - Code: ${sample.code}`);
      console.log(`      - Name: ${sample.name}`);
      console.log(`      - Customer: ${sample.customer?.name || 'None'}`);
      console.log(`      - Manager: ${sample.manager ? `${sample.manager.firstName} ${sample.manager.lastName}` : 'None'}`);
      console.log(`      - Members: ${sample._count.members}, Timesheets: ${sample._count.timesheets}`);
    }
    console.log('');

    console.log('✅ All tests passed!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsQuery();

