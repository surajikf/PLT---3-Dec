# Project Detail Page Enhancements - Implementation Guide

This document outlines all the enhancements needed for ProjectDetailPage.tsx

## Required Additions

### 1. Additional Imports Needed
```typescript
import { format } from 'date-fns';
```

### 2. Additional State Variables (already added)
- taskModalOpen, editingTask
- resourceModalOpen, editingResource  
- teamMemberModalOpen

### 3. Additional Queries Needed

```typescript
// For team member modal - fetch all users
const { data: allUsers } = useQuery('users-for-team', async () => {
  const res = await api.get('/users?isActive=true');
  return res.data.data || [];
});

// For task modal - fetch stages
const { data: stages } = useQuery(['stages', id], async () => {
  const res = await api.get('/stages?isActive=true');
  return res.data.data || [];
});

// For timesheet tab
const { data: projectTimesheets } = useQuery(
  ['project-timesheets', id],
  async () => {
    const res = await api.get(`/timesheets?projectId=${id}`);
    return res.data.data || [];
  },
  { enabled: !!id && activeTab === 'timesheets' }
);

// Fetch project resources
const { data: projectResources } = useQuery(
  ['project-resources', id],
  async () => {
    const res = await api.get(`/resources?projectId=${id}`);
    return res.data.data || [];
  },
  { enabled: !!id }
);
```

### 4. Mutations Needed

```typescript
// Task mutations
const createTaskMutation = useMutation(...)
const updateTaskMutation = useMutation(...)
const deleteTaskMutation = useMutation(...)

// Resource mutations
const createResourceMutation = useMutation(...)
const updateResourceMutation = useMutation(...)
const deleteResourceMutation = useMutation(...)

// Team member mutation
const addTeamMemberMutation = useMutation(...)
const removeTeamMemberMutation = useMutation(...)
```

### 5. Modal Components to Add

1. TaskModal - Create/Edit task
2. ResourceModal - Create/Edit resource
3. TeamMemberModal - Add team members
4. Enhanced Timesheet Tab with data display

All modal patterns follow the CustomerModal pattern from MasterManagementPage.

