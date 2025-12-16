import { PrismaClient, UserRole, ProjectStatus, TimesheetStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Extended project templates
const projectTemplates = [
  { code: 'PRJ-2022-001', name: 'E-commerce Platform Development', baseBudget: 4500000 },
  { code: 'PRJ-2022-002', name: 'Mobile Banking Application', baseBudget: 3800000 },
  { code: 'PRJ-2022-003', name: 'Cloud Infrastructure Migration', baseBudget: 5200000 },
  { code: 'PRJ-2022-004', name: 'AI-Powered Analytics Dashboard', baseBudget: 4100000 },
  { code: 'PRJ-2022-005', name: 'Customer Relationship Management', baseBudget: 3600000 },
  { code: 'PRJ-2022-006', name: 'Supply Chain Management System', baseBudget: 4800000 },
  { code: 'PRJ-2022-007', name: 'IoT Device Management Platform', baseBudget: 4400000 },
  { code: 'PRJ-2022-008', name: 'Digital Marketing Automation', baseBudget: 3200000 },
  { code: 'PRJ-2022-009', name: 'Healthcare Management System', baseBudget: 5500000 },
  { code: 'PRJ-2022-010', name: 'Education Learning Platform', baseBudget: 3900000 },
  { code: 'PRJ-2023-001', name: 'Blockchain Payment Gateway', baseBudget: 4700000 },
  { code: 'PRJ-2023-002', name: 'Real-time Collaboration Tool', baseBudget: 4200000 },
  { code: 'PRJ-2023-003', name: 'Data Warehouse Implementation', baseBudget: 5100000 },
  { code: 'PRJ-2023-004', name: 'Cybersecurity Monitoring System', baseBudget: 4600000 },
  { code: 'PRJ-2023-005', name: 'Video Conferencing Platform', baseBudget: 4300000 },
  { code: 'PRJ-2023-006', name: 'Fleet Management System', baseBudget: 4000000 },
  { code: 'PRJ-2023-007', name: 'HR Management Portal', baseBudget: 3500000 },
  { code: 'PRJ-2023-008', name: 'Inventory Management System', baseBudget: 3700000 },
  { code: 'PRJ-2023-009', name: 'Social Media Analytics Tool', baseBudget: 3400000 },
  { code: 'PRJ-2023-010', name: 'Property Management Software', baseBudget: 3800000 },
  { code: 'PRJ-2024-001', name: 'Machine Learning Model Training', baseBudget: 4900000 },
  { code: 'PRJ-2024-002', name: 'API Gateway Development', baseBudget: 4100000 },
  { code: 'PRJ-2024-003', name: 'Microservices Architecture', baseBudget: 5400000 },
  { code: 'PRJ-2024-004', name: 'Progressive Web Application', baseBudget: 3600000 },
  { code: 'PRJ-2024-005', name: 'Content Management System', baseBudget: 3300000 },
  { code: 'PRJ-2024-006', name: 'E-learning Platform Enhancement', baseBudget: 4500000 },
  { code: 'PRJ-2024-007', name: 'Customer Support Chatbot', baseBudget: 3100000 },
  { code: 'PRJ-2024-008', name: 'Financial Planning Software', baseBudget: 4700000 },
  { code: 'PRJ-2024-009', name: 'Event Management System', baseBudget: 3900000 },
  { code: 'PRJ-2024-010', name: 'Document Management System', baseBudget: 4200000 },
  { code: 'PRJ-2024-011', name: 'Project Portfolio Management', baseBudget: 4800000 },
  { code: 'PRJ-2024-012', name: 'Business Intelligence Platform', baseBudget: 5100000 },
  { code: 'PRJ-2024-013', name: 'Workflow Automation Tool', baseBudget: 4400000 },
  { code: 'PRJ-2024-014', name: 'Customer Feedback System', baseBudget: 3500000 },
  { code: 'PRJ-2024-015', name: 'Vendor Management Portal', baseBudget: 4000000 },
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
  'API Integration',
  'Cloud Infrastructure Setup',
  'Microservices Architecture',
  'Payment Gateway Integration',
  'Analytics Implementation',
  'Database Optimization',
  'Load Testing',
  'User Acceptance Testing',
  'System Architecture Design',
  'Third-party API Integration',
];

// Get random element from array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Get random date in the last 3 years
function getRandomDateInLast3Years(): Date {
  const today = new Date();
  const threeYearsAgo = new Date(today);
  threeYearsAgo.setFullYear(today.getFullYear() - 3);
  
  const timeDiff = today.getTime() - threeYearsAgo.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(threeYearsAgo.getTime() + randomTime);
}

// Get random date between start and end
function getRandomDateBetween(start: Date, end: Date): Date {
  const timeDiff = end.getTime() - start.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(start.getTime() + randomTime);
}

// Get random date in a specific year
function getRandomDateInYear(year: number): Date {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31, 23, 59, 59);
  return getRandomDateBetween(start, end);
}

