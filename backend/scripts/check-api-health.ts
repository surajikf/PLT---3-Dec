import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function checkBackendHealth() {
  try {
    console.log('🔍 Checking backend server health...');
    const response = await axios.get('http://localhost:5000/health', { timeout: 5000 });
    console.log('✅ Backend server is running');
    console.log(`   Status: ${response.data.status}`);
    return true;
  } catch (error: any) {
    console.error('❌ Backend server is NOT responding');
    console.error(`   Error: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.error('   💡 Make sure the backend server is running: cd backend && npm run dev');
    }
    return false;
  }
}

async function checkDatabase() {
  try {
    console.log('\n🔍 Checking database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');

    const counts = {
      users: await prisma.user.count(),
      projects: await prisma.project.count(),
      timesheets: await prisma.timesheet.count(),
      customers: await prisma.customer.count(),
      departments: await prisma.department.count(),
    };

    console.log('\n📊 Database records:');
    console.log(`   Users: ${counts.users}`);
    console.log(`   Projects: ${counts.projects}`);
    console.log(`   Timesheets: ${counts.timesheets}`);
    console.log(`   Customers: ${counts.customers}`);
    console.log(`   Departments: ${counts.departments}`);

    return true;
  } catch (error: any) {
    console.error('\n❌ Database connection failed');
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

async function checkAPIEndpoints() {
  console.log('\n🔍 Checking API endpoints...');
  
  // Test without auth (should fail with 401)
  try {
    await axios.get(`${API_URL}/projects`, { timeout: 5000 });
    console.log('⚠️  API endpoint accessible without auth (security issue)');
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('✅ API authentication is working (401 for unauthorized)');
    } else if (error.response?.status === 429) {
      console.error('❌ Rate limit hit - too many requests');
      console.error('   💡 Wait 15 minutes or restart backend server');
    } else {
      console.error(`❌ API endpoint error: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Starting comprehensive health check...\n');

  const backendOk = await checkBackendHealth();
  const dbOk = await checkDatabase();
  
  if (backendOk) {
    await checkAPIEndpoints();
  }

  console.log('\n📋 Summary:');
  console.log(`   Backend Server: ${backendOk ? '✅ Running' : '❌ Not Running'}`);
  console.log(`   Database: ${dbOk ? '✅ Connected' : '❌ Not Connected'}`);
  
  if (!backendOk) {
    console.log('\n💡 To start backend:');
    console.log('   cd backend');
    console.log('   npm run dev');
  }

  if (!dbOk) {
    console.log('\n💡 To fix database:');
    console.log('   1. Check DATABASE_URL in backend/.env');
    console.log('   2. Ensure MySQL server is running');
    console.log('   3. Verify database credentials');
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});





