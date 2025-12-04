import { PrismaClient, UserRole, ProjectStatus, TimesheetStatus, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Indian first names
const indianFirstNames = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Rahul', 'Kavita', 'Arjun', 'Divya',
  'Suresh', 'Meera', 'Nikhil', 'Rohit', 'Shruti', 'Karan', 'Pooja', 'Vishal', 'Neha', 'Saurabh',
  'Aditya', 'Riya', 'Manish', 'Swati', 'Deepak', 'Anita', 'Ravi', 'Kiran', 'Siddharth', 'Radha',
  'Gaurav', 'Shilpa', 'Harsh', 'Preeti', 'Yash', 'Nisha', 'Akash', 'Jyoti', 'Mohit', 'Richa',
  'Varun', 'Sapna', 'Abhishek', 'Tanvi', 'Rohan', 'Ankita', 'Kunal', 'Mansi', 'Sagar', 'Pallavi'
];

// Indian last names
const indianLastNames = [
  'Kumar', 'Sharma', 'Patel', 'Reddy', 'Singh', 'Desai', 'Mehta', 'Joshi', 'Verma', 'Nair',
  'Iyer', 'Agarwal', 'Malhotra', 'Gupta', 'Shah', 'Rao', 'Pandey', 'Chopra', 'Bansal', 'Kapoor',
  'Tiwari', 'Mishra', 'Jain', 'Saxena', 'Dubey', 'Yadav', 'Gowda', 'Naidu', 'Menon', 'Nambiar',
  'Krishnan', 'Raman', 'Subramanian', 'Venkatesh', 'Srinivasan', 'Chandrasekhar', 'Ramesh', 'Lakshmi', 'Devi', 'Krishna'
];

// Indian company names
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
  { name: 'Godrej Industries', industry: 'Consumer Goods', city: 'Mumbai' }
];

// Project templates with Indian context
const projectTemplates = [
  { code: 'TCS-DIG', name: 'TCS Digital Transformation', baseBudget: 5000000 },
  { code: 'INFY-CLOUD', name: 'Infosys Cloud Migration', baseBudget: 3500000 },
  { code: 'WIPRO-ERP', name: 'Wipro ERP Implementation', baseBudget: 4200000 },
  { code: 'HCL-MOBILE', name: 'HCL Mobile App Development', baseBudget: 2800000 },
  { code: 'TECHM-AI', name: 'Tech Mahindra AI Solutions', baseBudget: 4500000 },
  { code: 'RELIANCE-E', name: 'Reliance E-commerce Platform', baseBudget: 6000000 },
  { code: 'TATA-EV', name: 'Tata Motors EV Platform', baseBudget: 5500000 },
  { code: 'MAHINDRA-SMART', name: 'Mahindra Smart Factory', baseBudget: 4800000 },
  { code: 'BAJAJ-FIN', name: 'Bajaj Finance Digital', baseBudget: 3200000 },
  { code: 'MARUTI-CONN', name: 'Maruti Connected Cars', baseBudget: 4000000 },
  { code: 'HDFC-CORE', name: 'HDFC Core Banking Upgrade', baseBudget: 3800000 },
  { code: 'ICICI-DIGI', name: 'ICICI Digital Banking', baseBudget: 3600000 },
  { code: 'AXIS-PAY', name: 'Axis Payment Gateway', baseBudget: 2900000 },
  { code: 'SBI-ONLINE', name: 'SBI Online Services', baseBudget: 4100000 },
  { code: 'LNT-SMART', name: 'L&T Smart Infrastructure', baseBudget: 5200000 },
  { code: 'ADANI-LOG', name: 'Adani Logistics Platform', baseBudget: 4400000 },
  { code: 'JSW-AUTO', name: 'JSW Automation System', baseBudget: 3300000 },
  { code: 'AIRTEL-5G', name: 'Airtel 5G Network Management', baseBudget: 4700000 },
  { code: 'VODAFONE-APP', name: 'Vodafone Mobile App', baseBudget: 3100000 },
  { code: 'GODREJ-IOT', name: 'Godrej IoT Solutions', baseBudget: 3900000 }
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
  'Analytics Implementation'
];

// Get random element from array
function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

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

