import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPIQuery() {
  try {
    console.log('🔍 Testing API Query Logic (as Super Admin)...\n');

    // Simulate Super Admin query (no role-based filters)
    const includeArchived = undefined; // Default behavior
    const search = undefined;
    const status = undefined;
    
    const where: any = {};

    // Archive filter - same as in controller
    if (includeArchived === 'archived') {
      where.isArchived = true;
    } else if (includeArchived !== 'true') {
      where.isArchived = { not: true };
    }

    // No role-based filtering for Super Admin

    // Additional filters
    if (status) where.status = status;
    
    // Handle search
    if (search) {
      const searchOR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
      
      if (Object.keys(where).length > 1 || (where.OR && where.OR.length > 0)) {
        const otherConditions = { ...where };
        delete otherConditions.OR;
        
        where.AND = [];
        if (Object.keys(otherConditions).length > 0) {
          where.AND.push(otherConditions);
        }
        where.AND.push({ OR: searchOR });
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    const finalWhere = where;

    console.log('Query where clause:', JSON.stringify(finalWhere, null, 2));
    console.log('');

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: finalWhere,
        take: 10,
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.count({ where: finalWhere }),
    ]);

    console.log(`✅ Query successful!`);
    console.log(`   Total projects: ${total}`);
    console.log(`   Returned: ${projects.length} projects\n`);
    
    if (projects.length > 0) {
      console.log('Sample projects:');
      projects.slice(0, 3).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.code} - ${p.name}`);
        console.log(`      Customer: ${p.customer?.name || 'None'}`);
        console.log(`      Manager: ${p.manager ? `${p.manager.firstName} ${p.manager.lastName}` : 'None'}`);
        console.log(`      Status: ${p.status}`);
        console.log('');
      });
    }

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

testAPIQuery();

