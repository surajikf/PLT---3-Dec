/**
 * Script to get your tasks and projects for timesheet submission
 * Helps you remember what you worked on today
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function getMyTasksAndProjects() {
  try {
    // Get your email from command line or use a default
    const userEmail = process.argv[2] || 'superadmin@ikf.com';
    
    console.log('\n🔍 FINDING YOUR TASKS AND PROJECTS');
    console.log('='.repeat(60));
    console.log(`Looking for user: ${userEmail}`);
    console.log('='.repeat(60));

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      console.log(`\n❌ User not found: ${userEmail}`);
      console.log('\n💡 Available users:');
      const allUsers = await prisma.user.findMany({
        select: { email: true, firstName: true, lastName: true },
      });
      allUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.firstName} ${u.lastName})`);
      });
      await prisma.$disconnect();
      return;
    }

    console.log(`\n✅ Found: ${user.firstName} ${user.lastName} (${user.role})`);

    // Get your assigned tasks
    const myTasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedToId: user.id },
          { createdById: user.id },
        ],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    // Get projects you're assigned to
    const myProjects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: user.id },
          { createdById: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        manager: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get recent timesheets (last 7 days) to help remember what you worked on
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTimesheets = await prisma.timesheet.findMany({
      where: {
        userId: user.id,
        date: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        project: {
          select: {
            name: true,
            code: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    console.log('\n📋 YOUR ASSIGNED TASKS');
    console.log('='.repeat(60));
    if (myTasks.length === 0) {
      console.log('No tasks assigned to you.');
    } else {
      myTasks.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.title}`);
        console.log(`   Project: ${task.project.name} (${task.project.code})`);
        console.log(`   Status: ${task.status}`);
        console.log(`   Priority: ${task.priority}`);
        if (task.description) {
          console.log(`   Description: ${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}`);
        }
        if (task.dueDate) {
          console.log(`   Due Date: ${new Date(task.dueDate).toLocaleDateString()}`);
        }
      });
    }

    console.log('\n\n📁 YOUR PROJECTS');
    console.log('='.repeat(60));
    if (myProjects.length === 0) {
      console.log('No projects assigned to you.');
    } else {
      myProjects.forEach((project, index) => {
        console.log(`\n${index + 1}. ${project.name} (${project.code})`);
        console.log(`   Status: ${project.status}`);
        if (project.manager) {
          console.log(`   Manager: ${project.manager.firstName} ${project.manager.lastName}`);
        }
        console.log(`   Tasks: ${project._count.tasks}`);
        console.log(`   Team Members: ${project._count.members}`);
      });
    }

    console.log('\n\n⏰ YOUR RECENT WORK (Last 7 Days)');
    console.log('='.repeat(60));
    if (recentTimesheets.length === 0) {
      console.log('No recent timesheets found.');
    } else {
      // Group by date
      const byDate = recentTimesheets.reduce((acc: any, ts: any) => {
        const dateStr = new Date(ts.date).toLocaleDateString();
        if (!acc[dateStr]) {
          acc[dateStr] = [];
        }
        acc[dateStr].push(ts);
        return acc;
      }, {});

      Object.entries(byDate).forEach(([date, timesheets]: [string, any]) => {
        console.log(`\n📅 ${date}:`);
        timesheets.forEach((ts: any) => {
          console.log(`   - ${ts.project.name}${ts.task ? ` - ${ts.task.title}` : ''}: ${ts.hours}h`);
          if (ts.description) {
            console.log(`     ${ts.description}`);
          }
        });
      });
    }

    // Today's template
    const today = new Date();
    console.log('\n\n📝 TODAY\'S TIMESHEET TEMPLATE');
    console.log('='.repeat(60));
    console.log(`Date: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log('\nSuggested entries based on your tasks:');
    
    if (myTasks.length > 0) {
      const activeTasks = myTasks.filter(t => 
        ['TODO', 'IN_PROGRESS', 'IN_REVIEW'].includes(t.status)
      );
      
      if (activeTasks.length > 0) {
        activeTasks.slice(0, 10).forEach((task, index) => {
          console.log(`\n${index + 1}. Project: ${task.project.name} (${task.project.code})`);
          console.log(`   Task: ${task.title}`);
          console.log(`   Hours: ___ (fill in your hours)`);
          console.log(`   Description: ___ (what did you do on this task?)`);
        });
      }
    }

    if (myProjects.length > 0 && myTasks.length === 0) {
      console.log('\nYou have projects but no specific tasks. You can log time to projects directly:');
      myProjects.slice(0, 5).forEach((project, index) => {
        console.log(`\n${index + 1}. Project: ${project.name} (${project.code})`);
        console.log(`   Hours: ___ (fill in your hours)`);
        console.log(`   Description: ___ (what did you work on in this project?)`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 TIP: Use this information to fill out your timesheet!');
    console.log('   You can submit timesheets through the web interface at:');
    console.log('   http://localhost:5173/timesheets');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getMyTasksAndProjects();

