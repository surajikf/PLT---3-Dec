import { PrismaClient, UserRole, ProjectStatus, TimesheetStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Realistic Indian first and last names
const firstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rahul', 'Kavita', 'Arjun', 'Divya',
  'Suresh', 'Meera', 'Nikhil', 'Rohit', 'Shruti', 'Deepak', 'Pooja', 'Karan', 'Neha', 'Vishal',
  'Sanjay', 'Riya', 'Mohit', 'Ananya', 'Aditya', 'Isha', 'Rohan', 'Tanvi', 'Kunal', 'Sakshi',
  'Manish', 'Swati', 'Abhishek', 'Richa', 'Gaurav', 'Nidhi', 'Varun', 'Shreya', 'Harsh', 'Aarti',
  'Yash', 'Pallavi', 'Siddharth', 'Kritika', 'Akash', 'Jyoti', 'Ravi', 'Sonia', 'Ankit', 'Preeti'
];

const lastNames = [
  'Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Desai', 'Mehta', 'Joshi', 'Verma', 'Nair',
  'Iyer', 'Krishnan', 'Agarwal', 'Malhotra', 'Gupta', 'Shah', 'Rao', 'Pandey', 'Mishra', 'Chopra',
  'Bansal', 'Kapoor', 'Arora', 'Saxena', 'Tiwari', 'Dubey', 'Yadav', 'Jain', 'Goyal', 'Bhatt',
  'Nambiar', 'Raman', 'Menon', 'Nair', 'Krishna', 'Sundaram', 'Venkatesh', 'Ramesh', 'Lakshmi', 'Srinivasan'
];

// Realistic project names and industries
const projectTemplates = [
  { name: 'E-Commerce Platform Development', code: 'ECOM', industry: 'Retail', baseBudget: 1500000 },
  { name: 'Mobile Banking Application', code: 'MBANK', industry: 'Banking', baseBudget: 2000000 },
  { name: 'Healthcare Management System', code: 'HCMS', industry: 'Healthcare', baseBudget: 1800000 },
  { name: 'Inventory Management System', code: 'INV', industry: 'Logistics', baseBudget: 1200000 },
  { name: 'Customer Relationship Management', code: 'CRM', industry: 'Sales', baseBudget: 1600000 },
  { name: 'Learning Management System', code: 'LMS', industry: 'Education', baseBudget: 1400000 },
  { name: 'Real Estate Portal', code: 'REAL', industry: 'Real Estate', baseBudget: 1300000 },
  { name: 'Food Delivery Platform', code: 'FOOD', industry: 'Food & Beverage', baseBudget: 1700000 },
  { name: 'Fitness Tracking App', code: 'FIT', industry: 'Health & Fitness', baseBudget: 900000 },
  { name: 'Event Management System', code: 'EVENT', industry: 'Events', baseBudget: 1100000 },
  { name: 'HR Management Portal', code: 'HRM', industry: 'HR', baseBudget: 1500000 },
  { name: 'Supply Chain Management', code: 'SCM', industry: 'Logistics', baseBudget: 1900000 },
  { name: 'Insurance Claims System', code: 'INS', industry: 'Insurance', baseBudget: 1600000 },
  { name: 'Travel Booking Platform', code: 'TRAVEL', industry: 'Travel', baseBudget: 1400000 },
  { name: 'Social Media Analytics', code: 'SOCIAL', industry: 'Marketing', baseBudget: 1000000 },
  { name: 'Document Management System', code: 'DOC', industry: 'Documentation', baseBudget: 1200000 },
  { name: 'Payment Gateway Integration', code: 'PAY', industry: 'Fintech', baseBudget: 1800000 },
  { name: 'IoT Dashboard Development', code: 'IOT', industry: 'Technology', baseBudget: 2000000 },
  { name: 'Blockchain Wallet Application', code: 'BLOCK', industry: 'Fintech', baseBudget: 2200000 },
  { name: 'AI Chatbot Platform', code: 'AI', industry: 'Technology', baseBudget: 1700000 },
];

// Realistic task descriptions that feel human-written
const taskDescriptions = [
  'Developed user authentication module with JWT tokens',
  'Implemented responsive design for mobile devices',
  'Fixed critical bug in payment processing flow',
  'Created API endpoints for user management',
  'Designed database schema for new feature',
  'Wrote unit tests for authentication service',
  'Reviewed and merged pull requests from team',
  'Optimized database queries for better performance',
  'Implemented file upload functionality with validation',
  'Fixed UI issues reported by QA team',
  'Added error handling and logging throughout application',
  'Created documentation for new API endpoints',
  'Implemented real-time notifications using WebSockets',
  'Refactored legacy code to improve maintainability',
  'Added data validation and sanitization',
  'Implemented caching layer for frequently accessed data',
  'Created admin dashboard for managing users',
  'Fixed memory leak in background job processor',
  'Implemented search functionality with filters',
  'Added integration tests for critical workflows',
  'Optimized image loading and compression',
  'Implemented role-based access control',
  'Created data migration scripts for schema changes',
  'Fixed cross-browser compatibility issues',
  'Implemented email notification system',
  'Added analytics tracking for user behavior',
  'Created automated deployment pipeline',
  'Fixed security vulnerabilities identified in audit',
  'Implemented multi-language support',
  'Added comprehensive error logging and monitoring',
];

