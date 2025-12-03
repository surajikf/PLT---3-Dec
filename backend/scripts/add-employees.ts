import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface Employee {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  jobTitle: string;
  mobile?: string;
  dateOfJoining?: string;
  birthday?: string;
}

// Map job titles to system roles
function mapJobTitleToRole(jobTitle: string): UserRole {
  if (!jobTitle || jobTitle === '-') {
    return UserRole.TEAM_MEMBER;
  }
  
  const title = jobTitle.toLowerCase();
  
  // Super Admin - CEO, highest authority
  if (title.includes('ceo')) {
    return UserRole.SUPER_ADMIN;
  }
  
  // Admin - COO, Head of, Team Lead, Lead roles
  if (title.includes('coo') || 
      title.includes('chief operating officer') ||
      title.includes('head of') || 
      title.includes('team lead') || 
      title.includes('lead') ||
      title.includes('sr.') && (title.includes('executive') || title.includes('manager'))) {
    return UserRole.ADMIN;
  }
  
  // Project Manager - Managers, Account Managers, Executives
  if (title.includes('manager') || 
      title.includes('account manager') ||
      (title.includes('executive') && !title.includes('intern'))) {
    return UserRole.PROJECT_MANAGER;
  }
  
  // Default to team member
  return UserRole.TEAM_MEMBER;
}

// Normalize name (handle all caps, etc.)
function normalizeName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/);
  
  // Convert to title case
  const titleCase = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  if (parts.length === 1) {
    return {
      firstName: titleCase(parts[0]),
      lastName: titleCase(parts[0])
    };
  }
  
  const firstName = titleCase(parts[0]);
  const lastName = parts.slice(1).map(titleCase).join(' ');
  
  return { firstName, lastName };
}

