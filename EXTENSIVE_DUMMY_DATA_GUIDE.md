# 📊 Extensive Dummy Data Generation Guide

## Overview

This script generates comprehensive dummy data for the last 3 years with:
- ✅ **35+ Projects** across 3 years (2022, 2023, 2024)
- ✅ **Random dates** for projects, tasks, and timesheets
- ✅ **Random hours** (0.5-12 hours per timesheet)
- ✅ **Random amounts** calculated from hours × hourly rate
- ✅ **Realistic data distribution** across the timeline

## What Gets Generated

### 1. Projects (35+ projects)
- Projects distributed across 2022, 2023, and 2024
- Random start and end dates within each year
- Random budgets (with ±30% variance)
- Random statuses (PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED)
- Health scores based on project status
- Some cancelled projects are archived (30% chance)

### 2. Project Members
- 3-10 team members assigned per project
- Random assignment dates (between project start and now)

### 3. Tasks (10-29 per project)
- Random due dates within project timeline
- Status based on project status (realistic distribution)
- Random priorities (LOW, MEDIUM, HIGH, URGENT)
- Random creation dates

### 4. Timesheets (2-5 per week per user)
- Random dates within project duration
- Random hours (0.5-12 hours, weighted towards 4-8 hours)
- Random amounts calculated from: `hours × hourlyRate × variance`
- Status distribution:
  - **Older than 30 days**: Mostly APPROVED
  - **7-30 days**: Mix of APPROVED and SUBMITTED
  - **Recent (0-7 days)**: Mix of all statuses
- Approved timesheets have random approval dates

## How to Run

### Prerequisites
Make sure you have:
1. Run the initial Indian demo data script first:
   ```bash
   cd backend
   npm run add-indian-demo
   ```

### Run the Script
```bash
cd backend
npm run add-extensive-data
```

## Data Characteristics

### Random Hours Distribution
- **0.5-2.5 hours**: 10% (short sessions)
- **2.5-4.5 hours**: 20% (half days)
- **4-8 hours**: 40% (full days)
- **8-12 hours**: 30% (extended days)

### Project Status Distribution
- All statuses are randomly assigned
- Completed projects have higher health scores (80-100)
- Cancelled projects have lower health scores (0-30)

### Timesheet Status Logic
- **Older timesheets** (>30 days): Mostly approved
- **Recent timesheets** (<7 days): Mix of all statuses
- **Approved timesheets**: Have random approval dates and approvers

## Expected Output

After running, you should see:
```
🚀 Starting Extensive Dummy Data Generation (Last 3 Years)...

[1/6] Fetching existing data...
   ✅ Found X users, Y customers, Z departments

[2/6] Creating projects for last 3 years...
   ✅ Created/Found 35 projects

[3/6] Assigning team members to projects...
   ✅ Created XXX project member assignments

[4/6] Creating tasks with random dates...
   ✅ Created XXXX tasks

[5/6] Creating timesheets with random data...
   ✅ Created XXXX timesheets

✅ Extensive Dummy Data Generation Complete!

📊 Summary:
   📁 Projects: 35
   👤 Project Members: XXX
   ✅ Tasks: XXXX
   ⏰ Timesheets: XXXX
   📈 Total Hours: XXXX.XX
   💰 Total Cost (Approved): ₹X,XXX,XXX.XX
```

## Data Volume Estimates

For 35 projects with 5-10 members each:
- **Projects**: ~35
- **Project Members**: ~200-350 assignments
- **Tasks**: ~500-1000 tasks
- **Timesheets**: ~2000-5000 timesheets (depending on project duration)
- **Total Hours**: ~10,000-25,000 hours
- **Total Cost**: ₹500,000 - ₹2,500,000 (approximate)

## Notes

1. **No Duplicates**: The script checks for existing projects by code and skips them
2. **Realistic Dates**: All dates are within project timelines
3. **No Future Dates**: Timesheets and tasks won't have future dates
4. **Status Consistency**: Task and timesheet statuses align with project status
5. **Amount Calculation**: Timesheet amounts are calculated from hours × hourly rate with ±10% variance

## Troubleshooting

### Error: "Missing required data"
- **Solution**: Run `npm run add-indian-demo` first to create users, customers, and departments

### Error: "Project code already exists"
- **Solution**: This is normal - the script skips existing projects. Delete existing projects if you want fresh data.

### Too many timesheets
- The script generates 2-5 timesheets per week per user for each project
- For long projects, this can result in many timesheets
- This is intentional for comprehensive demo data

## Customization

To modify the script:
1. Edit `backend/scripts/add-extensive-dummy-data.ts`
2. Adjust `projectTemplates` array for different projects
3. Modify `getRandomHours()` for different hour distributions
4. Change date ranges in `getRandomDateInYear()` functions

---

**Happy Testing! 🎉**

