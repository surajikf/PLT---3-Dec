# Hourly Rate Assignment Based on Experience

## Overview
This script automatically calculates and assigns hourly rates to all employees based on their experience in the company (calculated from their joining date) and their role/seniority level.

## How It Works

### 1. Experience Calculation
- Uses the employee's **joining date** to calculate years of experience
- Falls back to `createdAt` date if joining date is not available

### 2. Rate Calculation Factors
- **Years of Experience**: More experience = higher rate
- **Role/Seniority**: CEO/Admin roles have higher base rates
- **Random Variation**: Adds realistic variation to avoid identical rates

### 3. Rate Ranges (INR ₹)

| Seniority Level | Experience | Rate Range |
|----------------|------------|------------|
| Intern | Any | ₹100-200/hr |
| Entry Level | < 1 year | ₹150-250/hr |
| Junior | 1-3 years | ₹250-450/hr |
| Mid Level | 3-5 years | ₹400-650/hr |
| Senior | 5+ years | ₹550-900+/hr |
| Team Lead/Manager | Varies | ₹400-800+/hr |
| Admin/Head | Varies | ₹600-1200+/hr |
| CEO/Super Admin | Varies | ₹800-1500+/hr |

## Running the Script

### Option 1: Using npm script
```bash
cd backend
npm run assign-rates
```

### Option 2: Direct execution
```bash
cd backend
npx tsx scripts/assign-hourly-rates.ts
```

## What the Script Does

1. ✅ Finds all active users in the database
2. ✅ Looks up their joining date from the employee data mapping
3. ✅ Calculates years of experience
4. ✅ Determines appropriate hourly rate based on:
   - Experience level
   - Role (CEO, Admin, Manager, Team Member, etc.)
   - Job title keywords (Sr., Senior, Intern, etc.)
5. ✅ Updates each user's `hourlyRate` field
6. ✅ Shows detailed output for each employee

## Output Example

```
🚀 Starting hourly rate assignment based on experience...

   Found 47 active users

   ✓ Ashish Dalia
     Email: ashish@ikf.co.in
     Experience: 25.0 years | Role: SUPER_ADMIN | Rate: ₹2000/hr

   ✓ Gunjan Bhansali
     Email: gunjan@ikf.co.in
     Experience: 10.2 years | Role: ADMIN | Rate: ₹1020/hr

   ✓ Sagar Chavan
     Email: sagar.chavan@ikf.co.in
     Experience: 8.5 years | Role: ADMIN | Rate: ₹640/hr

═══════════════════════════════════════════════════════════
📊 Summary:
   ✅ Updated: 47
   ⚠️  Skipped: 0
═══════════════════════════════════════════════════════════

✅ Hourly rate assignment completed!
```

## Notes

- ⚠️ **Important**: This script will overwrite existing hourly rates
- 📅 Joining dates are mapped from the employee data in `add-employees.ts`
- 🔄 You can run this script multiple times - it will recalculate rates each time
- 💡 Rates are rounded to nearest ₹10 for cleaner numbers
- 📊 Minimum rate is ₹100/hr (for interns)

## Customization

To adjust rate ranges, edit the `getBaseHourlyRate()` function in:
```
backend/scripts/assign-hourly-rates.ts
```

## Integration with P&L System

Once hourly rates are assigned:
- ✅ Timesheets will automatically calculate costs using: `Hours × Hourly Rate`
- ✅ Project profit/loss calculations will use these rates
- ✅ Employee cost analysis will show accurate breakdowns

## Next Steps

After running the script:
1. ✅ Verify rates in the database
2. ✅ Check Profit & Loss reports
3. ✅ Review employee cost analysis
4. ✅ Update any individual rates if needed (via Users page)

---

**Ready to assign hourly rates? Run the script now!**