// Department names
const departments = [
  'Software Development',
  'Quality Assurance',
  'UI/UX Design',
  'Project Management',
  'DevOps & Infrastructure',
  'Business Analysis',
  'Sales & Marketing',
];

// Get random date between start and end
function getRandomDateBetween(start: Date, end: Date): Date {
  const timeDiff = end.getTime() - start.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(start.getTime() + randomTime);
}

// Get random date in the past (for project creation)
function getRandomDateInRange(yearsBack: number): Date {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - yearsBack);
  return getRandomDateBetween(startDate, today);
}

// Get random business day (Monday-Friday)
function getRandomBusinessDay(startDate: Date, endDate: Date): Date {
  let date = getRandomDateBetween(startDate, endDate);
  // If it's a weekend, move to nearest weekday
  while (date.getDay() === 0 || date.getDay() === 6) {
    if (date.getDay() === 0) {
      date = new Date(date);
      date.setDate(date.getDate() + 1);
    } else {
      date = new Date(date);
      date.setDate(date.getDate() - 1);
    }
  }
  return date;
}

// Get realistic hours for a workday (most common: 6-8 hours)
function getRealisticHours(): number {
  const rand = Math.random();
  if (rand < 0.4) return Math.round((Math.random() * 2 + 6) * 2) / 2; // 6-8 hours (40%)
  if (rand < 0.7) return Math.round((Math.random() * 2 + 4) * 2) / 2; // 4-6 hours (30%)
  if (rand < 0.9) return Math.round((Math.random() * 2 + 8) * 2) / 2; // 8-10 hours (20%)
  return Math.round((Math.random() * 2 + 2) * 2) / 2; // 2-4 hours (10%)
}

