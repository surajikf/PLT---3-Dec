# Profit & Loss Management Feature

## Overview
A comprehensive profit and loss tracking system that calculates project profitability based on fixed project costs and actual employee costs (hours × hourly rates).

## Features

### 1. Financial Calculation Logic
- **Fixed Project Cost**: Set at project creation (project.budget)
- **Actual Cost**: Calculated from approved timesheets
  - Formula: `Sum of (Hours × Hourly Rate) for all approved timesheets`
- **Profit/Loss**: 
  - `Profit = Fixed Cost - Actual Cost` (if positive)
  - `Loss = Actual Cost - Fixed Cost` (if negative)
- **Profit Margin**: `(Profit/Loss ÷ Fixed Cost) × 100`

### 2. Employee Cost Tracking
- Tracks costs per employee for each project
- Shows:
  - Employee name, email, hourly rate
  - Total hours logged
  - Total cost contributed
  - Percentage of project cost

### 3. Access Control
**Admin Only** (Super Admin & Admin):
- Full access to all P&L data
- Detailed employee cost breakdowns
- Project financials in project detail page
- Dedicated Profit & Loss page

**Other Roles**:
- Can see basic budget information
- Cannot see detailed financials or employee costs

## API Endpoints

### GET `/api/profit-loss/dashboard`
Returns summary statistics:
- Total revenue (fixed costs)
- Total actual costs
- Net profit/loss
- Project counts (profit/loss/break-even)
- Top profit and loss projects

**Access**: Super Admin, Admin only

### GET `/api/profit-loss/projects`
Returns P&L data for all projects:
- Project details
- Financial breakdown
- Profit/loss calculations
- Hours and costs

**Query Parameters**:
- `status`: Filter by project status
- `startDate`: Filter projects created after date
- `endDate`: Filter projects created before date
- `minProfit`: Minimum profit amount
- `maxLoss`: Maximum loss amount

**Access**: Super Admin, Admin only

### GET `/api/profit-loss/projects/:id`
Returns detailed P&L for a specific project:
- Project information
- Complete financial breakdown
- Employee cost breakdown
- Timesheet count

**Access**: Super Admin, Admin only

### GET `/api/profit-loss/employees`
Returns employee cost analysis across all projects:
- Employee details and hourly rates
- Total hours and costs per employee
- Project breakdown per employee
- Sorted by total cost

**Query Parameters**:
- `userId`: Filter by specific employee
- `projectId`: Filter by specific project
- `startDate`: Filter timesheets by date
- `endDate`: Filter timesheets by date

**Access**: Super Admin, Admin only

## Enhanced Project Endpoint

### GET `/api/projects/:id`
Now includes (for admins only):
- `employeeCosts`: Array of employee cost breakdowns
- `financials`: Profit/loss calculations
  - `fixedProjectCost`
  - `totalActualCost`
  - `profitLoss`
  - `profitLossPercentage`
  - `isProfit`, `isLoss`, `isBreakEven`

## Frontend Pages

### 1. Profit & Loss Page (`/profit-loss`)
Main dashboard with three tabs:

**Dashboard Tab**:
- Summary cards (Revenue, Cost, P&L, Hours)
- Charts:
  - Profit/Loss by Project (Bar Chart)
  - Project Status Distribution (Pie Chart)
- Top Profit Projects list
- Top Loss Projects list

**Projects Tab**:
- Table of all projects with:
  - Project name and status
  - Fixed cost vs actual cost
  - Hours logged
  - Profit/Loss amount
  - Profit margin percentage
- Click to view detailed breakdown

**Employees Tab**:
- Employee cost analysis
- Shows all employees with:
  - Total hours and costs across all projects
  - Project-by-project breakdown
  - Click to view project details

### 2. Enhanced Project Detail Page
For admin users, the Overview tab now shows:
- Profit/Loss indicator in budget section
- Employee Cost Breakdown table:
  - Employee name and hourly rate
  - Hours logged per employee
  - Cost per employee
  - Percentage of total cost
  - Link to full P&L page

## Data Flow

1. **Project Creation**: Set fixed budget/cost
2. **Employee Assignment**: Add employees with hourly rates
3. **Timesheet Entry**: Employees log hours
4. **Timesheet Approval**: Manager approves timesheets
5. **Cost Calculation**: System calculates actual costs from approved timesheets
6. **P&L Calculation**: 
   - Actual Cost = Sum of (Hours × Hourly Rate)
   - Profit/Loss = Fixed Cost - Actual Cost
7. **Display**: Admin views detailed financials

## Security

- All P&L endpoints check user role
- Only Super Admin and Admin can access
- Regular users see basic budget info only
- Employee hourly rates visible only to admins

## Future Enhancements

- Budget alerts when approaching loss
- Cost forecasting
- Department-wise P&L
- Export to CSV/PDF
- Historical trends
- Cost vs revenue charts over time

## Files Modified/Created

### Backend:
- `backend/src/controllers/profitLossController.ts` - NEW
- `backend/src/routes/profitLossRoutes.ts` - NEW
- `backend/src/controllers/projectController.ts` - Enhanced
- `backend/src/server.ts` - Added routes

### Frontend:
- `frontend/src/pages/ProfitLossPage.tsx` - NEW
- `frontend/src/pages/ProjectDetailPage.tsx` - Enhanced
- `frontend/src/App.tsx` - Added route
- `frontend/src/components/Layout.tsx` - Added menu item

---

**This feature provides complete financial transparency for project management!**

