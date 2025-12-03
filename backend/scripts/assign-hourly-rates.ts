import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Employee joining dates - extracted from add-employees.ts
// Format: lowercase email -> joining date
const employeeJoiningDates: Record<string, string> = {
  'ashish@ikf.co.in': '2000-01-01',
  'support@ikf.co.in': '2008-01-01',
  'gunjan@ikf.co.in': '2014-11-05',
  'sagar.chavan@ikf.co.in': '2016-05-25',
  'ritu@ikf.co.in': '2018-04-09',
  'neha.kakkad@ikf.co.in': '2024-01-31',
  'suraj.sonnar@ikf.co.in': '2019-06-17',
  'dhruvi.gandhi@ikf.co.in': '2021-04-05',
  'pushkar@ikf.co.in': '2022-04-03',
  'girija.chondhe@ikf.co.in': '2022-09-20',
  'krupali@ikf.co.in': '2023-07-17',
  'amruta.mane@ikf.co.in': '2024-10-01',
  'adarssh.bhagwat@ikf.co.in': '2024-12-05',
  'mtarate2004@gmail.com': '2025-11-24',
  'kunalavinashthakare3@gmail.com': '2025-11-24',
  'samyakbhaisare99@gmail.com': '2025-11-24',
  'vaibhav.mane1@ikf.co.in': '2020-08-01',
  'vishal.kale@ikf.co.in': '2020-10-05',
  'laxman.kendre@ikf.co.in': '2021-08-30',
  'sunil.chavan@ikf.co.in': '2021-09-16',
  'akshay.pisote@ikf.co.in': '2022-09-20',
  'apoorva.gholap@ikf.co.in': '2025-10-07',
  'jahanvi.patel@ikf.co.in': '2025-10-07',
  'megha.ruparel@ikf.co.in': '2025-11-25',
  'rohit.jagtap@ikf.co.in': '2022-02-04',
  'abhishek.kadam@ikf.co.in': '2021-08-23',
  'nitesh.hande@ikf.co.in': '2025-01-06',
  'tanishka.masaliya@ikf.co.in': '2023-08-23',
  'shweta.patil@ikf.co.in': '2024-01-17',
  'amaan.bhombal@ikf.co.in': '2023-12-18',
  'pranav.yadav@ikf.co.in': '2024-02-06',
  'nikhil.gurav@ikf.co.in': '2024-05-15',
  'varad.ghore@ikf.co.in': '2024-10-23',
  'avisha.meshram@ikf.co.in': '2025-08-20',
  'ikfkhushbu@gmail.com': '2025-11-04',
  'amit.ranaware@ikf.co.in': '2023-11-01',
  'pooja.jambagi@ikf.co.in': '2025-01-01',
  'ganesh.wagh@ikf.co.in': '2022-05-24',
  'dheeraj.chuttar@ikf.co.in': '2023-02-01',
  'ruchita.tambitkar@ikf.co.in': '2023-09-05',
  'sayali.dhotre@ikf.co.in': '2024-07-02',
  'kishor.mokashi@ikf.co.in': '2016-05-13',
  'aditya.kawankar@ikf.co.in': '2018-02-26',
  'pavan.gaikwad@ikf.co.in': '2022-02-09',
  'saurabh.gunjkar@ikf.co.in': '2022-03-22',
  'pranay.gaynar@ikf.co.in': '2025-01-09',
  'pawan.shimpi@ikf.co.in': '2025-02-13',
};

/**
 * Calculate years of experience from joining date
 */
function calculateExperience(joiningDate: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - joiningDate.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, diffYears); // Ensure non-negative
}

/**
 * Get base hourly rate based on experience and role
 * Rates in INR (₹)
 */
