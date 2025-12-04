import { PrismaClient, TimesheetStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
  console.log('🌱 Starting timesheet data generation for the last year...');

  // Get all users who can create timesheets
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['PROJECT_MANAGER', 'TEAM_MEMBER'] },
      isActive: true,
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found. Please run seed script first.');
    return;
  }

  // Get all projects
  const projects = await prisma.project.findMany({
    where: {
      status: { not: 'CANCELLED' },
    },
  });

  if (projects.length === 0) {
    console.log('❌ No projects found. Please create projects first.');
    return;
  }

  console.log(`📋 Found ${users.length} users and ${projects.length} projects`);

  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  let timesheetCount = 0;
  const targetTimesheets = 2000;

  // Generate timesheets more densely
  for (let i = 0; i < 365; i++) {
    if (timesheetCount >= targetTimesheets) break;

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
      // 4-10 timesheet entries per day
      const numEntries = Math.floor(Math.random() * 7) + 4;

      for (let j = 0; j < numEntries; j++) {
        if (timesheetCount >= targetTimesheets) break;

        const user = users[Math.floor(Math.random() * users.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        
        // Only create timesheets for projects that have started
        if (project.startDate && date < project.startDate) continue;
        if (project.endDate && date > project.endDate && project.status !== 'COMPLETED') continue;

        // Check if timesheet already exists for this user, project, and date
        const existing = await prisma.timesheet.findFirst({
          where: {
            userId: user.id,
            projectId: project.id,
            date: date,
          },
        });

        if (existing) continue; // Skip if already exists

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

        await prisma.timesheet.create({
          data: {
            userId: user.id,
            projectId: project.id,
            date,
            hours: Math.round(hours * 100) / 100, // Round to 2 decimals
            description,
            status,
            approvedAt: status === 'APPROVED' ? getRandomDateBetween(date, today) : null,
            approvedById: status === 'APPROVED' && users.find(u => ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(u.role)) 
              ? users.find(u => ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(u.role))!.id 
              : null,
          },
        });

        timesheetCount++;
        
        if (timesheetCount % 100 === 0) {
          console.log(`   ✓ Created ${timesheetCount} timesheets...`);
        }
      }
    }
  }

  console.log(`\n✅ Created ${timesheetCount} timesheets for the last year`);
}

main()
  .catch((e) => {
    console.error('❌ Error generating timesheet data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