// Get random date in a specific month
function getRandomDateInMonth(year: number, month: number): Date {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  return getRandomDateBetween(start, end);
}

// Get random hours (0.5 to 12 hours, weighted towards 4-8 hours)
function getRandomHours(): number {
  const rand = Math.random();
  if (rand < 0.1) return Math.random() * 2 + 0.5; // 0.5-2.5 hours (10%)
  if (rand < 0.3) return Math.random() * 2 + 2.5; // 2.5-4.5 hours (20%)
  if (rand < 0.7) return Math.random() * 4 + 4; // 4-8 hours (40%)
  return Math.random() * 4 + 8; // 8-12 hours (30%)
}

// Get random amount based on hours and hourly rate
function getRandomAmount(hours: number, hourlyRate: number): number {
  // Add some variance (±10%)
  const variance = 1 + (Math.random() * 0.2 - 0.1);
  return Math.round(hours * hourlyRate * variance * 100) / 100;
}

async function main() {
  console.log('🚀 Starting Extensive Dummy Data Generation (Last 3 Years)...\n');

  try {
    // ============================================
    // 1. GET EXISTING DATA
    // ============================================
    console.log('[1/6] Fetching existing data...');
    
    const users = await prisma.user.findMany({
      where: {
        role: { in: [UserRole.TEAM_MEMBER, UserRole.PROJECT_MANAGER] },
        isActive: true,
      },
    });
    
    const customers = await prisma.customer.findMany({ where: { status: 'ACTIVE' } });
    const departments = await prisma.department.findMany();
    const projectManagers = await prisma.user.findMany({
      where: { role: UserRole.PROJECT_MANAGER, isActive: true },
    });
    const admins = await prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] }, isActive: true },
    });
    const stages = await prisma.stage.findMany({ where: { isActive: true } });

    if (users.length === 0 || customers.length === 0 || departments.length === 0) {
      console.error('❌ Error: Missing required data. Please run add-indian-demo-data.ts first.');
      return;
    }

    console.log(`   ✅ Found ${users.length} users, ${customers.length} customers, ${departments.length} departments\n`);

    // ============================================
    // 2. CREATE PROJECTS FOR LAST 3 YEARS
    // ============================================
    console.log('[2/6] Creating projects for last 3 years...');
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    const statuses: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
    const projects = [];

    for (const template of projectTemplates) {
      // Check if project already exists
      const existing = await prisma.project.findUnique({ where: { code: template.code } });
      if (existing) {
        projects.push(existing);
        continue;
      }

      // Determine year from project code
      const yearMatch = template.code.match(/\d{4}/);
      const projectYear = yearMatch ? parseInt(yearMatch[0]) : getRandomElement(years);
      
      // Random dates within the year
      const startDate = getRandomDateInYear(projectYear);
      const durationMonths = Math.floor(Math.random() * 18) + 6; // 6-24 months
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);
      
      // Ensure end date is not in the future
      const today = new Date();
      if (endDate > today) {
        endDate.setTime(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in last 30 days
      }

      const customer = getRandomElement(customers);
      const manager = getRandomElement(projectManagers);
      const department = getRandomElement(departments);
      const status = getRandomElement(statuses);
      const createdBy = getRandomElement(admins);
      
      // Budget with variance
      const budgetVariance = 0.7 + Math.random() * 0.6; // ±30%
      const budget = Math.round(template.baseBudget * budgetVariance);

      // Health score (0-100)
      const healthScore = status === 'COMPLETED' 
        ? Math.floor(Math.random() * 20) + 80 // 80-100 for completed
        : status === 'CANCELLED'
        ? Math.floor(Math.random() * 30) // 0-30 for cancelled
        : Math.floor(Math.random() * 60) + 40; // 40-100 for others

      const project = await prisma.project.create({
        data: {
          code: template.code,
          name: template.name,
          description: `Comprehensive development project for ${customer.name} - ${template.name}`,
          customerId: customer.id,
          managerId: manager.id,
          departmentId: department.id,
          status,
          budget,
          startDate,
          endDate: status === 'COMPLETED' ? endDate : null,
          healthScore,
          createdById: createdBy.id,
          isArchived: status === 'CANCELLED' ? Math.random() > 0.7 : false, // 30% of cancelled are archived
          archivedAt: status === 'CANCELLED' && Math.random() > 0.7 
            ? getRandomDateBetween(endDate, new Date())
            : null,
        },
      });
      projects.push(project);
    }
    console.log(`   ✅ Created/Found ${projects.length} projects\n`);

    // ============================================
    // 3. ASSIGN MEMBERS TO PROJECTS
    // ============================================
    console.log('[3/6] Assigning team members to projects...');
    let memberAssignments = 0;
    
    for (const project of projects) {
      const numMembers = Math.floor(Math.random() * 8) + 3; // 3-10 members per project
      const selectedMembers = users
        .filter(u => u.role === UserRole.TEAM_MEMBER)
        .sort(() => Math.random() - 0.5)
        .slice(0, numMembers);

      for (const member of selectedMembers) {
        const existing = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: project.id,
              userId: member.id,
            },
          },
        });
        
        if (!existing) {
          // Random assignment date (between project start and now)
          const assignedDate = project.startDate 
            ? getRandomDateBetween(project.startDate, new Date())
            : new Date();
          
          await prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: member.id,
              assignedAt: assignedDate,
            },
          });
          memberAssignments++;
        }
      }
    }
    console.log(`   ✅ Created ${memberAssignments} project member assignments\n`);

    // ============================================
    // 4. CREATE TASKS WITH RANDOM DATES
    // ============================================
    console.log('[4/6] Creating tasks with random dates...');
    let tasksCreated = 0;
    
    for (const project of projects) {
      const numTasks = Math.floor(Math.random() * 20) + 10; // 10-29 tasks per project
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        include: { user: true },
      });

      if (projectMembers.length === 0) continue;

      const projectStart = project.startDate || project.createdAt;
      const projectEnd = project.endDate || new Date();

      for (let i = 0; i < numTasks; i++) {
        const assignedTo = getRandomElement(projectMembers).user;
        const createdBy = getRandomElement([...admins, ...projectManagers]);
        const stage = getRandomElement(stages);
        
        // Task status based on project status
        let status: TaskStatus;
        if (project.status === 'COMPLETED') {
          status = getRandomElement(['DONE', 'DONE', 'DONE', 'IN_REVIEW']); // Mostly done
        } else if (project.status === 'CANCELLED') {
          status = getRandomElement(['TODO', 'BLOCKED', 'DONE']);
        } else if (project.status === 'ON_HOLD') {
          status = getRandomElement(['TODO', 'IN_PROGRESS', 'BLOCKED', 'BLOCKED']);
        } else {
          status = getRandomElement(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']);
        }
        
        const priority = getRandomElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]);
        
        // Random due date (between project start and end, or future)
        const dueDate = getRandomDateBetween(projectStart, projectEnd);
        if (Math.random() > 0.3) {
          // 70% chance due date is in the future
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 90) + 7);
          dueDate.setTime(futureDate.getTime());
        }

        // Random created date (before due date)
        const createdDate = getRandomDateBetween(projectStart, dueDate);

        await prisma.task.create({
          data: {
            projectId: project.id,
            assignedToId: assignedTo.id,
            createdById: createdBy.id,
            title: getRandomElement(taskDescriptions),
            description: `Task for ${project.name} - ${getRandomElement(taskDescriptions)}. Priority: ${priority}`,
            status,
            priority,
            dueDate,
            stageId: stage.id,
            createdAt: createdDate,
          },
        });
        tasksCreated++;
      }
    }
    console.log(`   ✅ Created ${tasksCreated} tasks\n`);

    // ============================================
    // 5. CREATE TIMESHEETS WITH RANDOM DATES, HOURS, AND AMOUNTS
    // ============================================
    console.log('[5/6] Creating timesheets with random data...');
    let timesheetsCreated = 0;
    
    // Get all projects with members
    const projectsWithMembers = await prisma.project.findMany({
      where: { isArchived: false },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    for (const project of projectsWithMembers) {
      const projectStart = project.startDate || project.createdAt;
      const projectEnd = project.endDate || new Date();
      
      // Ensure project end is not in future
      const today = new Date();
      const effectiveEnd = projectEnd > today ? today : projectEnd;

      for (const member of project.members) {
        const user = member.user;
        if (!user.hourlyRate || user.hourlyRate === 0) continue;

        // Calculate date range for timesheets
        const assignmentDate = member.assignedAt || projectStart;
        const timesheetStart = assignmentDate > projectStart ? assignmentDate : projectStart;
        const timesheetEnd = effectiveEnd;

        // Generate timesheets for the project duration
        // More timesheets for longer projects
        const projectDurationDays = Math.ceil((timesheetEnd.getTime() - timesheetStart.getTime()) / (1000 * 60 * 60 * 24));
        const timesheetsPerWeek = 2 + Math.random() * 3; // 2-5 timesheets per week
        const totalTimesheets = Math.floor((projectDurationDays / 7) * timesheetsPerWeek);
        
        // Limit to reasonable number
        const numTimesheets = Math.min(totalTimesheets, 200);

        for (let i = 0; i < numTimesheets; i++) {
          // Random date within project duration
          const date = getRandomDateBetween(timesheetStart, timesheetEnd);
          
          // Skip future dates
          if (date > today) continue;

          // Random hours
          const hours = getRandomHours();
          
          // Random amount based on hours and hourly rate
          const amount = getRandomAmount(hours, user.hourlyRate);

          // Status based on date (older = more likely approved)
          let status: TimesheetStatus;
          const daysAgo = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysAgo > 30) {
            // Older than 30 days: mostly approved
            status = getRandomElement(['APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'SUBMITTED']);
          } else if (daysAgo > 7) {
            // 7-30 days: mix of approved and submitted
            status = getRandomElement(['APPROVED', 'APPROVED', 'SUBMITTED', 'SUBMITTED', 'DRAFT']);
          } else {
            // Recent: mix of all statuses
            status = getRandomElement(['DRAFT', 'SUBMITTED', 'SUBMITTED', 'APPROVED', 'REJECTED']);
          }

          // Approved by (if approved)
          let approvedById = null;
          let approvedAt = null;
          if (status === 'APPROVED') {
            approvedById = getRandomElement(admins).id;
            approvedAt = getRandomDateBetween(date, new Date());
          }

          await prisma.timesheet.create({
            data: {
              userId: user.id,
              projectId: project.id,
              date,
              hours,
              description: `Worked on ${getRandomElement(taskDescriptions)} for ${project.name}`,
              status,
              approvedById,
              approvedAt,
            },
          });
          timesheetsCreated++;
        }
      }
    }
    console.log(`   ✅ Created ${timesheetsCreated} timesheets\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('✅ Extensive Dummy Data Generation Complete!\n');
    console.log('📊 Summary:');
    console.log(`   📁 Projects: ${projects.length}`);
    console.log(`   👤 Project Members: ${memberAssignments}`);
    console.log(`   ✅ Tasks: ${tasksCreated}`);
    console.log(`   ⏰ Timesheets: ${timesheetsCreated}`);
    
    // Calculate total hours and amount
    const timesheetStats = await prisma.timesheet.aggregate({
      _sum: {
        hours: true,
      },
      _count: {
        id: true,
      },
    });

    const totalHours = timesheetStats._sum.hours || 0;
    console.log(`   📈 Total Hours: ${totalHours.toFixed(2)}`);
    
    // Calculate approximate total cost
    const approvedTimesheets = await prisma.timesheet.findMany({
      where: { status: 'APPROVED' },
      include: { user: true },
    });
    
    let totalCost = 0;
    for (const ts of approvedTimesheets) {
      if (ts.user.hourlyRate) {
        totalCost += ts.hours * ts.user.hourlyRate;
      }
    }
    
    console.log(`   💰 Total Cost (Approved): ₹${totalCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n`);

  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





