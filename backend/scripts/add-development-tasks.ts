import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard development workflow tasks
const developmentTasks = [
  // Planning & Content Phase
  {
    title: 'Content Writing',
    description: 'Writing content for website/application',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Content Research & Planning',
    description: 'Researching topics and planning content strategy',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Content Editing & Proofreading',
    description: 'Editing and proofreading content',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'SEO Content Optimization',
    description: 'Optimizing content for search engines',
    priority: 'MEDIUM',
    status: 'TODO',
  },

  // Design Phase
  {
    title: 'UI/UX Design',
    description: 'Creating user interface and user experience designs',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Wireframing',
    description: 'Creating wireframes for the application',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Prototype Design',
    description: 'Creating interactive prototypes',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Design Review',
    description: 'Reviewing and refining designs',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Asset Creation',
    description: 'Creating graphics, icons, and visual assets',
    priority: 'MEDIUM',
    status: 'TODO',
  },

  // Development Phase - Frontend
  {
    title: 'Frontend Development',
    description: 'Building the frontend interface',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'HTML/CSS Implementation',
    description: 'Converting designs to HTML and CSS',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'JavaScript Development',
    description: 'Implementing interactive functionality',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'React Component Development',
    description: 'Building React components',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Responsive Design Implementation',
    description: 'Making the application responsive across devices',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Frontend State Management',
    description: 'Implementing state management (Redux, Context, etc.)',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'API Integration (Frontend)',
    description: 'Integrating frontend with backend APIs',
    priority: 'HIGH',
    status: 'TODO',
  },

  // Development Phase - Backend
  {
    title: 'Backend Development',
    description: 'Building backend API and server logic',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Database Design',
    description: 'Designing and setting up database schema',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'API Development',
    description: 'Developing RESTful APIs',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Authentication Implementation',
    description: 'Implementing user authentication system',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Business Logic Implementation',
    description: 'Implementing core business logic',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Third-party Integration',
    description: 'Integrating third-party services',
    priority: 'MEDIUM',
    status: 'TODO',
  },

  // Testing Phase
  {
    title: 'Unit Testing',
    description: 'Writing and executing unit tests',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Integration Testing',
    description: 'Testing integration between components',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Functional Testing',
    description: 'Testing application functionality',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'User Acceptance Testing (UAT)',
    description: 'Client/user acceptance testing',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Performance Testing',
    description: 'Testing application performance',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Security Testing',
    description: 'Testing application security',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Cross-browser Testing',
    description: 'Testing across different browsers',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Mobile Testing',
    description: 'Testing on mobile devices',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Bug Fixing',
    description: 'Fixing identified bugs',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Regression Testing',
    description: 'Re-testing after bug fixes',
    priority: 'MEDIUM',
    status: 'TODO',
  },

  // Deployment & Production
  {
    title: 'Environment Setup',
    description: 'Setting up development/staging/production environments',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'CI/CD Pipeline Setup',
    description: 'Setting up continuous integration/deployment',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Deployment Preparation',
    description: 'Preparing application for deployment',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Staging Deployment',
    description: 'Deploying to staging environment',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Production Deployment',
    description: 'Deploying to production environment',
    priority: 'URGENT',
    status: 'TODO',
  },
  {
    title: 'Post-deployment Testing',
    description: 'Testing after production deployment',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Production Monitoring Setup',
    description: 'Setting up monitoring and logging',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Documentation',
    description: 'Writing technical and user documentation',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Code Review',
    description: 'Reviewing code before deployment',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Database Migration',
    description: 'Running database migrations',
    priority: 'HIGH',
    status: 'TODO',
  },

  // Maintenance & Support
  {
    title: 'Production Support',
    description: 'Providing support for production issues',
    priority: 'HIGH',
    status: 'TODO',
  },
  {
    title: 'Performance Optimization',
    description: 'Optimizing application performance',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Feature Enhancement',
    description: 'Adding new features or enhancements',
    priority: 'MEDIUM',
    status: 'TODO',
  },
  {
    title: 'Server Maintenance',
    description: 'Performing server maintenance tasks',
    priority: 'MEDIUM',
    status: 'TODO',
  },
];

async function main() {
  console.log('🚀 Adding development tasks to all projects...\n');

  // Get all active projects
  const projects = await prisma.project.findMany({
    where: {
      status: {
        not: 'CANCELLED',
      },
    },
  });

  if (projects.length === 0) {
    console.log('   ⚠️  No projects found. Please create projects first.');
    return;
  }

  // Get a super admin user to assign as creator
  const adminUser = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
    },
  });

  if (!adminUser) {
    console.log('   ⚠️  No super admin user found. Tasks cannot be created.');
    return;
  }

  console.log(`   Found ${projects.length} projects\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const project of projects) {
    console.log(`   Processing: ${project.name} (${project.code})`);

    // Check existing tasks for this project
    const existingTasks = await prisma.task.findMany({
      where: { projectId: project.id },
      select: { title: true },
    });

    const existingTitles = new Set(existingTasks.map(t => t.title.toLowerCase()));

    let created = 0;
    let skipped = 0;

    for (const taskTemplate of developmentTasks) {
      // Skip if task already exists
      if (existingTitles.has(taskTemplate.title.toLowerCase())) {
        skipped++;
        continue;
      }

      try {
        await prisma.task.create({
          data: {
            projectId: project.id,
            title: taskTemplate.title,
            description: taskTemplate.description,
            priority: taskTemplate.priority,
            status: taskTemplate.status,
            createdById: adminUser.id,
          },
        });
        created++;
        totalCreated++;
      } catch (error: any) {
        console.error(`     ❌ Error creating task "${taskTemplate.title}": ${error.message}`);
        skipped++;
        totalSkipped++;
      }
    }

    console.log(`     ✅ Created: ${created} tasks, ⚠️  Skipped: ${skipped} existing tasks`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${totalCreated} tasks`);
  console.log(`   ⚠️  Skipped: ${totalSkipped} tasks (already exist)`);
  console.log(`   📁 Projects processed: ${projects.length}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('✅ Development tasks added successfully!');
  console.log('\n📋 Task Categories Added:');
  console.log('   - Planning & Content (4 tasks)');
  console.log('   - Design Phase (5 tasks)');
  console.log('   - Frontend Development (7 tasks)');
  console.log('   - Backend Development (6 tasks)');
  console.log('   - Testing Phase (10 tasks)');
  console.log('   - Deployment & Production (9 tasks)');
  console.log('   - Maintenance & Support (4 tasks)');
  console.log('\n💡 Total: ~45 standard development tasks per project');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

