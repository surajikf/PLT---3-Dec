import { PrismaClient, ProjectStatus, StageStatus, TimesheetStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting demo data generation...');
  console.log('   This will add realistic data for a great demo experience!\n');

  // Get existing data
  const users = await prisma.user.findMany({
    where: { isActive: true },
    include: { department: true },
  });

  const projects = await prisma.project.findMany({
    include: { manager: true },
  });

  const stages = await prisma.stage.findMany({
    where: { isActive: true },
    orderBy: { defaultWeight: 'desc' },
  });

  const customers = await prisma.customer.findMany();

  if (projects.length === 0) {
    console.log('   ⚠️  No projects found. Please import projects first.');
    return;
  }

  if (users.length === 0) {
    console.log('   ⚠️  No users found. Please import employees first.');
    return;
  }

  // ============================================
  // 1. CREATE ADDITIONAL CUSTOMERS
  // ============================================
  console.log('[1/8] Creating additional customers...');
  const customerNames = [
    'Godrej Industries',
    'Baumer Group',
    'Axxela Limited',
    'Gensol Engineering',
    'Force Motors',
    'Kalyani Technoforge',
    'Al Salem Trading',
    'Diamond Healthcare',
    'Study Smart Academy',
    'Avant-Garde Solutions',
  ];

  const createdCustomers = [];
  for (const name of customerNames) {
    const existing = customers.find(c => c.name.includes(name.split(' ')[0]));
    if (!existing) {
      const customer = await prisma.customer.create({
        data: {
          name,
          industry: ['Manufacturing', 'Technology', 'Healthcare', 'Education', 'Trading'][Math.floor(Math.random() * 5)],
          contactPerson: `Contact ${name.split(' ')[0]}`,
          email: `contact@${name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          status: 'ACTIVE',
        },
      });
      createdCustomers.push(customer);
    }
  }
  console.log(`   ✅ Created ${createdCustomers.length} customers\n`);

  // ============================================
  // 2. ASSIGN CUSTOMERS TO PROJECTS
  // ============================================
  console.log('[2/8] Assigning customers to projects...');
  let customerAssignments = 0;
  for (const project of projects.slice(0, 30)) {
    const projectName = project.name.toLowerCase();
    let customerId = null;

    // Match projects to customers by name
    if (projectName.includes('godrej')) {
      customerId = customers.find(c => c.name.includes('Godrej'))?.id || createdCustomers.find(c => c.name.includes('Godrej'))?.id;
    } else if (projectName.includes('baumer')) {
      customerId = customers.find(c => c.name.includes('Baumer'))?.id || createdCustomers.find(c => c.name.includes('Baumer'))?.id;
    } else if (projectName.includes('axxela')) {
      customerId = customers.find(c => c.name.includes('Axxela'))?.id || createdCustomers.find(c => c.name.includes('Axxela'))?.id;
    } else if (projectName.includes('gensol')) {
      customerId = customers.find(c => c.name.includes('Gensol'))?.id || createdCustomers.find(c => c.name.includes('Gensol'))?.id;
    } else if (projectName.includes('force')) {
      customerId = customers.find(c => c.name.includes('Force'))?.id || createdCustomers.find(c => c.name.includes('Force'))?.id;
    } else if (projectName.includes('kalyani') || projectName.includes('kal')) {
      customerId = customers.find(c => c.name.includes('Kalyani'))?.id || createdCustomers.find(c => c.name.includes('Kalyani'))?.id;
    } else if (projectName.includes('diamond')) {
      customerId = customers.find(c => c.name.includes('Diamond'))?.id || createdCustomers.find(c => c.name.includes('Diamond'))?.id;
    } else if (projectName.includes('study smart') || projectName.includes('study')) {
      customerId = customers.find(c => c.name.includes('Study'))?.id || createdCustomers.find(c => c.name.includes('Study'))?.id;
    } else if (projectName.includes('avant')) {
      customerId = customers.find(c => c.name.includes('Avant'))?.id || createdCustomers.find(c => c.name.includes('Avant'))?.id;
    }

    if (customerId) {
      await prisma.project.update({
        where: { id: project.id },
        data: { customerId },
      });
      customerAssignments++;
    } else if (Math.random() > 0.5) {
      // Randomly assign other customers
      const allCustomers = [...customers, ...createdCustomers];
      if (allCustomers.length > 0) {
        const randomCustomer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
        await prisma.project.update({
          where: { id: project.id },
          data: { customerId: randomCustomer.id },
        });
        customerAssignments++;
      }
    }
  }
  console.log(`   ✅ Assigned customers to ${customerAssignments} projects\n`);

  // ============================================
  // 3. SET PROJECT BUDGETS AND DATES
  // ============================================
  console.log('[3/8] Setting project budgets and dates...');
  let budgetUpdates = 0;
  const now = new Date();

  for (const project of projects.slice(0, 40)) {
    // Set realistic budgets (50k to 500k)
    const budget = Math.floor(Math.random() * 450000) + 50000;

    // Set start dates (randomly in the past 6 months)
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));

    // Set end dates (3-12 months from start)
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 9) + 3);

    // Update project status based on dates
    let status = ProjectStatus.IN_PROGRESS;
    if (endDate < now && Math.random() > 0.7) {
      status = ProjectStatus.COMPLETED;
    } else if (Math.random() > 0.8) {
      status = ProjectStatus.ON_HOLD;
    }

    await prisma.project.update({
      where: { id: project.id },
      data: {
        budget,
        startDate,
        endDate,
        status,
      },
    });
    budgetUpdates++;
  }
  console.log(`   ✅ Updated budgets and dates for ${budgetUpdates} projects\n`);

  // ============================================
  // 4. ASSIGN TEAM MEMBERS TO PROJECTS
  // ============================================
  console.log('[4/8] Assigning team members to projects...');
  let memberAssignments = 0;
  const teamMembers = users.filter(u => 
    ['TEAM_MEMBER', 'PROJECT_MANAGER'].includes(u.role) && u.isActive
  );

  for (const project of projects.slice(0, 30)) {
    // Assign 2-5 team members per project
    const numMembers = Math.floor(Math.random() * 4) + 2;
    const selectedMembers = [];
    const availableMembers = [...teamMembers].filter(m => 
      m.id !== project.managerId
    );

    for (let i = 0; i < numMembers && availableMembers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableMembers.length);
      const member = availableMembers.splice(randomIndex, 1)[0];
      selectedMembers.push(member);
    }

    // Remove existing members
    await prisma.projectMember.deleteMany({
      where: { projectId: project.id },
    });

    // Add new members
    for (const member of selectedMembers) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: member.id,
        },
      });
      memberAssignments++;
    }
  }
  console.log(`   ✅ Assigned ${memberAssignments} team members to projects\n`);

  // ============================================
  // 5. UPDATE PROJECT STAGES WITH PROGRESS
  // ============================================
  console.log('[5/8] Updating project stages with progress...');
  let stageUpdates = 0;

  for (const project of projects.slice(0, 25)) {
    const projectStages = await prisma.projectStage.findMany({
      where: { projectId: project.id },
      include: { stage: true },
      orderBy: { stage: { defaultWeight: 'desc' } },
    });

    let totalProgress = 0;
    for (let i = 0; i < projectStages.length; i++) {
      const stage = projectStages[i];
      let status: StageStatus = StageStatus.OFF;
      
      // Progress through stages sequentially
      if (i === 0 && Math.random() > 0.2) {
        status = StageStatus.CLOSED;
        totalProgress += stage.weight;
      } else if (i === 1 && totalProgress > 0 && Math.random() > 0.3) {
        status = Math.random() > 0.5 ? StageStatus.CLOSED : StageStatus.IN_PROGRESS;
        if (status === StageStatus.CLOSED) {
          totalProgress += stage.weight;
        } else {
          totalProgress += stage.weight * 0.5;
        }
      } else if (i === 2 && totalProgress > 20 && Math.random() > 0.4) {
        status = Math.random() > 0.6 ? StageStatus.CLOSED : StageStatus.IN_PROGRESS;
        if (status === StageStatus.CLOSED) {
          totalProgress += stage.weight;
        } else {
          totalProgress += stage.weight * 0.6;
        }
      } else if (i === 3 && totalProgress > 50 && Math.random() > 0.5) {
        status = Math.random() > 0.7 ? StageStatus.CLOSED : StageStatus.IN_PROGRESS;
        if (status === StageStatus.CLOSED) {
          totalProgress += stage.weight;
        }
      }

      await prisma.projectStage.update({
        where: { id: stage.id },
        data: {
          status,
          completedDate: status === StageStatus.CLOSED ? new Date() : null,
        },
      });
      stageUpdates++;
    }

    // Update project health score
    const healthScore = Math.min(100, Math.max(0, Math.floor(60 + Math.random() * 40)));
    await prisma.project.update({
      where: { id: project.id },
      data: { healthScore },
    });
  }
  console.log(`   ✅ Updated ${stageUpdates} project stages\n`);

  // ============================================
  // 6. CREATE TIMESHEETS
  // ============================================
  console.log('[6/8] Creating timesheet entries...');
  let timesheetsCreated = 0;
  const activeProjects = projects.slice(0, 30);

  // Get project members
  const projectMembersMap = new Map<string, string[]>();
  for (const project of activeProjects) {
    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      select: { userId: true },
    });
    projectMembersMap.set(project.id, [
      ...members.map(m => m.userId),
      ...(project.managerId ? [project.managerId] : []),
    ]);
  }

  // Create timesheets for the last 90 days
  for (let day = 0; day < 90; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);

    // Skip weekends (50% chance)
    if (date.getDay() === 0 || date.getDay() === 6) {
      if (Math.random() > 0.3) continue;
    }

    // Create 5-15 timesheet entries per day
    const numEntries = Math.floor(Math.random() * 11) + 5;

    for (let i = 0; i < numEntries; i++) {
      const randomProject = activeProjects[Math.floor(Math.random() * activeProjects.length)];
      const members = projectMembersMap.get(randomProject.id) || [];
      
      if (members.length === 0) continue;

      const randomUserId = members[Math.floor(Math.random() * members.length)];
      const user = users.find(u => u.id === randomUserId);
      
      if (!user || !user.isActive) continue;

      // Hours: 1-8 hours per day
      const hours = Math.round((Math.random() * 7 + 1) * 2) / 2; // 0.5 hour increments

      // Status: 70% approved, 20% submitted, 10% draft
      let status: TimesheetStatus = TimesheetStatus.APPROVED;
      const rand = Math.random();
      if (rand > 0.7 && rand <= 0.9) {
        status = TimesheetStatus.SUBMITTED;
      } else if (rand > 0.9) {
        status = TimesheetStatus.DRAFT;
      }

      const descriptions = [
        'Development work',
        'Code review',
        'Bug fixes',
        'Feature implementation',
        'Testing',
        'Design work',
        'Client meeting',
        'Documentation',
        'Research and analysis',
        'Deployment',
      ];

      const timesheet = await prisma.timesheet.create({
        data: {
          userId: randomUserId,
          projectId: randomProject.id,
          date,
          hours,
          description: descriptions[Math.floor(Math.random() * descriptions.length)],
          status,
          approvedById: status === TimesheetStatus.APPROVED && randomProject.managerId ? randomProject.managerId : null,
          approvedAt: status === TimesheetStatus.APPROVED && randomProject.managerId ? new Date() : null,
        },
      });

      timesheetsCreated++;

      // Limit total timesheets
      if (timesheetsCreated >= 500) break;
    }

    if (timesheetsCreated >= 500) break;
  }
  console.log(`   ✅ Created ${timesheetsCreated} timesheet entries\n`);

  // ============================================
  // 7. CREATE PROJECT RESOURCES
  // ============================================
  console.log('[7/8] Creating project resources...');
  let resourcesCreated = 0;
  const resourceTypes = [
    'Design Assets',
    'Sitemap Documents',
    'Development Handoff Files',
    'Content Folders',
    'QA Checklists',
    'Templates',
    'Libraries',
  ];

  for (const project of projects.slice(0, 20)) {
    // Create 2-4 resources per project
    const numResources = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numResources; i++) {
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const resourceNames = [
        `${resourceType} - Main`,
        `${resourceType} - Backup`,
        `Project ${resourceType}`,
        `${project.name} ${resourceType}`,
        `Resource ${i + 1}`,
      ];

      const adminUser = users.find(u => ['SUPER_ADMIN', 'ADMIN'].includes(u.role));
      
      await prisma.resource.create({
        data: {
          name: resourceNames[Math.floor(Math.random() * resourceNames.length)],
          description: `${resourceType} for ${project.name}`,
          type: resourceType,
          projectId: project.id,
          url: `https://drive.google.com/drive/folders/${Math.random().toString(36).substring(7)}`,
          accessLevel: 'Team',
          createdById: adminUser?.id || users[0].id,
        },
      });
      resourcesCreated++;
    }
  }
  console.log(`   ✅ Created ${resourcesCreated} project resources\n`);

  // ============================================
  // 8. CREATE ADDITIONAL DEPARTMENTS
  // ============================================
  console.log('[8/8] Creating additional departments...');
  const departmentNames = [
    'Design',
    'Sales & Marketing',
    'HR',
    'SEO/PPC',
    'Quality Assurance',
  ];

  let departmentsCreated = 0;
  const adminUser = users.find(u => u.role === 'ADMIN') || users[0];

  for (const deptName of departmentNames) {
    const existing = await prisma.department.findUnique({
      where: { name: deptName },
    });

    if (!existing) {
      // Assign a head from users with matching roles
      let headId = null;
      if (deptName === 'Design') {
        const head = users.find(u => u.firstName === 'Sagar' || u.firstName === 'Vishal');
        headId = head?.id || null;
      } else if (deptName === 'Sales & Marketing') {
        const head = users.find(u => u.firstName === 'Neha');
        headId = head?.id || null;
      }

      await prisma.department.create({
        data: {
          name: deptName,
          headId,
          createdById: adminUser.id,
        },
      });
      departmentsCreated++;
    }
  }
  console.log(`   ✅ Created ${departmentsCreated} departments\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎉 Demo Data Generation Complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   ✅ Customers: ${createdCustomers.length} created`);
  console.log(`   ✅ Customer Assignments: ${customerAssignments} projects`);
  console.log(`   ✅ Budget Updates: ${budgetUpdates} projects`);
  console.log(`   ✅ Team Assignments: ${memberAssignments} assignments`);
  console.log(`   ✅ Stage Updates: ${stageUpdates} stages`);
  console.log(`   ✅ Timesheets: ${timesheetsCreated} entries`);
  console.log(`   ✅ Resources: ${resourcesCreated} resources`);
  console.log(`   ✅ Departments: ${departmentsCreated} created`);
  console.log('');
  console.log('🚀 Your application is now ready for an impressive demo!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Demo data generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