// Get project status based on age and random factor
function getProjectStatus(createdDate: Date): ProjectStatus {
  const today = new Date();
  const ageInDays = (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  const rand = Math.random();

  if (ageInDays > 700) {
    // Very old projects are likely completed
    return rand < 0.8 ? ProjectStatus.COMPLETED : ProjectStatus.CANCELLED;
  } else if (ageInDays > 300) {
    // Medium age projects
    if (rand < 0.5) return ProjectStatus.COMPLETED;
    if (rand < 0.8) return ProjectStatus.IN_PROGRESS;
    if (rand < 0.95) return ProjectStatus.ON_HOLD;
    return ProjectStatus.CANCELLED;
  } else {
    // Recent projects
    if (rand < 0.6) return ProjectStatus.IN_PROGRESS;
    if (rand < 0.85) return ProjectStatus.PLANNING;
    if (rand < 0.95) return ProjectStatus.ON_HOLD;
    return ProjectStatus.CANCELLED;
  }
}

// Get timesheet status based on date (older = approved, recent = submitted/draft)
function getTimesheetStatus(date: Date): TimesheetStatus {
  const today = new Date();
  const daysAgo = (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  const rand = Math.random();

  if (daysAgo > 30) {
    // Old timesheets are mostly approved
    return rand < 0.9 ? TimesheetStatus.APPROVED : TimesheetStatus.REJECTED;
  } else if (daysAgo > 7) {
    // Recent but not too recent
    if (rand < 0.7) return TimesheetStatus.APPROVED;
    if (rand < 0.9) return TimesheetStatus.SUBMITTED;
    return TimesheetStatus.REJECTED;
  } else {
    // Very recent
    if (rand < 0.4) return TimesheetStatus.SUBMITTED;
    if (rand < 0.7) return TimesheetStatus.DRAFT;
    if (rand < 0.9) return TimesheetStatus.APPROVED;
    return TimesheetStatus.REJECTED;
  }
}

async function main() {
  console.log('🚀 Starting realistic 3-year data generation...\n');
  console.log('This will create:');
  console.log('  - 30-50 employees');
  console.log('  - 30-40 projects (spread over 3 years)');
  console.log('  - 5000+ timesheets (realistic work patterns)\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Step 1: Create Departments
    console.log('[1/4] Creating departments...');
    const departmentMap: Record<string, string> = {};
    for (const deptName of departments) {
      const existing = await prisma.department.findUnique({ where: { name: deptName } });
      if (!existing) {
        // Get a super admin to be the creator
        const superAdmin = await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } });
        if (superAdmin) {
          const dept = await prisma.department.create({
            data: {
              name: deptName,
              createdById: superAdmin.id,
            },
          });
          departmentMap[deptName] = dept.id;
          console.log(`   ✓ Created: ${deptName}`);
        }
      } else {
        departmentMap[deptName] = existing.id;
      }
    }
    console.log(`   ✅ ${Object.keys(departmentMap).length} departments ready\n`);

    // Step 2: Create Employees
    console.log('[2/4] Creating employees...');
    const employeeIds: string[] = [];
    const managerIds: string[] = [];
    const teamMemberIds: string[] = [];
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create 8-12 Project Managers
    const numManagers = Math.floor(Math.random() * 5) + 8;
    for (let i = 0; i < numManagers; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@ikf.com`;
      
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const deptKeys = Object.keys(departmentMap);
        const deptId = departmentMap[deptKeys[Math.floor(Math.random() * deptKeys.length)]];
        const hourlyRate = Math.floor(Math.random() * 30) + 70; // 70-100 per hour

        const user = await prisma.user.create({
          data: {
            email,
            password: passwordHash,
            firstName,
            lastName,
            role: UserRole.PROJECT_MANAGER,
            departmentId: deptId,
            hourlyRate,
            isActive: true,
          },
        });
        managerIds.push(user.id);
        employeeIds.push(user.id);
        console.log(`   ✓ Created PM: ${firstName} ${lastName}`);
      } else {
        if (existing.role === UserRole.PROJECT_MANAGER) {
          managerIds.push(existing.id);
        }
        employeeIds.push(existing.id);
      }
    }

    // Create 20-35 Team Members
    const numTeamMembers = Math.floor(Math.random() * 16) + 20;
    for (let i = 0; i < numTeamMembers; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 100}@ikf.com`;
      
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const deptKeys = Object.keys(departmentMap);
        const deptId = departmentMap[deptKeys[Math.floor(Math.random() * deptKeys.length)]];
        const hourlyRate = Math.floor(Math.random() * 40) + 30; // 30-70 per hour

        const user = await prisma.user.create({
          data: {
            email,
            password: passwordHash,
            firstName,
            lastName,
            role: UserRole.TEAM_MEMBER,
            departmentId: deptId,
            hourlyRate,
            isActive: true,
          },
        });
        teamMemberIds.push(user.id);
        employeeIds.push(user.id);
        console.log(`   ✓ Created TM: ${firstName} ${lastName}`);
      } else {
        if (existing.role === UserRole.TEAM_MEMBER) {
          teamMemberIds.push(existing.id);
        }
        employeeIds.push(existing.id);
      }
    }

    console.log(`   ✅ ${managerIds.length} managers, ${teamMemberIds.length} team members\n`);

    // Step 3: Create Customers and Projects
    console.log('[3/4] Creating customers and projects...');
    const projectIds: string[] = [];
    const today = new Date();
    const threeYearsAgo = new Date(today);
    threeYearsAgo.setFullYear(today.getFullYear() - 3);

    // Get a super admin for project creation
    const superAdmin = await prisma.user.findFirst({ where: { role: UserRole.SUPER_ADMIN } });
    if (!superAdmin) {
      throw new Error('Super admin not found');
    }

    // Create 30-40 projects spread over 3 years
    const numProjects = Math.floor(Math.random() * 11) + 30;
    const usedCodes = new Set<string>();

    for (let i = 0; i < numProjects; i++) {
      const template = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
      let code = template.code;
      let codeSuffix = 1;
      while (usedCodes.has(code)) {
        code = `${template.code}${codeSuffix}`;
        codeSuffix++;
      }
      usedCodes.add(code);

      // Check if project already exists
      const existing = await prisma.project.findUnique({ where: { code } });
      if (existing) {
        projectIds.push(existing.id);
        continue;
      }

      // Create customer if needed
      const customerName = `${template.industry} Corp ${i + 1}`;
      let customer = await prisma.customer.findFirst({ where: { name: customerName } });
      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: customerName,
            industry: template.industry,
            contactPerson: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            email: `contact@${customerName.toLowerCase().replace(/\s+/g, '')}.com`,
            status: 'ACTIVE',
          },
        });
      }

      // Random project creation date over 3 years
      const createdDate = getRandomDateInRange(3);
      const status = getProjectStatus(createdDate);
      
      // Set start and end dates based on status
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      if (status === ProjectStatus.IN_PROGRESS || status === ProjectStatus.COMPLETED) {
        startDate = new Date(createdDate);
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
        if (status === ProjectStatus.COMPLETED) {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 365) + 90);
          if (endDate > today) endDate = today;
        }
      }

      // Random manager
      const managerId = managerIds[Math.floor(Math.random() * managerIds.length)];
      const deptKeys = Object.keys(departmentMap);
      const deptId = departmentMap[deptKeys[Math.floor(Math.random() * deptKeys.length)]];
      
      // Budget with some variation
      const budget = template.baseBudget * (0.8 + Math.random() * 0.4);

      const project = await prisma.project.create({
        data: {
          code,
          name: `${template.name} - ${customer.name}`,
          description: `Comprehensive ${template.name.toLowerCase()} solution for ${customer.name}`,
          customerId: customer.id,
          managerId,
          departmentId: deptId,
          status,
          budget,
          startDate,
          endDate,
          createdById: superAdmin.id,
          healthScore: status === ProjectStatus.COMPLETED ? 85 + Math.random() * 15 : 
                      status === ProjectStatus.IN_PROGRESS ? 60 + Math.random() * 25 : 
                      40 + Math.random() * 30,
          createdAt: createdDate,
        },
      });

      projectIds.push(project.id);

      // Add 3-8 team members to each project
      const numMembers = Math.floor(Math.random() * 6) + 3;
      const selectedMembers = new Set<string>();
      for (let j = 0; j < numMembers && j < teamMemberIds.length; j++) {
        let memberId = teamMemberIds[Math.floor(Math.random() * teamMemberIds.length)];
        while (selectedMembers.has(memberId)) {
          memberId = teamMemberIds[Math.floor(Math.random() * teamMemberIds.length)];
        }
        selectedMembers.add(memberId);

        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: memberId,
            assignedAt: new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      console.log(`   ✓ Created: ${code} - ${project.name} (${status})`);
    }

    console.log(`   ✅ ${projectIds.length} projects created\n`);

    // Step 4: Create Timesheets (spread over 3 years)
    console.log('[4/4] Creating timesheets (this may take a while)...');
    let timesheetCount = 0;
    const targetTimesheets = 5000 + Math.floor(Math.random() * 2000); // 5000-7000 timesheets

    // Generate timesheets day by day for the last 3 years
    const startDate = new Date(threeYearsAgo);
    const endDate = new Date(today);

    // Process in monthly chunks to avoid memory issues
    let currentDate = new Date(startDate);
    const processedDates = new Set<string>();

    while (currentDate <= endDate && timesheetCount < targetTimesheets) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Skip if already processed
      if (!processedDates.has(dateStr)) {
        processedDates.add(dateStr);

        // Skip future dates
        if (currentDate > today) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // 85% chance of timesheets on weekdays, 15% on weekends
        if ((!isWeekend && Math.random() < 0.85) || (isWeekend && Math.random() < 0.15)) {
          // Each day, 3-12 employees might log time
          const numEmployees = isWeekend ? 
            Math.floor(Math.random() * 3) + 1 : // 1-3 on weekends
            Math.floor(Math.random() * 10) + 3; // 3-12 on weekdays

          for (let i = 0; i < numEmployees && timesheetCount < targetTimesheets; i++) {
            // Random employee (team member or manager)
            const userId = employeeIds[Math.floor(Math.random() * employeeIds.length)];
            
            // Get projects this user is assigned to
            const userProjects = await prisma.projectMember.findMany({
              where: { userId },
              select: { projectId: true },
            });

            if (userProjects.length === 0) continue;

            // Random project from user's assignments
            const projectMember = userProjects[Math.floor(Math.random() * userProjects.length)];
            const project = await prisma.project.findUnique({
              where: { id: projectMember.projectId },
              select: { createdAt: true, status: true },
            });

            if (!project) continue;

            // Don't create timesheets before project was created
            if (currentDate < project.createdAt) continue;

            // Don't create timesheets for cancelled projects (rarely)
            if (project.status === ProjectStatus.CANCELLED && Math.random() > 0.1) continue;

            // Realistic hours
            const hours = getRealisticHours();
            const status = getTimesheetStatus(currentDate);
            const description = taskDescriptions[Math.floor(Math.random() * taskDescriptions.length)];

            // Create timesheet
            await prisma.timesheet.create({
              data: {
                userId,
                projectId: projectMember.projectId,
                date: new Date(currentDate),
                hours,
                description,
                status,
                createdAt: new Date(currentDate.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Random time on that day
              },
            });

            timesheetCount++;
            if (timesheetCount % 500 === 0) {
              console.log(`   ⏳ Created ${timesheetCount} timesheets...`);
            }
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`   ✅ Created ${timesheetCount} timesheets\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`   - Departments: ${Object.keys(departmentMap).length}`);
    console.log(`   - Employees: ${employeeIds.length} (${managerIds.length} managers, ${teamMemberIds.length} team members)`);
    console.log(`   - Projects: ${projectIds.length}`);
    console.log(`   - Timesheets: ${timesheetCount}`);
    console.log('\n✅ Realistic 3-year data generation complete!');

  } catch (error: any) {
    console.error('\n❌ Error generating data:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});





