/**
 * Script to get today's timesheet data and tasks for personal timesheet submission
 * This is a utility script, not part of the main application
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function getTodayTimesheetData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('\n📊 TODAY\'S TIMESHEET DATA');
    console.log('='.repeat(60));
    console.log(`Date: ${today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log('='.repeat(60));

    // Get all timesheets for today
    const timesheets = await prisma.timesheet.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: [
        { user: { firstName: 'asc' } },
        { createdAt: 'asc' },
      ],
    });

    if (timesheets.length === 0) {
      console.log('\n⚠️  No timesheets found for today.');
      console.log('\n💡 This means no one has logged time yet today.');
      return;
    }

    // Group by user
    const userTimesheets = timesheets.reduce((acc: any, ts: any) => {
      const userId = ts.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: ts.user,
          timesheets: [],
          totalHours: 0,
        };
      }
      acc[userId].timesheets.push(ts);
      acc[userId].totalHours += ts.hours;
      return acc;
    }, {});

    // Display data grouped by user
    console.log(`\n👥 Found ${Object.keys(userTimesheets).length} user(s) with timesheet entries today:\n`);

    Object.values(userTimesheets).forEach((userData: any, index: number) => {
      const user = userData.user;
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Total Hours Today: ${userData.totalHours.toFixed(2)}h`);
      console.log(`   Entries: ${userData.timesheets.length}`);
      console.log('\n   📋 Tasks/Projects Worked On:');
      
      userData.timesheets.forEach((ts: any, tsIndex: number) => {
        console.log(`   ${tsIndex + 1}. Project: ${ts.project.name} (${ts.project.code})`);
        if (ts.task) {
          console.log(`      Task: ${ts.task.title}`);
          console.log(`      Task Status: ${ts.task.status}`);
        }
        console.log(`      Hours: ${ts.hours}h`);
        console.log(`      Status: ${ts.status}`);
        if (ts.description) {
          console.log(`      Description: ${ts.description.substring(0, 100)}${ts.description.length > 100 ? '...' : ''}`);
        }
        console.log('');
      });
      console.log('-'.repeat(60));
      console.log('');
    });

    // Summary statistics
    const totalHours = timesheets.reduce((sum, ts) => sum + ts.hours, 0);
    const uniqueProjects = new Set(timesheets.map(ts => ts.project.id)).size;
    const uniqueUsers = new Set(timesheets.map(ts => ts.user.id)).size;
    const tasksWithHours = timesheets.filter(ts => ts.task).length;

    console.log('\n📈 SUMMARY STATISTICS');
    console.log('='.repeat(60));
    console.log(`Total Users: ${uniqueUsers}`);
    console.log(`Total Hours Logged: ${totalHours.toFixed(2)}h`);
    console.log(`Total Entries: ${timesheets.length}`);
    console.log(`Projects Worked On: ${uniqueProjects}`);
    console.log(`Tasks with Hours: ${tasksWithHours}`);
    console.log('='.repeat(60));

    // Get all tasks that were worked on today
    const tasksWorkedOn = timesheets
      .filter(ts => ts.task)
      .map(ts => ({
        taskId: ts.task!.id,
        taskTitle: ts.task!.title,
        taskDescription: ts.task!.description,
        taskStatus: ts.task!.status,
        projectName: ts.project.name,
        projectCode: ts.project.code,
        hours: ts.hours,
        user: `${ts.user.firstName} ${ts.user.lastName}`,
      }));

    if (tasksWorkedOn.length > 0) {
      console.log('\n✅ TASKS WORKED ON TODAY');
      console.log('='.repeat(60));
      tasksWorkedOn.forEach((task, index) => {
        console.log(`\n${index + 1}. ${task.taskTitle}`);
        console.log(`   Project: ${task.projectName} (${task.projectCode})`);
        console.log(`   Status: ${task.taskStatus}`);
        if (task.taskDescription) {
          console.log(`   Description: ${task.taskDescription.substring(0, 150)}${task.taskDescription.length > 150 ? '...' : ''}`);
        }
        console.log(`   Worked by: ${task.user}`);
        console.log(`   Hours: ${task.hours}h`);
      });
      console.log('='.repeat(60));
    }

    // Get all projects worked on today
    const projectsWorkedOn = timesheets.reduce((acc: any, ts: any) => {
      const projectId = ts.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: ts.project,
          totalHours: 0,
          users: new Set(),
          tasks: new Set(),
        };
      }
      acc[projectId].totalHours += ts.hours;
      acc[projectId].users.add(`${ts.user.firstName} ${ts.user.lastName}`);
      if (ts.task) {
        acc[projectId].tasks.add(ts.task.title);
      }
      return acc;
    }, {});

    console.log('\n📁 PROJECTS WORKED ON TODAY');
    console.log('='.repeat(60));
    Object.values(projectsWorkedOn).forEach((projData: any, index: number) => {
      console.log(`\n${index + 1}. ${projData.project.name} (${projData.project.code})`);
      console.log(`   Status: ${projData.project.status}`);
      console.log(`   Total Hours: ${projData.totalHours.toFixed(2)}h`);
      console.log(`   Team Members: ${Array.from(projData.users).join(', ')}`);
      if (projData.tasks.size > 0) {
        console.log(`   Tasks: ${Array.from(projData.tasks).join(', ')}`);
      }
    });
    console.log('='.repeat(60));

    // Export format for easy copy-paste
    console.log('\n📋 COPY-PASTE FORMAT FOR YOUR TIMESHEET');
    console.log('='.repeat(60));
    console.log('\nToday\'s Work Summary:');
    console.log(`Date: ${today.toLocaleDateString()}`);
    console.log(`\nTotal Hours: ${totalHours.toFixed(2)}h`);
    console.log(`\nProjects & Tasks:`);
    
    Object.values(userTimesheets).forEach((userData: any) => {
      const user = userData.user;
      console.log(`\n${user.firstName} ${user.lastName}:`);
      userData.timesheets.forEach((ts: any) => {
        console.log(`  - ${ts.project.name}${ts.task ? ` - ${ts.task.title}` : ''}: ${ts.hours}h`);
        if (ts.description) {
          console.log(`    ${ts.description}`);
        }
      });
    });

  } catch (error) {
    console.error('❌ Error fetching today\'s timesheet data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
getTodayTimesheetData();