// Parse employee data
const employeesData: Omit<Employee, 'firstName' | 'lastName'>[] = [
  { name: 'Ashish Dalia', email: 'ashish@ikf.co.in', role: 'CEO', jobTitle: 'CEO', mobile: '9822190551', dateOfJoining: '2000-01-01', birthday: '1975-05-03' },
  { name: 'Amol Tankasale', email: 'support@ikf.co.in', role: 'Technical Support Executive', jobTitle: 'Technical Support Executive', mobile: '8888866104', dateOfJoining: '2008-01-01', birthday: '1985-08-06' },
  { name: 'Gunjan Bhansali', email: 'gunjan@ikf.co.in', role: 'Chief Operating Officer', jobTitle: 'Chief Operating Officer', mobile: '7767066442', dateOfJoining: '2014-11-05', birthday: '1988-10-20' },
  { name: 'Sagar Chavan', email: 'sagar.chavan@ikf.co.in', role: 'Design Team Lead', jobTitle: 'Design Team Lead', mobile: '8600950110', dateOfJoining: '2016-05-25', birthday: '1987-07-13' },
  { name: 'Ritu Dalia', email: 'ritu@ikf.co.in', role: '-', jobTitle: '-', mobile: '9822231631', dateOfJoining: '2018-04-09', birthday: '1979-11-17' },
  { name: 'Neha Kakkad', email: 'neha.kakkad@ikf.co.in', role: 'Head of Sales and Marketing', jobTitle: 'Head of Sales and Marketing', mobile: '9892893517', dateOfJoining: '2024-01-31', birthday: '1990-07-06' },
  { name: 'Suraj Sonnar', email: 'suraj.sonnar@ikf.co.in', role: 'Sr.Test Engineer', jobTitle: 'Sr.Test Engineer', mobile: '9272850850', dateOfJoining: '2019-06-17', birthday: '1992-05-08' },
  { name: 'Dhruvi Gandhi', email: 'dhruvi.gandhi@ikf.co.in', role: 'Sr.Social Media Executive', jobTitle: 'Sr.Social Media Executive', mobile: '9767660616', dateOfJoining: '2021-04-05', birthday: '2002-07-23' },
  { name: 'Pushkar Sangle', email: 'pushkar@ikf.co.in', role: 'Server Admin', jobTitle: 'Server Admin', mobile: '8080579017', dateOfJoining: '2022-04-03', birthday: '1997-11-20' },
  { name: 'Girija Chondhe', email: 'girija.chondhe@ikf.co.in', role: 'Sales - Intern', jobTitle: 'Sales - Intern', mobile: '9673904766', dateOfJoining: '2022-09-20', birthday: '2003-03-14' },
  { name: 'Krupali Masavkar Thorat', email: 'krupali@ikf.co.in', role: 'Sr. Accountant', jobTitle: 'Sr. Accountant', mobile: '8291141975', dateOfJoining: '2023-07-17', birthday: '1996-10-27' },
  { name: 'Amruta Mane', email: 'Amruta.Mane@ikf.co.in', role: 'Business Analyst', jobTitle: 'Business Analyst', mobile: '7030899256', dateOfJoining: '2024-10-01', birthday: '2000-10-06' },
  { name: 'Adarssh Bhagwat', email: 'adarssh.bhagwat@ikf.co.in', role: 'Account Manager- SEO and PPC', jobTitle: 'Account Manager- SEO and PPC', mobile: '7776903811', dateOfJoining: '2024-12-05', birthday: '1998-02-14' },
  { name: 'MAYUR TARATE', email: 'mtarate2004@gmail.com', role: 'AI - LLM INTERN', jobTitle: 'AI - LLM INTERN', mobile: '8010235742', dateOfJoining: '2025-11-24', birthday: '2004-09-20' },
  { name: 'KUNAL THAKARE', email: 'kunalavinashthakare3@gmail.com', role: 'AI - LLM INTERN', jobTitle: 'AI - LLM INTERN', mobile: '8080272822', dateOfJoining: '2025-11-24', birthday: '2006-11-24' },
  { name: 'SAMYAK BHAISARE', email: 'samyakbhaisare99@gmail.com', role: 'AI - LLM INTERN', jobTitle: 'AI - LLM INTERN', mobile: '8010947463', dateOfJoining: '2025-11-24', birthday: '2004-04-15' },
  { name: 'Vaibhav Mane', email: 'vaibhav.mane1@ikf.co.in', role: 'Business Ananlayst-Consultant', jobTitle: 'Business Ananlayst-Consultant', mobile: '8087588026', dateOfJoining: '2020-08-01', birthday: '1993-04-25' },
  { name: 'Vishal Kale', email: 'vishal.kale@ikf.co.in', role: 'Team Lead - Web Design', jobTitle: 'Team Lead - Web Design', mobile: '9730958692', dateOfJoining: '2020-10-05', birthday: '1990-05-24' },
  { name: 'Laxman Kendre', email: 'Laxman.kendre@ikf.co.in', role: 'Software Engineer', jobTitle: 'Software Engineer', mobile: '8668282906', dateOfJoining: '2021-08-30', birthday: '1992-06-25' },
  { name: 'Sunil Chavan', email: 'sunil.chavan@ikf.co.in', role: 'Team Lead - Application', jobTitle: 'Team Lead - Application', mobile: '9011240857', dateOfJoining: '2021-09-16', birthday: '1986-11-02' },
  { name: 'Akshay Pisote', email: 'akshay.pisote@ikf.co.in', role: 'PPC - Intern', jobTitle: 'PPC - Intern', mobile: '7057747515', dateOfJoining: '2022-09-20', birthday: '2000-06-02' },
  { name: 'Apoorva Gholap', email: 'apoorva.gholap@ikf.co.in', role: 'HR Executive', jobTitle: 'HR Executive', mobile: '8237711440', dateOfJoining: '2025-10-07', birthday: '1998-05-12' },
  { name: 'Jahanvi Patel', email: 'jahanvi.patel@ikf.co.in', role: 'HR Recruiter', jobTitle: 'HR Recruiter', mobile: '9766647581', dateOfJoining: '2025-10-07', birthday: '1999-10-18' },
  { name: 'MEGHA RUPAREL', email: 'megha.ruparel@ikf.co.in', role: 'SR. HR EXECUTIVE', jobTitle: 'SR. HR EXECUTIVE', mobile: '8010744302', dateOfJoining: '2025-11-25', birthday: '2002-12-24' },
  { name: 'Rohit Jagtap', email: 'rohit.jagtap@ikf.co.in', role: 'Graphic Designer', jobTitle: 'Graphic Designer', mobile: '8830914117', dateOfJoining: '2022-02-04', birthday: '2000-06-13' },
  { name: 'Abhishek Kadam', email: 'abhishek.kadam@ikf.co.in', role: 'Senior UI /UX Designer', jobTitle: 'Senior UI /UX Designer', mobile: '9423506233', dateOfJoining: '2021-08-23', birthday: '1990-08-12' },
  { name: 'Nitesh Hande', email: 'nitesh.hande@ikf.co.in', role: 'Sr. Graphic Designer', jobTitle: 'Sr. Graphic Designer', mobile: '8149142070', dateOfJoining: '2025-01-06', birthday: '1988-07-17' },
  { name: 'Tanishka Masaliya', email: 'tanishka.masaliya@ikf.co.in', role: 'Sales Executive', jobTitle: 'Sales Executive', mobile: '9359362634', dateOfJoining: '2023-08-23', birthday: '2002-03-02' },
  { name: 'Shweta Patil', email: 'shweta.patil@ikf.co.in', role: 'Social Media Executive', jobTitle: 'Social Media Executive', mobile: '9359576064', dateOfJoining: '2024-01-17', birthday: '2002-11-21' },
  { name: 'Amaan Bhombal', email: 'amaan.bhombal@ikf.co.in', role: 'Social Media Executive', jobTitle: 'Social Media Executive', mobile: '8308261002', dateOfJoining: '2023-12-18', birthday: '2002-10-26' },
  { name: 'Pranav Yadav', email: 'pranav.yadav@ikf.co.in', role: 'Media Production & Content Creator', jobTitle: 'Media Production & Content Creator', mobile: '8888718804', dateOfJoining: '2024-02-06', birthday: '2000-06-08' },
  { name: 'Nikhil Gurav', email: 'nikhil.gurav@ikf.co.in', role: 'Video Editor', jobTitle: 'Video Editor', mobile: '8446050581', dateOfJoining: '2024-05-15', birthday: '1992-08-03' },
  { name: 'Varad Ghore', email: 'varad.Ghore@ikf.co.in', role: 'Video Editor', jobTitle: 'Video Editor', mobile: '9834254702', dateOfJoining: '2024-10-23', birthday: '2005-02-12' },
  { name: 'Avisha Meshram', email: 'avisha.meshram@ikf.co.in', role: 'Copywriter', jobTitle: 'Copywriter', mobile: '9145482228', dateOfJoining: '2025-08-20', birthday: '2006-10-20' },
  { name: 'Khushbu Mantri', email: 'ikfkhushbu@gmail.com', role: 'Social Media Intern', jobTitle: 'Social Media Intern', mobile: '9921171818', dateOfJoining: '2025-11-04', birthday: '2004-01-22' },
  { name: 'Amit Ranaware', email: 'amit.ranaware@ikf.co.in', role: 'System Admin', jobTitle: 'System Admin', mobile: '9011813339', dateOfJoining: '2023-11-01', birthday: '1994-08-11' },
  { name: 'Pooja Purushottam Jambagi', email: 'Pooja.Jambagi@ikf.co.in', role: 'Account Executive', jobTitle: 'Account Executive', mobile: '8379076919', dateOfJoining: '2025-01-01', birthday: '2002-09-04' },
  { name: 'Ganesh Wagh', email: 'ganesh.wagh@ikf.co.in', role: 'SEO Analyst', jobTitle: 'SEO Analyst', mobile: '8975469356', dateOfJoining: '2022-05-24', birthday: '1995-09-07' },
  { name: 'Dheeraj Chuttar', email: 'dheeraj.chuttar@ikf.co.in', role: 'SEO Analyst', jobTitle: 'SEO Analyst', mobile: '9511751322', dateOfJoining: '2023-02-01', birthday: '1990-05-13' },
  { name: 'Ruchita Tambitkar', email: 'ruchita.tambitkar@ikf.co.in', role: 'SEO Executive', jobTitle: 'SEO Executive', mobile: '8999502761', dateOfJoining: '2023-09-05', birthday: '2000-02-13' },
  { name: 'Sayali Aniruddha Dhotre', email: 'sayali.dhotre@ikf.co.in', role: 'Sr.PPC Executive', jobTitle: 'Sr.PPC Executive', mobile: '9960869019', dateOfJoining: '2024-07-02', birthday: '1997-02-01' },
  { name: 'Kishor Mokashi', email: 'kishor.mokashi@ikf.co.in', role: 'UI Developer', jobTitle: 'UI Developer', mobile: '7588447151', dateOfJoining: '2016-05-13', birthday: '1989-03-16' },
  { name: 'Aditya Kawankar', email: 'aditya.kawankar@ikf.co.in', role: 'Sr. UI Developer', jobTitle: 'Sr. UI Developer', mobile: '8087603018', dateOfJoining: '2018-02-26', birthday: '1992-02-02' },
  { name: 'Pavan Gaikwad', email: 'pavan.gaikwad@ikf.co.in', role: 'UI Developer', jobTitle: 'UI Developer', mobile: '8805173330', dateOfJoining: '2022-02-09', birthday: '1998-06-03' },
  { name: 'Saurabh Gunjkar', email: 'saurabh.gunjkar@ikf.co.in', role: 'UI Developer', jobTitle: 'UI Developer', mobile: '8888680972', dateOfJoining: '2022-03-22', birthday: '1996-08-30' },
  { name: 'Pranay Gaynar', email: 'pranay.gaynar@ikf.co.in', role: 'Software Engineer', jobTitle: 'Software Engineer', mobile: '9307768467', dateOfJoining: '2025-01-09', birthday: '2001-05-05' },
  { name: 'Pawan Sharad Shimpi', email: 'pawan.shimpi@ikf.co.in', role: 'Software Engineer', jobTitle: 'Software Engineer', mobile: '9921353589', dateOfJoining: '2025-02-13', birthday: '2001-09-21' },
];

