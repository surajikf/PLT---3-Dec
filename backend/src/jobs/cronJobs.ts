/**
 * Cron Jobs Setup
 * Configure scheduled tasks for automation
 * 
 * To use this, install node-cron: npm install node-cron
 * Then import and start in server.ts
 */

// Optional dependency - only import if available
let cron: any = null;
try {
  cron = require('node-cron');
} catch (e) {
  // node-cron not installed, cron jobs will be disabled
}
import {
  runDailyMaintenance,
  checkTimesheetDeadlines,
  updateTaskActualHours,
} from '../utils/scheduledJobs';

/**
 * Daily maintenance job - runs at 2 AM every day
 * - Auto-archives old projects
 * - Checks budget alerts
 * - Checks deadline alerts
 * - Checks resource overallocation
 */
export function startDailyMaintenanceJob() {
  if (!cron) {
    console.warn('⚠️  node-cron not installed, cron jobs disabled');
    return;
  }
  cron.schedule('0 2 * * *', async () => {
    console.log('🔄 Running daily maintenance...');
    try {
      const results = await runDailyMaintenance();
      console.log('✅ Daily maintenance completed:', results);
    } catch (error) {
      console.error('❌ Daily maintenance failed:', error);
    }
  });
  console.log('✅ Daily maintenance job scheduled (2 AM daily)');
}

/**
 * Timesheet deadline check - runs every Monday at 9 AM
 * Checks for overdue and approaching deadlines
 */
export function startTimesheetDeadlineJob() {
  if (!cron) {
    console.warn('⚠️  node-cron not installed, cron jobs disabled');
    return;
  }
  cron.schedule('0 9 * * 1', async () => {
    console.log('🔄 Checking timesheet deadlines...');
    try {
      const results = await checkTimesheetDeadlines();
      console.log('✅ Timesheet deadline check completed:', results);
    } catch (error) {
      console.error('❌ Timesheet deadline check failed:', error);
    }
  });
  console.log('✅ Timesheet deadline job scheduled (Monday 9 AM)');
}

/**
 * Task hours update - runs every hour
 * Updates actual hours for all tasks from linked timesheets
 */
export function startTaskHoursUpdateJob() {
  if (!cron) {
    console.warn('⚠️  node-cron not installed, cron jobs disabled');
    return;
  }
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Updating task actual hours...');
    try {
      const updated = await updateTaskActualHours();
      console.log(`✅ Updated ${updated} tasks`);
    } catch (error) {
      console.error('❌ Task hours update failed:', error);
    }
  });
  console.log('✅ Task hours update job scheduled (hourly)');
}

/**
 * Start all scheduled jobs
 */
export function startAllJobs() {
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
    startDailyMaintenanceJob();
    startTimesheetDeadlineJob();
    startTaskHoursUpdateJob();
    console.log('🚀 All scheduled jobs started');
  } else {
    console.log('⏸️  Cron jobs disabled (set ENABLE_CRON_JOBS=true to enable)');
  }
}

