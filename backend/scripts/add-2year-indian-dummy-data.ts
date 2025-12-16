import { PrismaClient, UserRole, ProjectStatus, TimesheetStatus, TaskStatus, TaskPriority, StageStatus, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Comprehensive Indian first names (50+)
const indianFirstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rahul', 'Kavita', 'Arjun', 'Divya',
  'Suresh', 'Meera', 'Nikhil', 'Rohit', 'Shruti', 'Karan', 'Pooja', 'Vishal', 'Neha', 'Saurabh',
  'Aditya', 'Riya', 'Manish', 'Swati', 'Deepak', 'Anita', 'Ravi', 'Kiran', 'Siddharth', 'Radha',
  'Gaurav', 'Shilpa', 'Harsh', 'Preeti', 'Yash', 'Nisha', 'Akash', 'Jyoti', 'Mohit', 'Richa',
  'Varun', 'Sapna', 'Abhishek', 'Tanvi', 'Rohan', 'Ankita', 'Kunal', 'Mansi', 'Sagar', 'Pallavi',
  'Aryan', 'Isha', 'Sanjay', 'Ananya', 'Karan', 'Sakshi', 'Nidhi', 'Shreya', 'Aarti', 'Sonia',
  'Ankit', 'Kritika', 'Rishabh', 'Pooja', 'Vivek', 'Sana', 'Abhinav', 'Tara', 'Sarthak', 'Ishita'
];

// Comprehensive Indian last names
const indianLastNames = [
  'Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Desai', 'Mehta', 'Joshi', 'Verma', 'Nair',
  'Iyer', 'Agarwal', 'Malhotra', 'Gupta', 'Shah', 'Rao', 'Pandey', 'Chopra', 'Bansal', 'Kapoor',
  'Tiwari', 'Mishra', 'Jain', 'Saxena', 'Dubey', 'Yadav', 'Gowda', 'Naidu', 'Menon', 'Nambiar',
  'Krishnan', 'Raman', 'Subramanian', 'Venkatesh', 'Srinivasan', 'Chandrasekhar', 'Ramesh', 'Lakshmi', 'Devi', 'Krishna',
  'Arora', 'Goyal', 'Bhatt', 'Sundaram', 'Iyengar', 'Shastri', 'Bose', 'Banerjee', 'Chatterjee', 'Ganguly',
  'Mukherjee', 'Das', 'Roy', 'Basu', 'Sen', 'Ghosh', 'Dutta', 'Pal', 'Nath', 'Sarkar'
];

// Indian companies
const indianCompanies = [
  { name: 'Tata Consultancy Services', industry: 'IT Services', city: 'Mumbai' },
  { name: 'Infosys Technologies', industry: 'IT Services', city: 'Bangalore' },
  { name: 'Wipro Limited', industry: 'IT Services', city: 'Bangalore' },
  { name: 'HCL Technologies', industry: 'IT Services', city: 'Noida' },
  { name: 'Tech Mahindra', industry: 'IT Services', city: 'Pune' },
  { name: 'Reliance Industries', industry: 'Conglomerate', city: 'Mumbai' },
  { name: 'Tata Motors', industry: 'Automotive', city: 'Mumbai' },
  { name: 'Mahindra & Mahindra', industry: 'Automotive', city: 'Mumbai' },
  { name: 'Bajaj Auto', industry: 'Automotive', city: 'Pune' },
  { name: 'Maruti Suzuki', industry: 'Automotive', city: 'Gurgaon' },
  { name: 'HDFC Bank', industry: 'Banking', city: 'Mumbai' },
  { name: 'ICICI Bank', industry: 'Banking', city: 'Mumbai' },
  { name: 'Axis Bank', industry: 'Banking', city: 'Mumbai' },
  { name: 'State Bank of India', industry: 'Banking', city: 'Mumbai' },
  { name: 'Larsen & Toubro', industry: 'Engineering', city: 'Mumbai' },
  { name: 'Adani Group', industry: 'Infrastructure', city: 'Ahmedabad' },
  { name: 'JSW Steel', industry: 'Steel', city: 'Mumbai' },
  { name: 'Bharti Airtel', industry: 'Telecommunications', city: 'New Delhi' },
  { name: 'Vodafone Idea', industry: 'Telecommunications', city: 'Mumbai' },
  { name: 'Godrej Industries', industry: 'Consumer Goods', city: 'Mumbai' },
  { name: 'Flipkart', industry: 'E-commerce', city: 'Bangalore' },
  { name: 'Paytm', industry: 'Fintech', city: 'Noida' },
  { name: 'Zomato', industry: 'Food Delivery', city: 'Gurgaon' },
  { name: 'Swiggy', industry: 'Food Delivery', city: 'Bangalore' },
  { name: 'Ola', industry: 'Transportation', city: 'Bangalore' }
];

