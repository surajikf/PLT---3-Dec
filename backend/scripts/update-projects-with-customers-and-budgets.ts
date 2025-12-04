import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Indian person names for customers
const indianPersonNames = [
  'Rajesh Kumar',
  'Priya Sharma',
  'Amit Patel',
  'Sneha Reddy',
  'Vikram Singh',
  'Anjali Desai',
  'Rahul Mehta',
  'Kavita Joshi',
  'Arjun Verma',
  'Divya Nair',
  'Suresh Iyer',
  'Meera Krishnan',
  'Nikhil Agarwal',
  'Rohit Malhotra',
  'Shruti Gupta',
  'Aditya Kapoor',
  'Kiran Deshmukh',
  'Pooja Shah',
  'Ravi Menon',
  'Anita Nair',
  'Siddharth Rao',
  'Deepika Menon',
  'Varun Chaturvedi',
  'Neha Kulkarni',
  'Karan Thakur',
  'Swati Iyer',
  'Manish Agarwal',
  'Radhika Joshi',
  'Akshay Nair',
  'Pallavi Reddy',
];

// Budget ranges for different project types
const budgetRanges = [
  { min: 50000, max: 150000 },   // Small projects
  { min: 150000, max: 300000 },  // Medium projects
  { min: 300000, max: 500000 },  // Large projects
  { min: 500000, max: 1000000 }, // Very large projects
];

function getRandomBudget(): number {
  const range = budgetRanges[Math.floor(Math.random() * budgetRanges.length)];
  return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
}

async function main() {
  console.log('🌱 Starting project update with customers and budgets...');

  // Get all existing customers
  const existingCustomers = await prisma.customer.findMany();
  
  // Create customers with Indian person names if they don't exist
  console.log('📋 Creating/Updating customers with Indian person names...');
  const customers = [];
  
  for (const personName of indianPersonNames) {
    // Check if customer already exists
    let customer = existingCustomers.find(c => c.name === personName);
    
    if (!customer) {
      // Create new customer with person name
      const nameParts = personName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/\s+/g, '')}@example.com`;
      
      customer = await prisma.customer.create({
        data: {
          name: personName,
          industry: ['Technology', 'Consulting', 'Retail', 'Services', 'Healthcare', 'Education'][Math.floor(Math.random() * 6)],
          contactPerson: personName,
          email: email,
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          address: `${Math.floor(Math.random() * 999) + 1} Main Street, ${['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'][Math.floor(Math.random() * 7)]}, India`,
          status: 'ACTIVE',
        },
      });
      console.log(`   ✓ Created customer: ${personName}`);
    }
    customers.push(customer);
  }

  console.log(`📋 Total customers available: ${customers.length}`);

  // Get all projects
  const projects = await prisma.project.findMany({
    include: {
      customer: true,
    },
  });

  console.log(`📋 Found ${projects.length} projects`);

  let customersAssigned = 0;
  let budgetsAssigned = 0;
  let projectsUpdated = 0;

  for (const project of projects) {
    let needsUpdate = false;
    const updateData: any = {};

    // Check if customer is a company name (contains common company keywords) or is missing
    const isCompanyName = project.customer && (
      project.customer.name.includes('Limited') ||
      project.customer.name.includes('Industries') ||
      project.customer.name.includes('Technologies') ||
      project.customer.name.includes('Bank') ||
      project.customer.name.includes('Group') ||
      project.customer.name.includes('Corporation') ||
      project.customer.name.includes('Solutions') ||
      project.customer.name.includes('Services') ||
      project.customer.name.includes('Auto') ||
      project.customer.name.includes('Motors') ||
      project.customer.name.includes('Steel') ||
      project.customer.name.includes('Engineering')
    );

    // Assign person name customer if missing or if current customer is a company
    if (!project.customerId || isCompanyName) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      updateData.customerId = randomCustomer.id;
      needsUpdate = true;
      customersAssigned++;
      const action = !project.customerId ? 'Assigning' : 'Replacing';
      console.log(`   ✓ ${action} customer "${randomCustomer.name}" to "${project.name}"`);
    }

    // Assign budget if zero or missing
    if (!project.budget || project.budget === 0) {
      const randomBudget = getRandomBudget();
      updateData.budget = randomBudget;
      needsUpdate = true;
      budgetsAssigned++;
      console.log(`   ✓ Assigning budget ₹${randomBudget.toLocaleString('en-IN')} to "${project.name}"`);
    }

    // Update project if needed
    if (needsUpdate) {
      await prisma.project.update({
        where: { id: project.id },
        data: updateData,
      });
      projectsUpdated++;
    }
  }

  console.log('\n✅ Project update completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   - Projects updated: ${projectsUpdated}`);
  console.log(`   - Customers assigned: ${customersAssigned}`);
  console.log(`   - Budgets assigned: ${budgetsAssigned}`);
}

main()
  .catch((e) => {
    console.error('❌ Error updating projects:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