async function main() {
  console.log('🚀 Starting employee import...');
  console.log(`   Total employees: ${employeesData.length}\n`);

  const defaultPassword = await bcrypt.hash('password123', 10);
  const department = await prisma.department.findFirst({
    where: { name: 'Development' },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const emp of employeesData) {
    try {
      // Parse and normalize name
      const { firstName, lastName } = normalizeName(emp.name);

      // Determine role
      const userRole = mapJobTitleToRole(emp.jobTitle);

      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { email: emp.email.toLowerCase() },
      });

      if (existing) {
        // Update existing user
        await prisma.user.update({
          where: { email: emp.email.toLowerCase() },
          data: {
            firstName,
            lastName,
            role: userRole,
            departmentId: department?.id || null,
          },
        });
        updated++;
        console.log(`   ✓ Updated: ${emp.name} (${emp.email})`);
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email: emp.email.toLowerCase(),
            password: defaultPassword,
            firstName,
            lastName,
            role: userRole,
            departmentId: department?.id || null,
            hourlyRate: null, // Set hourly rates later if needed
            isActive: true,
          },
        });
        created++;
        console.log(`   + Created: ${emp.name} (${emp.email}) - Role: ${userRole}`);
      }
    } catch (error: any) {
      skipped++;
      const errorMsg = `   ✗ Error with ${emp.name} (${emp.email}): ${error.message}`;
      errors.push(errorMsg);
      console.log(errorMsg);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Import Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (errors.length > 0) {
    console.log('Errors encountered:');
    errors.forEach((err) => console.log(err));
  }

  console.log('\n✅ Employee import completed!');
  console.log('\n📋 Default Password for all employees: password123');
  console.log('   ⚠️  Users should change their passwords after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

