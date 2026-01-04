# Unaccept Task Feature Implementation

## Overview
This feature allows external users who have accepted a task to remove themselves from it. This provides user autonomy and safety, allowing people to exit from tasks when circumstances change.

## Use Cases
- Changed circumstances (no longer have capacity)
- Misunderstanding about the task
- Deteriorated relationship with task creator
- Safety concerns
- Professional boundaries

---

## Backend Changes

### 1. Database Schema Updates (`server/prisma/schema.prisma`)

Added new enum values:

**InvitationStatus:**
- Added `UNACCEPTED` status

**NotificationType:**
- Added `TASK_INVITATION_UNACCEPTED` notification type

**AuditAction:**
- Added `TASK_UNACCEPTED` audit action

### 2. Database Migration (`server/prisma/migrations/20250105000000_add_unaccept_task_feature/migration.sql`)

```sql
ALTER TYPE "InvitationStatus" ADD VALUE IF NOT EXISTS 'UNACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TASK_INVITATION_UNACCEPTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'TASK_UNACCEPTED';
```

### 3. Controller Method (`server/src/controllers/taskInvitationController.js`)

Added `unaccessTask` method:

**Endpoint:** `POST /api/tasks/:taskId/unaccept`

**Functionality:**
- Verifies the current user is the assignee
- Prevents unaccepting completed tasks
- Removes assigneeId from task
- Resets task status to TODO
- Keeps externalContactId for reference
- Updates invitation status to UNACCEPTED
- Creates notification for task creator
- Creates audit log entry

**Security:**
- Only the current assignee can unaccept
- Cannot unaccept completed tasks
- Requires authentication

### 4. Route (`server/src/routes/tasks.js`)

Added route:
```javascript
router.post('/:taskId/unaccept', unaccessTask);
```

---

## Frontend Changes

### 1. API Service (`client/src/services/api.js`)

Added method to tasksAPI:
```javascript
unaccessTask: (taskId) => api.post(`/tasks/${taskId}/unaccept`)
```

### 2. TaskModal Component (`client/src/components/tasks/TaskModal.jsx`)

#### State Added:
- `isUnaccessConfirmOpen` - Controls confirmation dialog
- `isUnaccepting` - Loading state during unaccept

#### Helper Check:
```javascript
const isAcceptedExternalAssignee = 
  viewedTask?.assigneeId === user?.id && 
  viewedTask?.externalContactId !== null &&
  viewedTask?.assignerId !== user?.id;
```

This identifies users who:
1. Are currently assigned to the task
2. Were originally external contacts
3. Are not the task creator

#### Handler Function:
```javascript
const handleUnaccept = async () => {
  // Calls API
  // Shows success/error messages
  // Closes modal and refreshes page
}
```

#### UI Components:

**"Remove Myself" Button:**
- Appears in action buttons section
- Only visible to accepted external assignees
- Hidden for completed tasks
- Red danger styling with FaTimesCircle icon

**Confirmation Dialog:**
- Modal overlay with warning
- Shows task creator's name
- Explains consequences
- Warning note about status reset
- Cancel and Confirm buttons
- Loading state with spinner

---

## User Flow

### Step 1: User Sees "Remove Myself" Button
When an external user who accepted a task opens the task modal, they see a red "Remove Myself" button in the action buttons area (if task is not completed).

### Step 2: Click "Remove Myself"
Clicking opens a confirmation dialog explaining:
- They will be removed from the task
- The task creator will be notified
- The task will be reset to TODO status
- The task will need to be reassigned

### Step 3: Confirm Action
User clicks "Remove Myself" in the dialog:
- API call is made
- Loading spinner shows
- Success/error message displays

### Step 4: Post-Unaccept
- User is removed from task
- Task disappears from their dashboard
- Task creator receives notification
- Task status resets to TODO
- Invitation status changes to UNACCEPTED
- Audit log created

---

## Database State Changes

### Before Unaccept:
```javascript
Task {
  assigneeId: 42,              // External user's ID
  externalContactId: 123,      // Contact ID
  status: "IN_PROGRESS",
  ...
}

TaskInvitation {
  status: "ACCEPTED",
  recipientUserId: 42,
  respondedAt: "2026-01-04T...",
  ...
}
```

### After Unaccept:
```javascript
Task {
  assigneeId: null,            // ✅ Removed
  externalContactId: 123,      // ✅ Kept for reference
  status: "TODO",              // ✅ Reset
  ...
}

TaskInvitation {
  status: "UNACCEPTED",        // ✅ Changed
  recipientUserId: 42,
  respondedAt: "2026-01-04T...", // ✅ Updated
  ...
}

// ✅ New notification created
Notification {
  type: "TASK_INVITATION_UNACCEPTED",
  title: "User Removed Themselves from Task",
  message: "John Doe has removed themselves from task...",
  userId: taskCreatorId,
  ...
}

// ✅ New audit log created
AuditLog {
  action: "TASK_UNACCEPTED",
  description: "John Doe removed themselves from task...",
  ...
}
```

---

## Security Considerations

1. **Authentication Required** - Endpoint requires valid JWT token
2. **Authorization Check** - Only the current assignee can unaccept
3. **Completed Task Protection** - Cannot unaccept completed tasks
4. **Audit Trail** - All unaccept actions are logged
5. **Notification** - Task creator is always notified

---

## Notifications

### To Task Creator:
```
Title: "User Removed Themselves from Task"
Message: "John Doe has removed themselves from task 'Review Q1 Report'. 
         Please reassign this task."
Type: TASK_INVITATION_UNACCEPTED
```

---

## Testing Checklist

- [ ] External user can see "Remove Myself" button
- [ ] Internal users don't see the button
- [ ] Task creator doesn't see the button
- [ ] Completed tasks don't show the button
- [ ] Confirmation dialog appears on click
- [ ] Cancel button works correctly
- [ ] Confirm button removes user from task
- [ ] Task status resets to TODO
- [ ] Task creator receives notification
- [ ] Audit log is created
- [ ] Task disappears from user's dashboard
- [ ] externalContactId is preserved
- [ ] Cannot unaccept already completed tasks

---

## Future Enhancements (Not Implemented)

These were discussed but not implemented in this version:

1. **Block User** - Option to block future invitations from task creator
2. **Report User** - Report inappropriate behavior
3. **Unaccept Reason** - Optional reason field for transparency
4. **Re-invitation Prevention** - Automatically decline future invitations from same user

---

## Migration Instructions

To apply these changes to production:

1. **Backup Database** (Important!)
2. Run migration:
   ```bash
   cd server
   npx prisma migrate deploy
   ```
3. Restart server
4. Deploy frontend changes
5. Test with a test external user account

---

## Files Modified

### Backend:
- `server/prisma/schema.prisma`
- `server/prisma/migrations/20250105000000_add_unaccept_task_feature/migration.sql`
- `server/src/controllers/taskInvitationController.js`
- `server/src/routes/tasks.js`

### Frontend:
- `client/src/services/api.js`
- `client/src/components/tasks/TaskModal.jsx`

---

## Summary

This feature provides users with control over their task commitments and improves the platform's safety and user autonomy. It's a reversible action that maintains audit trails while respecting user boundaries.

The implementation is complete and ready for testing!
