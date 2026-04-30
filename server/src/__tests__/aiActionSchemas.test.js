const {
  buildValidationErrors,
  collectTaskUpdates,
  normalizeActionType,
  normalizePreviewInput,
  normalizePriority,
  normalizeTaskStatus
} = require('../services/aiActionSchemas');

describe('aiActionSchemas', () => {
  it('normalizes action aliases into executable action names', () => {
    expect(normalizeActionType('add_update')).toBe('add_comment');
    expect(normalizeActionType('create_subtask')).toBe('add_subtask');
    expect(normalizeActionType('edit_project')).toBe('update_project');
  });

  it('normalizes priority and rejects invalid task statuses', () => {
    expect(normalizePriority(' urgent ')).toBe('URGENT');
    expect(normalizePriority('not-real')).toBe('MEDIUM');
    expect(normalizeTaskStatus('done')).toBeNull();
  });

  it('requires enough information for create task actions', () => {
    const result = buildValidationErrors('create_task', { title: 'Write proposal' });

    expect(result.actionType).toBe('create_task');
    expect(result.errors).toContain('Due date is required');
  });

  it('extracts task updates without inventing unsupported fields', () => {
    const { updates, invalid } = collectTaskUpdates({
      title: 'Current title',
      newTitle: 'New title',
      status: 'in_progress',
      assignee: 'Someone'
    });

    expect(updates).toEqual({ title: 'New title', status: 'IN_PROGRESS' });
    expect(invalid).toEqual([]);
  });

  it('blocks update task actions without a reference or changes', () => {
    const result = buildValidationErrors('update_task', {});

    expect(result.errors).toContain('Task reference is required');
    expect(result.errors).toContain('At least one task update is required');
  });

  it('normalizes mistaken rename field when taskId is known', () => {
    expect(normalizePreviewInput('update_task', { taskId: 3, title: 'Renamed' })).toEqual({
      taskId: 3,
      newTitle: 'Renamed'
    });
  });

  it('keeps title for lookup when taskTitle is also provided', () => {
    expect(normalizePreviewInput('update_task', { taskId: 3, title: 'Foo', taskTitle: 'Bar' })).toEqual({
      taskId: 3,
      title: 'Foo',
      taskTitle: 'Bar'
    });
  });
});