// Project templates
const projectTemplates = [
  { name: 'E-Commerce Platform Development', code: 'ECOM', baseBudget: 2500000 },
  { name: 'Mobile Banking Application', code: 'MBANK', baseBudget: 3200000 },
  { name: 'Healthcare Management System', code: 'HCMS', baseBudget: 2800000 },
  { name: 'Inventory Management System', code: 'INV', baseBudget: 1800000 },
  { name: 'Customer Relationship Management', code: 'CRM', baseBudget: 2200000 },
  { name: 'Learning Management System', code: 'LMS', baseBudget: 1900000 },
  { name: 'Real Estate Portal', code: 'REAL', baseBudget: 2100000 },
  { name: 'Food Delivery Platform', code: 'FOOD', baseBudget: 2700000 },
  { name: 'Fitness Tracking App', code: 'FIT', baseBudget: 1200000 },
  { name: 'Event Management System', code: 'EVENT', baseBudget: 1500000 },
  { name: 'HR Management Portal', code: 'HRM', baseBudget: 2000000 },
  { name: 'Supply Chain Management', code: 'SCM', baseBudget: 3100000 },
  { name: 'Insurance Claims System', code: 'INS', baseBudget: 2400000 },
  { name: 'Travel Booking Platform', code: 'TRAVEL', baseBudget: 2300000 },
  { name: 'Social Media Analytics', code: 'SOCIAL', baseBudget: 1600000 },
  { name: 'Document Management System', code: 'DOC', baseBudget: 1700000 },
  { name: 'Payment Gateway Integration', code: 'PAY', baseBudget: 2900000 },
  { name: 'IoT Dashboard Development', code: 'IOT', baseBudget: 3300000 },
  { name: 'Blockchain Wallet Application', code: 'BLOCK', baseBudget: 3800000 },
  { name: 'AI Chatbot Platform', code: 'AI', baseBudget: 2600000 },
  { name: 'Cloud Migration Project', code: 'CLOUD', baseBudget: 3500000 },
  { name: 'Data Analytics Platform', code: 'DATA', baseBudget: 3000000 },
  { name: 'ERP Implementation', code: 'ERP', baseBudget: 4000000 },
  { name: 'API Gateway Development', code: 'API', baseBudget: 1400000 },
  { name: 'Microservices Architecture', code: 'MICRO', baseBudget: 3600000 }
];

// Task descriptions
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
  'Developed RESTful API documentation',
  'Implemented OAuth2 authentication flow',
  'Created database backup and recovery system',
  'Optimized application startup time',
  'Implemented feature flags for gradual rollout'
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
  'Product Development',
  'Mobile Development',
  'Backend Development'
];

// Stage names
const stageNames = [
  { name: 'Planning', weight: 10 },
  { name: 'Design', weight: 15 },
  { name: 'Development', weight: 40 },
  { name: 'Testing', weight: 20 },
  { name: 'Deployment', weight: 15 }
];

// Helper functions
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDateBetween(start: Date, end: Date): Date {
  const timeDiff = end.getTime() - start.getTime();
  const randomTime = Math.random() * timeDiff;
  return new Date(start.getTime() + randomTime);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Generate random hours (0.5 to 8 hours per day)
function getRandomHours(): number {
  const hours = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8];
  return getRandomElement(hours);
}