// Generate random Indian phone number
function generateIndianPhone(): string {
  const prefixes = ['91', '91'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `+${prefix}${number}`;
}

// Generate random Indian email
function generateIndianEmail(firstName: string, lastName: string, domain?: string): string {
  const domains = domain ? [domain] : ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'rediffmail.com'];
  const randomDomain = getRandomElement(domains);
  const randomNum = Math.floor(Math.random() * 1000);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${randomDomain}`;
}

async function main() {
  console.log('🇮🇳 Starting Indian Demo Data Generation...\n');

  try {
    // ============================================
    // 1. CREATE INDIAN USERS
    // ============================================
    console.log('[1/7] Creating Indian users...');
    const password = await bcrypt.hash('password123', 10);
    
    const createdUsers = [];
    const userRoles = [
      { role: UserRole.SUPER_ADMIN, count: 1 },
      { role: UserRole.ADMIN, count: 5 },
      { role: UserRole.PROJECT_MANAGER, count: 8 },
      { role: UserRole.TEAM_MEMBER, count: 25 },
      { role: UserRole.CLIENT, count: 5 }
    ];

    for (const { role, count } of userRoles) {
      for (let i = 0; i < count; i++) {
        const firstName = getRandomElement(indianFirstNames);
        const lastName = getRandomElement(indianLastNames);
        const email = role === UserRole.CLIENT 
          ? generateIndianEmail(firstName, lastName)
          : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ikf.co.in`;
        
        // Skip if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) continue;

        const hourlyRate = role === UserRole.SUPER_ADMIN ? 0 :
          role === UserRole.ADMIN ? Math.floor(Math.random() * 200) + 150 :
          role === UserRole.PROJECT_MANAGER ? Math.floor(Math.random() * 150) + 100 :
          role === UserRole.CLIENT ? 0 :
          Math.floor(Math.random() * 100) + 50;

        const user = await prisma.user.create({
          data: {
            email,
            password,
            firstName,
            lastName,
            role,
            hourlyRate,
            isActive: true,
          },
        });
        createdUsers.push(user);
      }
    }
    console.log(`   ✅ Created ${createdUsers.length} Indian users\n`);

    // ============================================
    // 2. CREATE DEPARTMENTS
    // ============================================
    console.log('[2/7] Creating departments...');
    const departmentNames = [
      'Software Development',
      'Quality Assurance',
      'DevOps & Infrastructure',
      'UI/UX Design',
      'Project Management',
      'Business Analysis',
      'Sales & Marketing'
    ];

    const admins = createdUsers.filter(u => u.role === UserRole.ADMIN);
    const departments = [];
    
    for (const deptName of departmentNames) {
      const existing = await prisma.department.findUnique({ where: { name: deptName } });
      if (existing) {
        departments.push(existing);
        continue;
      }

      const head = getRandomElement(admins);
      const creator = getRandomElement(admins);
      
      const dept = await prisma.department.create({
        data: {
          name: deptName,
          headId: head.id,
          createdById: creator.id,
        },
      });
      departments.push(dept);
    }
    console.log(`   ✅ Created/Found ${departments.length} departments\n`);

    // Assign users to departments
    const teamMembers = createdUsers.filter(u => u.role === UserRole.TEAM_MEMBER);
    const projectManagers = createdUsers.filter(u => u.role === UserRole.PROJECT_MANAGER);
    
    for (let i = 0; i < teamMembers.length; i++) {
      const dept = departments[i % departments.length];
      await prisma.user.update({
        where: { id: teamMembers[i].id },
        data: { departmentId: dept.id },
      });
    }

    for (let i = 0; i < projectManagers.length; i++) {
      const dept = departments[i % departments.length];
      await prisma.user.update({
        where: { id: projectManagers[i].id },
        data: { departmentId: dept.id },
      });
    }

    // ============================================
    // 3. CREATE INDIAN CUSTOMERS
    // ============================================
    console.log('[3/7] Creating Indian customers...');
    const customers = [];
    
    for (const company of indianCompanies) {
      const existing = await prisma.customer.findFirst({ 
        where: { name: { contains: company.name.split(' ')[0] } } 
      });
      if (existing) {
        customers.push(existing);
        continue;
      }

      const contactFirstName = getRandomElement(indianFirstNames);
      const contactLastName = getRandomElement(indianLastNames);
      const domain = company.name.toLowerCase().replace(/\s+/g, '').replace('&', '') + '.com';
      
      const customer = await prisma.customer.create({
        data: {
          name: company.name,
          industry: company.industry,
          contactPerson: `${contactFirstName} ${contactLastName}`,
          email: `contact@${domain}`,
          phone: generateIndianPhone(),
          address: `${company.city}, Maharashtra, India`,
          status: 'ACTIVE',
        },
      });
      customers.push(customer);
    }
    console.log(`   ✅ Created/Found ${customers.length} Indian customers\n`);

    // ============================================
    // 4. CREATE PROJECTS
    // ============================================
    console.log('[4/7] Creating projects...');
    const projects = [];
    const statuses: ProjectStatus[] = ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];
    
    for (const template of projectTemplates) {
      const existing = await prisma.project.findUnique({ where: { code: template.code } });
      if (existing) {
        projects.push(existing);
        continue;
      }

      const customer = getRandomElement(customers);
      const manager = getRandomElement(projectManagers);
      const department = getRandomElement(departments);
      const status = getRandomElement(statuses);
      const createdBy = getRandomElement(admins);
      
      const startDate = getRandomDateInPastYear();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 12) + 6);
      
      const budget = template.baseBudget + Math.floor(Math.random() * 1000000) - 500000;

      const project = await prisma.project.create({
        data: {
          code: template.code,
          name: template.name,
          description: `Digital transformation project for ${customer.name}`,
          customerId: customer.id,
          managerId: manager.id,
          departmentId: department.id,
          status,
          budget,
          startDate,
          endDate,
          createdById: createdBy.id,
          isArchived: false,
        },
      });
      projects.push(project);
    }
    console.log(`   ✅ Created/Found ${projects.length} projects\n`);

    // ============================================
    // 5. CREATE PROJECT MEMBERS
    // ============================================
    console.log('[5/7] Assigning team members to projects...');
    let memberAssignments = 0;
    
    for (const project of projects) {
      const numMembers = Math.floor(Math.random() * 5) + 2; // 2-6 members per project
      const selectedMembers = teamMembers
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
          await prisma.projectMember.create({
            data: {
              projectId: project.id,
              userId: member.id,
            },
          });
          memberAssignments++;
        }
      }
    }
    console.log(`   ✅ Created ${memberAssignments} project member assignments\n`);

    // ============================================
    // 6. CREATE TASKS
    // ============================================
    console.log('[6/7] Creating tasks...');
    const stages = await prisma.stage.findMany({ where: { isActive: true } });
    let tasksCreated = 0;
    
    for (const project of projects.slice(0, 15)) { // Create tasks for first 15 projects
      const numTasks = Math.floor(Math.random() * 10) + 5; // 5-14 tasks per project
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: project.id },
        include: { user: true },
      });

      if (projectMembers.length === 0) continue;

      for (let i = 0; i < numTasks; i++) {
        const assignedTo = getRandomElement(projectMembers).user;
        const createdBy = getRandomElement([...admins, ...projectManagers]);
        const stage = getRandomElement(stages);
        const status = getRandomElement(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]);
        const priority = getRandomElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]);
        
        const dueDate = getRandomDateBetween(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

        await prisma.task.create({
          data: {
            projectId: project.id,
            assignedToId: assignedTo.id,
            createdById: createdBy.id,
            title: getRandomElement(taskDescriptions),
            description: `Task for ${project.name} - ${getRandomElement(taskDescriptions)}`,
            status,
            priority,
            dueDate,
            stageId: stage.id,
          },
        });
        tasksCreated++;
      }
    }
    console.log(`   ✅ Created ${tasksCreated} tasks\n`);

    // ============================================
    // 7. CREATE TIMESHEETS
    // ============================================
    console.log('[7/7] Creating timesheets...');
    let timesheetsCreated = 0;
    const timesheetStatuses: TimesheetStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];
    
    // Get all active projects with members
    const projectsWithMembers = await prisma.project.findMany({
      where: { isArchived: false },
      include: {
        members: {
          include: { user: true },
        },
      },
    });

    for (const project of projectsWithMembers.slice(0, 20)) {
      for (const member of project.members) {
        const user = member.user;
        if (!user.hourlyRate || user.hourlyRate === 0) continue;

        // Create timesheets for last 3 months
        const today = new Date();
        for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
          const monthStart = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
          const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
          
          // Create 2-4 timesheets per month per user
          const numTimesheets = Math.floor(Math.random() * 3) + 2;
          
          for (let i = 0; i < numTimesheets; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
            
            // Skip future dates
            if (date > today) continue;

            const hours = Math.floor(Math.random() * 6) + 2; // 2-8 hours
            const status = date < new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              ? getRandomElement(['APPROVED', 'APPROVED', 'APPROVED', 'SUBMITTED']) // Older timesheets mostly approved
              : getRandomElement(timesheetStatuses);

            await prisma.timesheet.create({
              data: {
                userId: user.id,
                projectId: project.id,
                date,
                hours,
                description: `Worked on ${getRandomElement(taskDescriptions)}`,
                status,
              },
            });
            timesheetsCreated++;
          }
        }
      }
    }
    console.log(`   ✅ Created ${timesheetsCreated} timesheets\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('✅ Indian Demo Data Generation Complete!\n');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🏢 Departments: ${departments.length}`);
    console.log(`   🏭 Customers: ${customers.length}`);
    console.log(`   📁 Projects: ${projects.length}`);
    console.log(`   👤 Project Members: ${memberAssignments}`);
    console.log(`   ✅ Tasks: ${tasksCreated}`);
    console.log(`   ⏰ Timesheets: ${timesheetsCreated}\n`);
    console.log('🔑 Default Password for all users: password123\n');

  } catch (error) {
    console.error('❌ Error generating demo data:', error);
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

