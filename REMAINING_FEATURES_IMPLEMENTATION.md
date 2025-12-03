# Remaining Features Implementation Guide

## Overview
This document outlines the remaining functionality to be implemented and provides a systematic approach to complete all missing features.

## Status

### ✅ Completed
1. Backend API for updating project stage status
2. Stage management UI connection to API

### 🔄 In Progress / Next Steps

#### 1. Task Management UI (High Priority)
**Location**: `frontend/src/pages/ProjectDetailPage.tsx` - Tasks Tab
**Features Needed**:
- Create Task Modal
- Edit Task Modal  
- Delete Task functionality
- Task status updates
- Task assignment dropdown

**API Endpoints Available**: ✅
- POST `/tasks` - Create task
- PATCH `/tasks/:id` - Update task
- DELETE `/tasks/:id` - Delete task
- GET `/tasks?projectId=:id` - List tasks

#### 2. Resource Management CRUD (High Priority)
**Location**: `frontend/src/pages/ResourcesPage.tsx` and ProjectDetailPage
**Features Needed**:
- Add Resource Modal
- Edit Resource Modal
- Delete Resource functionality
- Resource type dropdown

**API Endpoints Available**: ✅
- POST `/resources` - Create resource
- PATCH `/resources/:id` - Update resource
- DELETE `/resources/:id` - Delete resource

#### 3. Team Member Management (Medium Priority)
**Location**: `frontend/src/pages/ProjectDetailPage.tsx` - Team Tab
**Features Needed**:
- Add Member Modal with user selection
- Remove Member functionality

**API Endpoints Available**: ✅
- POST `/projects/:id/members` - Assign members

#### 4. Enhanced Reports Page (Medium Priority)
**Location**: `frontend/src/pages/ReportsPage.tsx`
**Features Needed**:
- Visual charts using Recharts
- Timesheet reports
- Export to CSV functionality
- Date range filters

**API Endpoints Available**: ✅
- GET `/reports/budget` - Budget reports
- GET `/reports/department` - Department reports

#### 5. Enhanced Timesheet Tab in Project Detail (Medium Priority)
**Location**: `frontend/src/pages/ProjectDetailPage.tsx` - Timesheets Tab
**Features Needed**:
- Display project timesheets
- Filter by date range
- Show timesheet details

**API Endpoints Available**: ✅
- GET `/timesheets?projectId=:id` - Project timesheets

#### 6. Export Functionality (Medium Priority)
**Location**: Multiple pages (Reports, Timesheets, Projects)
**Features Needed**:
- CSV export for reports
- CSV export for timesheets
- CSV export for projects list

**Implementation**: Frontend-only using CSV generation library

## Implementation Order

1. **Task Management UI** - Critical for project management
2. **Resource Management CRUD** - Essential feature
3. **Team Member Management** - Project collaboration
4. **Enhanced Timesheet Tab** - Better project visibility
5. **Enhanced Reports with Charts** - Better analytics
6. **Export Functionality** - Data portability

## Quick Wins

These can be implemented quickly:

1. **Task Management Modals** - ~200 lines of code
2. **Resource Management Modals** - ~200 lines of code  
3. **Export to CSV utility** - ~50 lines of code (reusable)
4. **Enhanced Timesheet Tab** - ~100 lines of code

## Notes

- All backend APIs are already implemented
- Frontend needs modals and UI components
- Recharts library is already installed
- Most patterns follow existing modal implementations (CustomerModal in MasterManagementPage)

