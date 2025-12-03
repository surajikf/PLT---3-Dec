import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('password123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@ikf.com' },
    update: {},
    create: {
      email: 'superadmin@ikf.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      hourlyRate: 0,
    },
  });

  // Create Admin
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ikf.com' },
    update: {},
    create: {
      email: 'admin@ikf.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      hourlyRate: 100,
    },
  });

  // Create Project Manager
  const pmPassword = await bcrypt.hash('password123', 10);
  const projectManager = await prisma.user.upsert({
    where: { email: 'pm@ikf.com' },
    update: {},
    create: {
      email: 'pm@ikf.com',
      password: pmPassword,
      firstName: 'Project',
      lastName: 'Manager',
      role: UserRole.PROJECT_MANAGER,
      hourlyRate: 80,
    },
  });

  // Create Team Member
  const teamMemberPassword = await bcrypt.hash('password123', 10);
  const teamMember = await prisma.user.upsert({
    where: { email: 'team@ikf.com' },
    update: {},
    create: {
      email: 'team@ikf.com',
      password: teamMemberPassword,
      firstName: 'Team',
      lastName: 'Member',
      role: UserRole.TEAM_MEMBER,
      hourlyRate: 50,
    },
  });

  // Create Client
  const clientPassword = await bcrypt.hash('password123', 10);
  const client = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      password: clientPassword,
      firstName: 'Client',
      lastName: 'User',
      role: UserRole.CLIENT,
      hourlyRate: 0,
    },
  });

  // Create Department
  const department = await prisma.department.upsert({
    where: { name: 'Development' },
    update: {},
    create: {
      name: 'Development',
      headId: projectManager.id,
      createdById: admin.id,
    },
  });

  // Update users with department
  await prisma.user.update({
    where: { id: projectManager.id },
    data: { departmentId: department.id },
  });

  await prisma.user.update({
    where: { id: teamMember.id },
    data: { departmentId: department.id },
  });

  // Create Stages
  const stages = [
    { name: 'Planning', defaultWeight: 10 },
    { name: 'Design', defaultWeight: 15 },
    { name: 'Development', defaultWeight: 40 },
    { name: 'Testing', defaultWeight: 20 },
    { name: 'Deployment', defaultWeight: 15 },
  ];

  for (const stageData of stages) {
    await prisma.stage.upsert({
      where: { name: stageData.name },
      update: {},
      create: {
        name: stageData.name,
        defaultWeight: stageData.defaultWeight,
      },
    });
  }

  // Create Customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Example Corporation',
      industry: 'Technology',
      contactPerson: 'John Doe',
      email: 'contact@example.com',
      phone: '+1234567890',
      address: '123 Main St, City, Country',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Seeding completed!');
  console.log('\n📋 Default Users Created:');
  console.log('Super Admin: superadmin@ikf.com / password123');
  console.log('Admin: admin@ikf.com / password123');
  console.log('Project Manager: pm@ikf.com / password123');
  console.log('Team Member: team@ikf.com / password123');
  console.log('Client: client@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

