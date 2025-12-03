import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface ProjectData {
  name: string;
  key: string;
  type: string;
  lead: string;
  lastWorkUpdate?: string;
}

// Map lead names to employee emails
const leadEmailMap: Record<string, string> = {
  'Suraj Sonnar': 'suraj.sonnar@ikf.co.in',
  'Vishal Kale': 'vishal.kale@ikf.co.in',
  'Saurabh Gunjkar': 'saurabh.gunjkar@ikf.co.in',
  'Aditya Kawankar': 'aditya.kawankar@ikf.co.in',
  'Amit Narayan Dharmkamble': 'amit.ranaware@ikf.co.in', // Assuming this is Amit Ranaware
};

// Parse project data from the provided list
const projectsData: ProjectData[] = [
  { name: 'ADVIK', key: 'AD', type: 'Company-managed software', lead: 'Suraj Sonnar' },
  { name: 'Al Salem Trading Enterprises LLC', key: 'ASTEL', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: '10 months ago' },
  { name: 'Alkylamines Client Side', key: 'ALKYL', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '3 years ago' },
  { name: 'Alkylamines Internal IKF', key: 'AL', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'Alligator', key: 'LLGTR', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last year' },
  { name: 'AmSquare', key: 'AM', type: 'Company-managed software', lead: 'Saurabh Gunjkar', lastWorkUpdate: '2 years ago' },
  { name: 'Avant-Garde | 11-07-24', key: 'AG', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last year' },
  { name: 'Axxela', key: 'AX', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last year' },
  { name: 'Baumer', key: 'BAUM', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '5 months ago' },
  { name: 'BUMZEE', key: 'BUM', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'BUMZEE | 03-03-2025', key: 'B02', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '9 months ago' },
  { name: 'CEE DEE', key: 'CD', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'CLWT', key: 'CLWT', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '8 months ago' },
  { name: 'Cosmetic Surgery Pune', key: 'CSP', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last year' },
  { name: 'Crest Test', key: 'CT', type: 'Team-managed software', lead: 'Vishal Kale', lastWorkUpdate: '2 years ago' },
  { name: 'DBL - 13-03-2025', key: 'DBL', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'Diamond BP', key: 'DB', type: 'Team-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '2 years ago' },
  { name: 'DiamondHCare', key: 'DIAM', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'DNPL', key: 'DNPL', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last month' },
  { name: 'DP Control', key: 'DC', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'Duraklean', key: 'DURAKLEAN', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '5 months ago' },
  { name: 'Dynomerk', key: 'DYN', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: '2 years ago' },
  { name: 'EBS - European Bartender School', key: 'EEBS', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '7 months ago' },
  { name: 'Endurance', key: 'NDRNC', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'EngineTech Systems', key: 'EN', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'ESCON', key: 'ES', type: 'Team-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last month' },
  { name: 'FarmBeauty', key: 'FAR', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'FORCE MOTORS | 18-02-2025', key: 'FM102', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'Fristam Pumps 2023', key: 'F2', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last month' },
  { name: 'Gensol', key: 'GEN', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last year' },
  { name: 'Global Vegetarian', key: 'TVG', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '11 months ago' },
  { name: 'Godrej', key: 'GOD', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: '5 months ago' },
  { name: 'GRIND MASTER | 15-11-2024', key: 'GM112', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last year' },
  { name: 'Helplast', key: 'HEL', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'HITCON', key: 'HITC', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'IKF Recruit Dev', key: 'IRD', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'IKF Task Manager', key: 'ITM', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'IKF Website 2025', key: 'IW2', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'IKF_2022', key: 'IKF2022', type: 'Team-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last month' },
  { name: 'ImageProVision', key: 'IM', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '5 months ago' },
  { name: 'IndiTech', key: 'IN', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last year' },
  { name: 'Intervaule Poonawala LTD', key: 'IPLTD', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'Invoice System', key: 'IS', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'JYOTIGAS', key: 'JYOT', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '5 months ago' },
  { name: 'KalyaniTechnoForge', key: 'KAL', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last month' },
  { name: 'KC Overseas', key: 'KO', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last month' },
  { name: 'KMPL', key: 'KMPL', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '3 years ago' },
  { name: 'LexFamilia', key: 'LEX', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '5 months ago' },
  { name: 'Link_Composites', key: 'LC', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last year' },
  { name: 'Litmus', key: 'LIT', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'Maestrotech', key: 'MAES', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'Majestique', key: 'MAJ', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'MariGold', key: 'MAR', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'ME Energy', key: 'ME', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'Metalpatti', key: 'MT', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'MetaSys', key: 'MET', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'Metasys 2023', key: 'M2', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'MindGate 2024', key: 'MIN', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'MIT BIO', key: 'MB', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'MIT-BSR', key: 'MIT', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '4 months ago' },
  { name: 'MoiMedia', key: 'MOIM', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 months ago' },
  { name: 'My discovery project', key: 'MDP', type: 'Product Discovery', lead: 'Suraj Sonnar', lastWorkUpdate: '8 months ago' },
  { name: 'MYRAH SPA', key: 'MS', type: 'Team-managed software', lead: 'Suraj Sonnar' },
  { name: 'OG Valves', key: 'OG', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '9 months ago' },
  { name: 'OG-Valves | Landing Page', key: 'OV', type: 'Team-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last year' },
  { name: 'OPTIMA | 02-02-2025', key: 'O02', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '11 months ago' },
  { name: 'Pooja Casting', key: 'PC', type: 'Team-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'PRAVI-AUTO', key: 'PA', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'Reyansh | 21-01-2025', key: 'R202', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '11 months ago' },
  { name: 'Rovema 26-07-2024', key: 'ROVEMA', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'RWPL', key: 'RWPL', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'SafeHouse', key: 'SAF', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'Sales Lead 1', key: 'SL1', type: 'Team-managed business', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'Sales Lead 2', key: 'SL2', type: 'Team-managed business', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'Sampige | 17-12-2024', key: 'S112', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last year' },
  { name: 'Sancheti', key: 'SAN', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last month' },
  { name: 'Shivam Steel : 07/10/2024', key: 'SS0', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'Shogini', key: 'SHOG', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '2 years ago' },
  { name: 'Skipped Project', key: 'FP', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last month' },
  { name: 'SoWhat', key: 'SOW', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '2 years ago' },
  { name: 'Study Smart', key: 'SS', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last year' },
  { name: 'STUDY SMART NEW : 01-08-2024', key: 'SSN002', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last year' },
  { name: 'Sudarshan-', key: 'SUDARSHAN', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: '2 months ago' },
  { name: 'SumaShilp', key: 'SUM', type: 'Team-managed business', lead: 'Suraj Sonnar', lastWorkUpdate: '6 months ago' },
  { name: 'SUVJAY', key: 'SUV', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: '3 years ago' },
  { name: 'SUVJAY 2024', key: 'S2', type: 'Company-managed software', lead: 'Vishal Kale', lastWorkUpdate: 'Last year' },
  { name: 'Symbiosis Centre for Corporate Education (SCCE)', key: 'SCFCES', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '5 months ago' },
  { name: 'TACC | 03-03-2025', key: 'T02', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: 'Last month' },
  { name: 'TedraAuto', key: 'TED', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'test', key: 'TEST', type: 'Product Discovery', lead: 'Suraj Sonnar', lastWorkUpdate: '8 months ago' },
  { name: 'TIMESHEET 2024', key: 'TM', type: 'Company-managed software', lead: 'Amit Narayan Dharmkamble', lastWorkUpdate: 'Last year' },
  { name: 'Vibe-Realty', key: 'VR', type: 'Team-managed software', lead: 'Vishal Kale', lastWorkUpdate: '2 years ago' },
  { name: 'Vision_Infra', key: 'VI', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'Voisetech', key: 'VOIS', type: 'Company-managed software', lead: 'Aditya Kawankar', lastWorkUpdate: '3 months ago' },
  { name: 'Web Designing Landing Page', key: 'WDLP', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
  { name: 'WPIL - 10-11-2025', key: 'W112', type: 'Company-managed software', lead: 'Suraj Sonnar', lastWorkUpdate: 'Last month' },
];

// Get default stages for projects
async function getDefaultStages() {
  return await prisma.stage.findMany({
    where: { isActive: true },
    orderBy: { defaultWeight: 'desc' },
  });
}

// Determine project status based on last work update
function getProjectStatus(lastWorkUpdate?: string): ProjectStatus {
  if (!lastWorkUpdate) {
    return ProjectStatus.IN_PROGRESS;
  }

  const update = lastWorkUpdate.toLowerCase();
  
  if (update.includes('last month') || update.includes('months ago') && parseInt(update) <= 3) {
    return ProjectStatus.IN_PROGRESS;
  }
  if (update.includes('years ago') || (update.includes('months ago') && parseInt(update) > 6)) {
    return ProjectStatus.ON_HOLD;
  }
  
  return ProjectStatus.IN_PROGRESS;
}

async function main() {
  console.log('🚀 Starting project import...');
  console.log(`   Total projects: ${projectsData.length}\n`);

  // Get default stages
  const stages = await getDefaultStages();
  if (stages.length === 0) {
    console.log('   ⚠️  No stages found. Please run seed first.');
    return;
  }

  // Get development department (default)
  const department = await prisma.department.findFirst({
    where: { name: 'Development' },
  });

  // Get admin user as creator
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.log('   ❌ No admin user found. Please run seed first.');
    return;
  }

  // Build user email lookup
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  const userByEmail = new Map(users.map(u => [u.email.toLowerCase(), u]));
  const userByName = new Map<string, any>();

  // Build name lookup
  users.forEach(user => {
    const fullName = `${user.firstName} ${user.lastName}`;
    userByName.set(fullName.toLowerCase(), user);
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const projectData of projectsData) {
    try {
      // Find manager by lead name
      let managerId: string | null = null;
      
      // Try email map first
      const email = leadEmailMap[projectData.lead];
      if (email) {
        const user = userByEmail.get(email.toLowerCase());
        if (user) {
          managerId = user.id;
        }
      }

      // Try name lookup if email map didn't work
      if (!managerId) {
        const user = userByName.get(projectData.lead.toLowerCase());
        if (user) {
          managerId = user.id;
        }
      }

      // Determine status
      const status = getProjectStatus(projectData.lastWorkUpdate);

      // Check if project exists
      const existing = await prisma.project.findUnique({
        where: { code: projectData.key },
      });

      if (existing) {
        // Update existing project
        await prisma.project.update({
          where: { code: projectData.key },
          data: {
            name: projectData.name,
            status,
            managerId: managerId || existing.managerId,
          },
        });
        updated++;
        console.log(`   ✓ Updated: ${projectData.name} (${projectData.key})`);
      } else {
        // Create new project
        const project = await prisma.project.create({
          data: {
            code: projectData.key,
            name: projectData.name,
            description: `Project type: ${projectData.type}`,
            managerId: managerId,
            departmentId: department?.id || null,
            status,
            budget: 0,
            createdById: adminUser.id,
          },
        });

        // Add default stages to project
        for (const stage of stages) {
          await prisma.projectStage.create({
            data: {
              projectId: project.id,
              stageId: stage.id,
              weight: stage.defaultWeight,
              status: 'OFF',
            },
          });
        }

        created++;
        const managerInfo = managerId ? 'with manager' : 'without manager';
        console.log(`   + Created: ${projectData.name} (${projectData.key}) - ${managerInfo}`);
      }
    } catch (error: any) {
      skipped++;
      const errorMsg = `   ✗ Error with ${projectData.name} (${projectData.key}): ${error.message}`;
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

  console.log('\n✅ Project import completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