function getBaseHourlyRate(experience: number, role: string, jobTitle: string = ''): number {
  const roleLower = role.toLowerCase();
  const titleLower = jobTitle.toLowerCase();
  
  // Super Admin / CEO - Highest rates
  if (roleLower.includes('super_admin') || roleLower.includes('ceo')) {
    return 800 + (experience * 50) + Math.random() * 200; // ₹800-1500+
  }
  
  // Admin / COO / Head of Department
  if (roleLower.includes('admin') || roleLower.includes('coo') || 
      titleLower.includes('head of') || titleLower.includes('chief operating')) {
    return 600 + (experience * 40) + Math.random() * 150; // ₹600-1200+
  }
  
  // Project Manager / Team Lead / Account Manager
  if (roleLower.includes('project_manager') || 
      titleLower.includes('manager') || 
      titleLower.includes('team lead') || 
      titleLower.includes('lead')) {
    return 400 + (experience * 30) + Math.random() * 100; // ₹400-800+
  }
  
  // Senior roles (Sr., Senior)
  if (titleLower.includes('sr.') || titleLower.includes('senior')) {
    if (experience < 3) {
      return 300 + (experience * 25) + Math.random() * 80;
    } else {
      return 350 + (experience * 30) + Math.random() * 100;
    }
  }
  
  // Intern roles - Lowest rates
  if (titleLower.includes('intern')) {
    return 100 + (experience * 10) + Math.random() * 50; // ₹100-200
  }
  
  // Regular employees based on experience
  if (experience < 0.5) {
    // Less than 6 months - Entry level
    return 150 + Math.random() * 50; // ₹150-200
  } else if (experience < 1) {
    // 6 months to 1 year
    return 200 + Math.random() * 50; // ₹200-250
  } else if (experience < 3) {
    // 1-3 years - Junior/Mid level
    return 250 + (experience * 30) + Math.random() * 80; // ₹250-450
  } else if (experience < 5) {
    // 3-5 years - Mid level
    return 300 + (experience * 25) + Math.random() * 100; // ₹400-650
  } else {
    // 5+ years - Senior level
    return 450 + (experience * 20) + Math.random() * 150; // ₹550-900+
  }
}

/**
 * Assign hourly rate based on experience
 */
function calculateHourlyRate(joiningDate: Date, role: string, jobTitle: string = ''): number {
  const experience = calculateExperience(joiningDate);
  const baseRate = getBaseHourlyRate(experience, role, jobTitle);
  
  // Round to nearest 10 (for cleaner numbers) and ensure minimum of ₹100
  return Math.max(100, Math.round(baseRate / 10) * 10);
}

async function main() {
  console.log('🚀 Starting hourly rate assignment based on experience...\n');

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      hourlyRate: true,
      createdAt: true,
    },
  });

  console.log(`   Found ${users.length} active users\n`);

  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      const emailKey = user.email.toLowerCase();
      
      // Try to get joining date from mapping, fallback to createdAt
      let joiningDate: Date;
      
      if (employeeJoiningDates[emailKey]) {
        joiningDate = new Date(employeeJoiningDates[emailKey]);
      } else {
        // Use createdAt as joining date if not in mapping
        joiningDate = user.createdAt;
        console.log(`   ⚠️  No joining date found for ${user.email}, using createdAt`);
      }

      // Calculate hourly rate based on experience
      // For job title, we'll use role as approximation
      const hourlyRate = calculateHourlyRate(joiningDate, user.role);
      const experience = calculateExperience(joiningDate);

      // Update user with calculated hourly rate
      await prisma.user.update({
        where: { id: user.id },
        data: { hourlyRate },
      });

      updated++;
      
      const experienceDisplay = experience < 1 
        ? `${Math.round(experience * 12)} months`
        : `${experience.toFixed(1)} years`;
      
      console.log(`   ✓ ${user.firstName} ${user.lastName}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Experience: ${experienceDisplay} | Role: ${user.role} | Rate: ₹${hourlyRate}/hr\n`);
      
    } catch (error: any) {
      skipped++;
      errors.push(`Failed to update ${user.email}: ${error.message}`);
      console.error(`   ✗ Error updating ${user.email}: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (errors.length > 0) {
    console.error('\nErrors encountered:');
    errors.forEach(err => console.error(`- ${err}`));
  }

  console.log('\n✅ Hourly rate assignment completed!');
  console.log('\n💡 Hourly rates are calculated based on:');
  console.log('   - Years of experience in the company (from joining date)');
  console.log('   - Role and seniority level');
  console.log('   - Random variation for realistic distribution');
  console.log('\n📊 Rate Ranges:');
  console.log('   - Intern: ₹100-200/hr');
  console.log('   - Entry Level (<1yr): ₹150-250/hr');
  console.log('   - Junior (1-3yr): ₹250-450/hr');
  console.log('   - Mid Level (3-5yr): ₹400-650/hr');
  console.log('   - Senior (5+yr): ₹550-900+/hr');
  console.log('   - Team Lead/Manager: ₹400-800+/hr');
  console.log('   - Admin/Head: ₹600-1200+/hr');
  console.log('   - CEO/Super Admin: ₹800-1500+/hr');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
