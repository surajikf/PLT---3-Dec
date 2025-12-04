import { PrismaClient, UserRole, ProjectStatus, TimesheetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Indian names for customers
const indianCustomerNames = [
  { name: 'Tata Motors Limited', contactPerson: 'Rajesh Kumar', email: 'rajesh.kumar@tatamotors.com', industry: 'Automotive' },
  { name: 'Reliance Industries', contactPerson: 'Priya Sharma', email: 'priya.sharma@reliance.com', industry: 'Conglomerate' },
  { name: 'Infosys Technologies', contactPerson: 'Amit Patel', email: 'amit.patel@infosys.com', industry: 'IT Services' },
  { name: 'Wipro Limited', contactPerson: 'Sneha Reddy', email: 'sneha.reddy@wipro.com', industry: 'IT Services' },
  { name: 'HDFC Bank', contactPerson: 'Vikram Singh', email: 'vikram.singh@hdfcbank.com', industry: 'Banking' },
  { name: 'ICICI Bank', contactPerson: 'Anjali Desai', email: 'anjali.desai@icicibank.com', industry: 'Banking' },
  { name: 'Mahindra & Mahindra', contactPerson: 'Rahul Mehta', email: 'rahul.mehta@mahindra.com', industry: 'Automotive' },
  { name: 'Bajaj Auto', contactPerson: 'Kavita Joshi', email: 'kavita.joshi@bajajauto.com', industry: 'Automotive' },
  { name: 'Maruti Suzuki', contactPerson: 'Arjun Verma', email: 'arjun.verma@maruti.com', industry: 'Automotive' },
  { name: 'Tech Mahindra', contactPerson: 'Divya Nair', email: 'divya.nair@techmahindra.com', industry: 'IT Services' },
  { name: 'Larsen & Toubro', contactPerson: 'Suresh Iyer', email: 'suresh.iyer@lnt.com', industry: 'Engineering' },
  { name: 'Adani Group', contactPerson: 'Meera Krishnan', email: 'meera.krishnan@adani.com', industry: 'Infrastructure' },
  { name: 'JSW Steel', contactPerson: 'Nikhil Agarwal', email: 'nikhil.agarwal@jsw.in', industry: 'Steel' },
  { name: 'Bharti Airtel', contactPerson: 'Rohit Malhotra', email: 'rohit.malhotra@airtel.com', industry: 'Telecommunications' },
  { name: 'HCL Technologies', contactPerson: 'Shruti Gupta', email: 'shruti.gupta@hcl.com', industry: 'IT Services' },
];

// Project names and codes
const projectTemplates = [
  { code: 'DC', name: 'DP Control', baseBudget: 300000 },
  { code: 'AD', name: 'ADV', baseBudget: 500000 },
  { code: 'FM102', name: 'FORCE MOTORS | 18-02-2025', baseBudget: 500000 },
  { code: 'AX', name: 'Axxela', baseBudget: 380000 },
  { code: 'CLWT', name: 'CLWT', baseBudget: 350000 },
  { code: 'BAUM', name: 'Baumer', baseBudget: 260000 },
  { code: 'DB', name: 'Diamond BP', baseBudget: 75000 },
  { code: 'EN', name: 'EngineTech Systems', baseBudget: 420000 },
  { code: 'ES', name: 'EcoSolutions', baseBudget: 280000 },
  { code: 'B02', name: 'Project B02', baseBudget: 320000 },
  { code: 'GEGNER', name: 'Gegner Solutions', baseBudget: 150000 },
  { code: 'CATICE', name: 'Catice Technologies', baseBudget: 180000 },
  { code: 'TEDRA', name: 'Tedra Automotive Solutions', baseBudget: 450000 },
  { code: 'IKF01', name: 'IKF Internal Project 01', baseBudget: 200000 },
  { code: 'IKF02', name: 'IKF Internal Project 02', baseBudget: 250000 },
];

// Task descriptions
const taskDescriptions = [
  'Frontend Development - React Components',
  'Backend API Development - Node.js',
  'Database Design and Implementation',
  'UI/UX Design and Prototyping',
  'Testing and Quality Assurance',
  'Code Review and Refactoring',
  'Documentation and Technical Writing',
  'Bug Fixing and Debugging',
  'Performance Optimization',
  'Integration with Third-party Services',
  'Mobile App Development',
  'DevOps and Deployment',
  'Security Implementation',
  'Data Migration',
  'Feature Development',
];

// Get random date in the past year
function getRandomDateInPastYear(): Date {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  const timeDiff = today.getTime() - oneYearAgo.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(oneYearAgo.getTime() + randomTime);
}

// Get random date between start and end
function getRandomDateBetween(start: Date, end: Date): Date {
  const timeDiff = end.getTime() - start.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(start.getTime() + randomTime);
}

async function main() {
  console.log('🌱 Starting comprehensive dummy data generation...');

  // Get existing users
  const users = await prisma.user.findMany({
    where: { role: { in: [UserRole.PROJECT_MANAGER, UserRole.TEAM_MEMBER] } },
  });

  if (users.length === 0) {
    console.log('❌ No users found. Please run seed script first.');
    return;
  }

  const managers = users.filter(u => u.role === UserRole.PROJECT_MANAGER);
  const teamMembers = users.filter(u => u.role === UserRole.TEAM_MEMBER);

  if (managers.length === 0 || teamMembers.length === 0) {
    console.log('❌ Need at least one Project Manager and Team Member. Please run seed script first.');
    return;
  }

  // Get departments
  const departments = await prisma.department.findMany();
  if (departments.length === 0) {
    console.log('❌ No departments found. Please run seed script first.');
    return;
  }

  // Get stages
  const stages = await prisma.stage.findMany();
  if (stages.length === 0) {
    console.log('❌ No stages found. Please run seed script first.');
    return;
  }

  // Create customers with Indian names
  console.log('📋 Creating customers with Indian names...');
  const customers = [];
  for (const customerData of indianCustomerNames) {
    // Check if customer already exists
    let customer = await prisma.customer.findFirst({
      where: { name: customerData.name },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: customerData.name,
          industry: customerData.industry,
          contactPerson: customerData.contactPerson,
          email: customerData.email,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          address: `${Math.floor(Math.random() * 999) + 1} Main Street, ${['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'][Math.floor(Math.random() * 7)]}, India`,
          status: 'ACTIVE',
        },
      });
    }
    customers.push(customer);
  }
  console.log(`✅ Created/Found ${customers.length} customers`);

  // Create projects with budgets
  console.log('📋 Creating projects with budgets...');
  const projects = [];
  const statuses: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
  
  for (const template of projectTemplates) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const budget = template.baseBudget + (Math.random() * 100000 - 50000); // Add variance
    const startDate = getRandomDateInPastYear();
    const endDate = status === 'COMPLETED' 
      ? getRandomDateBetween(startDate, new Date())
      : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days from start

    // Check if project exists
    let project = await prisma.project.findUnique({
      where: { code: template.code },
    });

    if (project) {
      // Update existing project
      project = await prisma.project.update({
        where: { code: template.code },
        data: {
          name: template.name,
          budget: Math.round(budget),
          status,
          startDate,
          endDate: status !== 'PLANNING' ? endDate : null,
          customerId: customers[Math.floor(Math.random() * customers.length)].id,
          managerId: managers[Math.floor(Math.random() * managers.length)].id,
          departmentId: departments[Math.floor(Math.random() * departments.length)].id,
        },
      });
    } else {
      // Create new project
      project = await prisma.project.create({
        data: {
          code: template.code,
          name: template.name,
          description: `Project ${template.name} - Comprehensive development project`,
          budget: Math.round(budget),
          status,
          startDate,
          endDate: status !== 'PLANNING' ? endDate : null,
          customerId: customers[Math.floor(Math.random() * customers.length)].id,
          managerId: managers[Math.floor(Math.random() * managers.length)].id,
          departmentId: departments[Math.floor(Math.random() * departments.length)].id,
          createdById: managers[0].id,
        },
      });
    }

    // Assign team members to project
    const numMembers = Math.floor(Math.random() * 3) + 1; // 1-3 members
    const selectedMembers = teamMembers
      .sort(() => Math.random() - 0.5)
      .slice(0, numMembers);

    for (const member of selectedMembers) {
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: member.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          userId: member.id,
        },
      });
    }

    // Assign stages to project
    for (const stage of stages) {
      await prisma.projectStage.upsert({
        where: {
          projectId_stageId: {
            projectId: project.id,
            stageId: stage.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          stageId: stage.id,
          weight: stage.defaultWeight,
          status: status === 'COMPLETED' ? 'CLOSED' : status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'OFF',
        },
      });
    }

    projects.push(project);
  }
  console.log(`✅ Created ${projects.length} projects with budgets`);

  // Create timesheets for the last year
  console.log('📋 Creating timesheets for the last year...');
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  let timesheetCount = 0;
  const allTeamMembers = [...teamMembers, ...managers.filter(m => m.hourlyRate && m.hourlyRate > 0)];
  const targetTimesheets = 1500; // Target number of timesheets
  
  // Generate timesheets more densely
  for (let i = 0; i < 365; i++) {
    const date = new Date(oneYearAgo);
    date.setDate(date.getDate() + i);

    // Skip future dates
    if (date > today) continue;

    // Skip weekends (30% chance of skipping weekends - more weekend work)
    if (date.getDay() === 0 || date.getDay() === 6) {
      if (Math.random() > 0.7) continue;
    }

    // Each day, 95% chance of having timesheet entries
    if (Math.random() > 0.05) {
      // 4-10 timesheet entries per day (more entries for better data)
      const numEntries = Math.floor(Math.random() * 7) + 4;

      for (let j = 0; j < numEntries; j++) {
        const user = allTeamMembers[Math.floor(Math.random() * allTeamMembers.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        
        // Only create timesheets for projects that have started
        if (project.startDate && date < project.startDate) continue;
        if (project.endDate && date > project.endDate && project.status !== 'COMPLETED') continue;

        const hours = Math.random() * 6 + 2; // 2-8 hours
        const taskDescription = taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)];
        const description = `${taskDescription}\nTask: ${taskDescription}\nComplete Status: ${Math.random() > 0.3 ? 'Yes' : 'No'}`;

        // 80% approved, 15% submitted, 5% draft
        let status: TimesheetStatus = 'DRAFT';
        const statusRand = Math.random();
        if (statusRand > 0.2) {
          status = 'APPROVED';
        } else if (statusRand > 0.05) {
          status = 'SUBMITTED';
        }

        const timesheet = await prisma.timesheet.create({
          data: {
            userId: user.id,
            projectId: project.id,
            date,
            hours: Math.round(hours * 100) / 100, // Round to 2 decimals
            description,
            status,
            approvedAt: status === 'APPROVED' ? getRandomDateBetween(date, today) : null,
            approvedById: status === 'APPROVED' ? managers[0].id : null,
          },
        });

        timesheetCount++;
        
        // Stop if we've reached target
        if (timesheetCount >= targetTimesheets) break;
      }
      
      // Stop if we've reached target
      if (timesheetCount >= targetTimesheets) break;
    }
  }

  console.log(`✅ Created ${timesheetCount} timesheets for the last year`);

  // Create some additional departments
  console.log('📋 Creating additional departments...');
  const additionalDepartments = [
    'Design',
    'Quality Assurance',
    'DevOps',
    'Marketing',
    'Sales',
  ];

  for (const deptName of additionalDepartments) {
    await prisma.department.upsert({
      where: { name: deptName },
      update: {},
      create: {
        name: deptName,
        headId: managers[Math.floor(Math.random() * managers.length)].id,
        createdById: managers[0].id,
      },
    });
  }
  console.log(`✅ Created additional departments`);

  console.log('\n✅ Comprehensive dummy data generation completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Projects: ${projects.length}`);
  console.log(`   - Timesheets: ${timesheetCount}`);
  console.log(`   - Additional Departments: ${additionalDepartments.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error generating dummy data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

