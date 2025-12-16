import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting resource data generation...\n');

  // Get existing data
  const users = await prisma.user.findMany({
    where: { 
      isActive: true,
      role: { in: ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'] }
    },
    take: 1,
  });

  const projects = await prisma.project.findMany({
    take: 10,
  });

  if (users.length === 0) {
    console.log('   ⚠️  No admin/manager users found. Please create users first.');
    return;
  }

  const creator = users[0];

  // Dummy resources data
  const resources = [
    // Sitemap Documents
    {
      name: 'Main Website Sitemap',
      description: 'Complete sitemap structure for the main website including all pages and navigation hierarchy.',
      type: 'Sitemap Documents',
      url: 'https://drive.google.com/drive/folders/example-sitemap',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'Mobile App Navigation Map',
      description: 'Navigation structure and user flow diagrams for mobile application.',
      type: 'Sitemap Documents',
      url: 'https://drive.google.com/drive/folders/example-mobile-sitemap',
      accessLevel: 'Team',
      projectId: projects[1]?.id || null,
    },
    {
      name: 'E-commerce Site Structure',
      description: 'Complete sitemap for e-commerce platform with product categories and checkout flow.',
      type: 'Sitemap Documents',
      url: 'https://drive.google.com/drive/folders/example-ecommerce-sitemap',
      accessLevel: 'Public',
      projectId: projects[2]?.id || null,
    },

    // Content Folders
    {
      name: 'Marketing Content Library',
      description: 'Centralized folder containing all marketing materials, blog posts, and social media content.',
      type: 'Content Folders',
      url: 'https://drive.google.com/drive/folders/example-marketing-content',
      accessLevel: 'Team',
      projectId: null, // Global resource
    },
    {
      name: 'Product Documentation',
      description: 'Comprehensive product documentation including user guides, API docs, and technical specifications.',
      type: 'Content Folders',
      url: 'https://drive.google.com/drive/folders/example-product-docs',
      accessLevel: 'Public',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'Client Communication Templates',
      description: 'Email templates, proposal templates, and client communication guidelines.',
      type: 'Content Folders',
      url: 'https://drive.google.com/drive/folders/example-client-templates',
      accessLevel: 'Team',
      projectId: null, // Global resource
    },

    // Design Assets
    {
      name: 'Brand Style Guide',
      description: 'Complete brand guidelines including logo variations, color palette, typography, and usage rules.',
      type: 'Design Assets',
      url: 'https://drive.google.com/drive/folders/example-brand-guide',
      accessLevel: 'Public',
      projectId: null, // Global resource
    },
    {
      name: 'UI Component Library',
      description: 'Figma design system with reusable UI components, icons, and design patterns.',
      type: 'Design Assets',
      url: 'https://www.figma.com/file/example-component-library',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'Icon Set - Material Design',
      description: 'Complete icon library following Material Design guidelines for consistent UI.',
      type: 'Design Assets',
      url: 'https://drive.google.com/drive/folders/example-icons',
      accessLevel: 'Team',
      projectId: projects[1]?.id || null,
    },
    {
      name: 'Illustration Assets',
      description: 'Custom illustrations and graphics for marketing and product pages.',
      type: 'Design Assets',
      url: 'https://drive.google.com/drive/folders/example-illustrations',
      accessLevel: 'Team',
      projectId: projects[2]?.id || null,
    },

    // Development Handoff Files
    {
      name: 'Frontend Development Specs',
      description: 'Detailed technical specifications, API endpoints, and integration guidelines for frontend development.',
      type: 'Development Handoff Files',
      url: 'https://drive.google.com/drive/folders/example-frontend-specs',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'Backend API Documentation',
      description: 'Complete API documentation with endpoints, request/response formats, and authentication details.',
      type: 'Development Handoff Files',
      url: 'https://docs.example.com/api',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'Database Schema Documentation',
      description: 'ER diagrams, database schema, and data model documentation.',
      type: 'Development Handoff Files',
      url: 'https://drive.google.com/drive/folders/example-db-schema',
      accessLevel: 'Restricted',
      projectId: projects[1]?.id || null,
    },
    {
      name: 'Deployment Guide',
      description: 'Step-by-step deployment instructions, environment configurations, and CI/CD pipeline documentation.',
      type: 'Development Handoff Files',
      url: 'https://drive.google.com/drive/folders/example-deployment',
      accessLevel: 'Restricted',
      projectId: null, // Global resource
    },

    // QA Checklists
    {
      name: 'Functional Testing Checklist',
      description: 'Comprehensive checklist for functional testing covering all features and user flows.',
      type: 'QA Checklists',
      url: 'https://drive.google.com/drive/folders/example-functional-qa',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'Cross-Browser Testing Matrix',
      description: 'Testing checklist for browser compatibility across Chrome, Firefox, Safari, and Edge.',
      type: 'QA Checklists',
      url: 'https://drive.google.com/drive/folders/example-browser-testing',
      accessLevel: 'Team',
      projectId: projects[1]?.id || null,
    },
    {
      name: 'Mobile Device Testing Guide',
      description: 'Testing procedures for iOS and Android devices including various screen sizes.',
      type: 'QA Checklists',
      url: 'https://drive.google.com/drive/folders/example-mobile-testing',
      accessLevel: 'Team',
      projectId: projects[2]?.id || null,
    },
    {
      name: 'Security Testing Checklist',
      description: 'Security audit checklist covering authentication, authorization, and data protection.',
      type: 'QA Checklists',
      url: 'https://drive.google.com/drive/folders/example-security-qa',
      accessLevel: 'Restricted',
      projectId: null, // Global resource
    },

    // Templates
    {
      name: 'Project Proposal Template',
      description: 'Standard template for creating project proposals with sections for scope, timeline, and budget.',
      type: 'Templates',
      url: 'https://drive.google.com/drive/folders/example-proposal-template',
      accessLevel: 'Team',
      projectId: null, // Global resource
    },
    {
      name: 'Meeting Notes Template',
      description: 'Structured template for capturing meeting notes, action items, and decisions.',
      type: 'Templates',
      url: 'https://drive.google.com/drive/folders/example-meeting-template',
      accessLevel: 'Team',
      projectId: null, // Global resource
    },
    {
      name: 'Bug Report Template',
      description: 'Standardized bug report template ensuring all necessary information is captured.',
      type: 'Templates',
      url: 'https://drive.google.com/drive/folders/example-bug-template',
      accessLevel: 'Team',
      projectId: null, // Global resource
    },
    {
      name: 'User Story Template',
      description: 'Template for writing user stories following agile methodology.',
      type: 'Templates',
      url: 'https://drive.google.com/drive/folders/example-user-story',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },

    // Libraries
    {
      name: 'JavaScript Utility Library',
      description: 'Reusable JavaScript functions and utilities for common operations.',
      type: 'Libraries',
      url: 'https://github.com/example/js-utils',
      accessLevel: 'Public',
      projectId: null, // Global resource
    },
    {
      name: 'React Component Library',
      description: 'Shared React components library for consistent UI across projects.',
      type: 'Libraries',
      url: 'https://github.com/example/react-components',
      accessLevel: 'Team',
      projectId: projects[0]?.id || null,
    },
    {
      name: 'CSS Framework',
      description: 'Custom CSS framework with utility classes and design tokens.',
      type: 'Libraries',
      url: 'https://github.com/example/css-framework',
      accessLevel: 'Public',
      projectId: null, // Global resource
    },
    {
      name: 'API Client Library',
      description: 'TypeScript/JavaScript client library for interacting with our APIs.',
      type: 'Libraries',
      url: 'https://github.com/example/api-client',
      accessLevel: 'Team',
      projectId: projects[1]?.id || null,
    },
  ];

  console.log(`[1/2] Creating ${resources.length} resources...`);

  let created = 0;
  let skipped = 0;

  for (const resourceData of resources) {
    try {
      // Check if resource already exists
      const existing = await prisma.resource.findFirst({
        where: {
          name: resourceData.name,
        },
      });

      if (existing) {
        console.log(`   ⏭️  Skipped: "${resourceData.name}" (already exists)`);
        skipped++;
        continue;
      }

      await prisma.resource.create({
        data: {
          ...resourceData,
          createdById: creator.id,
        },
      });

      created++;
      console.log(`   ✅ Created: "${resourceData.name}"`);
    } catch (error: any) {
      console.error(`   ❌ Error creating "${resourceData.name}":`, error.message);
    }
  }

  console.log(`\n✅ Resource generation complete!`);
  console.log(`   Created: ${created}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Total: ${created + skipped}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