// Generate Indian phone number
function generateIndianPhone(): string {
  const prefixes = ['91-9', '91-8', '91-7'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}${number.toString().substring(2)}`;
}

async function main() {
  console.log('🚀 Starting 2-Year Indian Dummy Data Generation...\n');
  console.log('This will create:');
  console.log('- 50 Indian users');
  console.log('- Multiple projects over last 2 years');
  console.log('- Tasks for each project');
  console.log('- Timesheets for last 2 years');
  console.log('- Customers, Departments, and Stages\n');

  try {
    // Calculate date range (2 years ago to today)
    const today = new Date();
    const twoYearsAgo = new Date(today);
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    console.log(`📅 Date Range: ${twoYearsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}\n`);

    // Get or create admin user (for createdById fields)
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });

    if (!admin) {
      console.error('❌ No admin user found. Please run seed script first.');
      process.exit(1);
    }

    // Ensure stages exist
    console.log('📋 Ensuring stages exist...');
    const stagesMap = new Map<string, string>();
    for (const stageData of stageNames) {
      const stage = await prisma.stage.upsert({
        where: { name: stageData.name },
        update: {},
        create: {
          name: stageData.name,
          defaultWeight: stageData.weight,
          type: 'Standard',
          isActive: true
        }
      });
      stagesMap.set(stage.name, stage.id);
    }
    console.log(`✅ ${stagesMap.size} stages ready\n`);

    // Create or get departments
    console.log('🏢 Creating departments...');
    const departmentsMap = new Map<string, string>();
    for (const deptName of departments) {
      const dept = await prisma.department.upsert({
        where: { name: deptName },
        update: {},
        create: {
          name: deptName,
          createdById: admin.id
        }
      });
      departmentsMap.set(dept.name, dept.id);
    }
    console.log(`✅ ${departmentsMap.size} departments created\n`);

    // Create customers
    console.log('👥 Creating customers...');
    const customers: string[] = [];
    for (const company of indianCompanies) {
      const customer = await prisma.customer.create({
        data: {
          name: company.name,
          industry: company.industry,
          contactPerson: `${getRandomElement(indianFirstNames)} ${getRandomElement(indianLastNames)}`,
          email: `contact@${company.name.toLowerCase().replace(/\s+/g, '')}.com`,
          phone: generateIndianPhone(),
          address: `${getRandomInt(1, 999)}, ${company.city}, India`,
          status: Math.random() > 0.2 ? CustomerStatus.ACTIVE : CustomerStatus.INACTIVE
        }
      });
      customers.push(customer.id);
    }
    console.log(`✅ ${customers.length} customers created\n`);

    // Create 50 Indian users
    console.log('👤 Creating 50 Indian users...');
    const users: string[] = [];
    const projectManagers: string[] = [];
    const teamMembers: string[] = [];

    // Get existing users count
    const existingUsersCount = await prisma.user.count();
    
    for (let i = 0; i < 50; i++) {
      const firstName = getRandomElement(indianFirstNames);
      const lastName = getRandomElement(indianLastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${existingUsersCount + i}@ikf.com`;
      const password = await bcrypt.hash('password123', 10);
      
      // Distribute roles
      let role: UserRole;
      const roleRand = Math.random();
      if (roleRand < 0.1) {
        role = UserRole.PROJECT_MANAGER;
        projectManagers.push('');
      } else {
        role = UserRole.TEAM_MEMBER;
        teamMembers.push('');
      }

      // Assign hourly rates based on role
      let hourlyRate: number;
      if (role === UserRole.PROJECT_MANAGER) {
        hourlyRate = getRandomFloat(80, 150);
      } else {
        hourlyRate = getRandomFloat(30, 80);
      }

      // Assign random department
      const departmentId = getRandomElement(Array.from(departmentsMap.values()));

      const user = await prisma.user.create({
        data: {
          email,
          password,
          firstName,
          lastName,
          role,
          departmentId,
          hourlyRate,
          isActive: Math.random() > 0.1 // 90% active
        }
      });

      users.push(user.id);
      if (role === UserRole.PROJECT_MANAGER) {
        projectManagers[projectManagers.length - 1] = user.id;
      } else {
        teamMembers[teamMembers.length - 1] = user.id;
      }

      if ((i + 1) % 10 === 0) {
        console.log(`   Created ${i + 1}/50 users...`);
      }
    }
    console.log(`✅ 50 users created (${projectManagers.filter(id => id).length} PMs, ${teamMembers.filter(id => id).length} Team Members)\n`);

    // Create projects over last 2 years (distributed)
    console.log('📁 Creating projects over last 2 years...');
    const projects: Array<{ id: string; startDate: Date; endDate: Date | null; status: ProjectStatus; managerId: string | null }> = [];
    const numProjects = 30;

    for (let i = 0; i < numProjects; i++) {
      const template = getRandomElement(projectTemplates);
      const projectCode = `${template.code}-${getRandomInt(1000, 9999)}`;
      
      // Distribute projects over 2 years
      const projectStartDate = getRandomDateBetween(twoYearsAgo, today);
      const durationMonths = getRandomInt(3, 18); // 3 to 18 months
      const projectEndDate = new Date(projectStartDate);
      projectEndDate.setMonth(projectEndDate.getMonth() + durationMonths);
      
      // Determine status based on dates
      let status: ProjectStatus;
      if (projectEndDate < today) {
        status = Math.random() > 0.1 ? ProjectStatus.COMPLETED : ProjectStatus.CANCELLED;
      } else if (projectStartDate > today) {
        status = ProjectStatus.PLANNING;
      } else {
        const statusRand = Math.random();
        if (statusRand < 0.7) {
          status = ProjectStatus.IN_PROGRESS;
        } else if (statusRand < 0.85) {
          status = ProjectStatus.ON_HOLD;
        } else {
          status = ProjectStatus.PLANNING;
        }
      }

      const managerId = projectManagers.length > 0 ? getRandomElement(projectManagers.filter(id => id)) : null;
      const customerId = getRandomElement(customers);
      const departmentId = getRandomElement(Array.from(departmentsMap.values()));
      const budget = template.baseBudget * getRandomFloat(0.8, 1.5);
      const healthScore = status === ProjectStatus.COMPLETED ? getRandomFloat(70, 100) : getRandomFloat(40, 90);

      const project = await prisma.project.create({
        data: {
          code: projectCode,
          name: template.name,
          description: `Complete ${template.name} solution for enterprise client`,
          customerId,
          managerId,
          departmentId,
          status,
          budget,
          startDate: projectStartDate,
          endDate: projectEndDate < today ? projectEndDate : (status === ProjectStatus.COMPLETED ? projectEndDate : null),
          healthScore,
          createdById: admin.id
        }
      });

      projects.push({
        id: project.id,
        startDate: projectStartDate,
        endDate: projectEndDate,
        status,
        managerId
      });

      // Add project stages
      for (const [stageName, stageId] of stagesMap.entries()) {
        await prisma.projectStage.create({
          data: {
            projectId: project.id,
            stageId,
            weight: stageNames.find(s => s.name === stageName)?.weight || 0,
            status: projectStartDate > today ? StageStatus.OFF : 
                   (stageName === 'Planning' ? StageStatus.CLOSED : 
                    stageName === 'Design' && status !== ProjectStatus.PLANNING ? StageStatus.CLOSED :
                    stageName === 'Development' && status === ProjectStatus.IN_PROGRESS ? StageStatus.IN_PROGRESS :
                    StageStatus.OFF)
          }
        });
      }

      // Add team members to project (3-8 members)
      const numMembers = getRandomInt(3, 8);
      const projectMembers = [...new Set([...teamMembers.filter(id => id).slice(0, numMembers), managerId].filter(Boolean))];
      
      for (const memberId of projectMembers) {
        if (memberId) {
          await prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: memberId
            }
          });
        }
      }

      if ((i + 1) % 5 === 0) {
        console.log(`   Created ${i + 1}/${numProjects} projects...`);
      }
    }
    console.log(`✅ ${projects.length} projects created\n`);

    // Create tasks for each project
    console.log('📝 Creating tasks for projects...');
    let totalTasks = 0;
    
    for (const project of projects) {
      // 5-20 tasks per project
      const numTasks = getRandomInt(5, 20);
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        select: { userId: true }
      });
      const memberIds = projectMembers.map(pm => pm.userId);

      for (let i = 0; i < numTasks; i++) {
        const taskStartDate = getRandomDateBetween(project.startDate, project.endDate || today);
        const dueDate = new Date(taskStartDate);
        dueDate.setDate(dueDate.getDate() + getRandomInt(1, 14));

        // Determine status based on dates and project status
        let taskStatus: TaskStatus;
        if (project.status === ProjectStatus.COMPLETED) {
          taskStatus = TaskStatus.DONE;
        } else if (dueDate < today && project.status === ProjectStatus.IN_PROGRESS) {
          const statusRand = Math.random();
          taskStatus = statusRand < 0.3 ? TaskStatus.DONE :
                      statusRand < 0.5 ? TaskStatus.IN_REVIEW :
                      statusRand < 0.7 ? TaskStatus.IN_PROGRESS :
                      TaskStatus.TODO;
        } else {
          const statusRand = Math.random();
          taskStatus = statusRand < 0.2 ? TaskStatus.TODO :
                      statusRand < 0.5 ? TaskStatus.IN_PROGRESS :
                      statusRand < 0.7 ? TaskStatus.IN_REVIEW :
                      statusRand < 0.95 ? TaskStatus.DONE :
                      TaskStatus.BLOCKED;
        }

        const priority = getRandomElement([TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT]);
        const stageId = getRandomElement(Array.from(stagesMap.values()));
        const assignedToId = memberIds.length > 0 ? getRandomElement(memberIds) : null;

        await prisma.task.create({
          data: {
            projectId: project.id,
            assignedToId,
            title: getRandomElement(taskDescriptions),
            description: `Detailed description for this task including requirements and acceptance criteria.`,
            status: taskStatus,
            priority,
            dueDate,
            stageId,
            createdById: admin.id
          }
        });
        totalTasks++;
      }
    }
    console.log(`✅ ${totalTasks} tasks created\n`);

    // Create timesheets for last 2 years
    console.log('⏰ Creating timesheets for last 2 years...');
    let totalTimesheets = 0;
    const timesheetStatuses = [TimesheetStatus.DRAFT, TimesheetStatus.SUBMITTED, TimesheetStatus.APPROVED, TimesheetStatus.REJECTED];

    // Generate timesheets day by day for active projects
    const activeProjects = projects.filter(p => 
      p.status === ProjectStatus.IN_PROGRESS || 
      (p.status === ProjectStatus.COMPLETED && p.endDate && p.endDate >= twoYearsAgo)
    );

    for (const project of activeProjects) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        select: { userId: true }
      });

      // Generate timesheets for working days only (Monday-Friday)
      const currentDate = new Date(Math.max(project.startDate.getTime(), twoYearsAgo.getTime()));
      const endDate = project.endDate && project.endDate < today ? project.endDate : today;

      while (currentDate <= endDate) {
        // Skip weekends
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Randomly add timesheets (70% chance per day per member)
          for (const member of projectMembers) {
            if (Math.random() < 0.7) {
              const hours = getRandomHours();
              
              // Older timesheets are more likely to be approved
              const daysAgo = (today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
              let status: TimesheetStatus;
              if (daysAgo > 30) {
                status = Math.random() > 0.1 ? TimesheetStatus.APPROVED : TimesheetStatus.SUBMITTED;
              } else if (daysAgo > 7) {
                const statusRand = Math.random();
                status = statusRand < 0.6 ? TimesheetStatus.APPROVED :
                        statusRand < 0.85 ? TimesheetStatus.SUBMITTED :
                        TimesheetStatus.DRAFT;
              } else {
                status = getRandomElement([TimesheetStatus.DRAFT, TimesheetStatus.SUBMITTED]);
              }

              const timesheet = await prisma.timesheet.create({
                data: {
                  userId: member.userId,
                  projectId: project.id,
                  date: new Date(currentDate),
                  hours,
                  description: getRandomElement(taskDescriptions),
                  status,
                  approvedById: status === TimesheetStatus.APPROVED ? admin.id : null,
                  approvedAt: status === TimesheetStatus.APPROVED ? new Date(currentDate.getTime() + getRandomInt(1, 3) * 24 * 60 * 60 * 1000) : null
                }
              });
              totalTimesheets++;

              // Progress indicator
              if (totalTimesheets % 1000 === 0) {
                console.log(`   Created ${totalTimesheets} timesheets...`);
              }
            }
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    console.log(`✅ ${totalTimesheets} timesheets created\n`);

    console.log('✅ 2-Year Indian Dummy Data Generation Complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Users: 50 Indian users`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Departments: ${departmentsMap.size}`);
    console.log(`   - Projects: ${projects.length}`);
    console.log(`   - Tasks: ${totalTasks}`);
    console.log(`   - Timesheets: ${totalTimesheets}`);
    console.log(`   - Date Range: Last 2 years\n`);
    console.log('🔑 All users have password: password123');

  } catch (error) {
    console.error('❌ Error generating dummy data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });




