/**
 * Shared AI quick actions — same flows as the header "AI Actions" menu.
 * Used by QuickActionsDropdown (clipboard) and can be called with typed chat text (Phase 1+).
 *
 * Each function takes raw text + react-router navigate. Project creation from an idea
 * is split: suggest ideas first (UI shows modal), then create from selected idea.
 */

import { aiAPI } from './api';

/**
 * Read clipboard for header AI Actions (Create / Update / Subtask / Project from clipboard).
 */
export async function readClipboardForQuickAction() {
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    }
    throw new Error('Clipboard is empty or access denied');
  } catch {
    throw new Error('Could not read clipboard. Please copy some text first.');
  }
}

function navigateToDashboardPopup(navigate, popupData) {
  const storageKey = `taskPopup_${Date.now()}`;
  localStorage.setItem(storageKey, JSON.stringify(popupData));
  console.log('aiQuickActions: Stored data in localStorage with key:', storageKey);
  navigate(`/dashboard?popupData=${storageKey}`);
}

/**
 * Create task from freeform text — same as "Create Task" in AI Actions.
 * @param {string} text
 * @param {import('react-router-dom').NavigateFunction} navigate
 */
export async function quickActionCreateTask(text, navigate) {
  const inputText = (text || '').trim();
  if (!inputText) {
    throw new Error('No text provided');
  }

  const response = await aiAPI.extractTask(inputText);

  let taskData = null;
  if (response.data.success && response.data.taskData) {
    taskData = response.data.taskData;
    console.log('aiQuickActions: AI successfully extracted task data:', taskData);
  } else {
    console.log('aiQuickActions: AI failed to extract task data, using fallback');
    taskData = {
      title: inputText.substring(0, 50),
      description: inputText.substring(0, 300),
      priority: 'MEDIUM',
      dueDate: null,
      assignee: null,
    };
  }

  navigateToDashboardPopup(navigate, {
    type: 'create',
    taskData,
    originalText: inputText,
    timestamp: Date.now(),
  });
}

/**
 * Add update to existing task — same as "Add Update" in AI Actions.
 * @param {string} text
 * @param {import('react-router-dom').NavigateFunction} navigate
 */
export async function quickActionAddUpdate(text, navigate) {
  const inputText = (text || '').trim();
  if (!inputText) {
    throw new Error('No text provided');
  }

  const response = await aiAPI.identifyTaskUpdate(inputText);

  let updateData = null;
  if (response.data.success && response.data.updateData) {
    updateData = response.data.updateData;
    console.log('aiQuickActions: AI successfully identified task update:', updateData);
  } else {
    console.log('aiQuickActions: AI failed to identify task update, using fallback');
    updateData = {
      taskFound: false,
      taskId: null,
      confidence: 0,
      updateType: 'manual_update',
      updateContent: inputText.substring(0, 500),
      suggestedActions: ['manual_task_selection'],
      reasoning: 'AI could not identify specific task - manual selection required',
      originalText: inputText,
    };
  }

  navigateToDashboardPopup(navigate, {
    type: 'update',
    updateData,
    originalText: inputText,
    timestamp: Date.now(),
  });
}

/**
 * Add subtask — same as "Add Subtask" in AI Actions.
 * @param {string} text
 * @param {import('react-router-dom').NavigateFunction} navigate
 */
export async function quickActionAddSubtask(text, navigate) {
  const inputText = (text || '').trim();
  if (!inputText) {
    throw new Error('No text provided');
  }

  const identifyRes = await aiAPI.identifyTaskUpdate(inputText);
  let updateData = null;

  if (identifyRes.data.success && identifyRes.data.updateData) {
    updateData = identifyRes.data.updateData;
    console.log('aiQuickActions: AI successfully identified parent task for subtask:', updateData);
  } else {
    console.log('aiQuickActions: AI failed to identify parent task, using fallback');
    updateData = {
      taskFound: false,
      taskId: null,
      confidence: 0,
      updateType: 'manual_subtask',
      updateContent: 'Manual subtask creation',
      suggestedActions: ['manual_parent_selection'],
      reasoning: 'AI could not identify parent task - manual selection required',
      originalText: inputText,
    };
  }

  let subtaskData = null;
  try {
    const extractRes = await aiAPI.extractTask(inputText);
    if (extractRes.data.success && extractRes.data.taskData) {
      subtaskData = extractRes.data.taskData;
      console.log('aiQuickActions: AI successfully extracted subtask data:', subtaskData);
    } else {
      throw new Error('AI extraction failed');
    }
  } catch (extractErr) {
    console.log('aiQuickActions: AI failed to extract subtask data, using fallback:', extractErr);
    subtaskData = {
      title: inputText.substring(0, 50),
      description: inputText.substring(0, 300),
      priority: 'MEDIUM',
      dueDate: null,
      assignee: null,
    };
  }

  navigateToDashboardPopup(navigate, {
    type: 'addSubtask',
    updateData: {
      ...updateData,
      subtaskData,
    },
    originalText: inputText,
    timestamp: Date.now(),
  });
}

/**
 * Fetch project ideas from text — opens modal with loading, then call with result.
 * Same API as first step of "Create Project" in AI Actions.
 * @param {string} text
 * @returns {Promise<{ ideas: unknown[] }>}
 */
export async function quickActionSuggestProjectIdeas(text) {
  const inputText = (text || '').trim();
  if (!inputText) {
    throw new Error('No text provided');
  }

  const response = await aiAPI.suggestProjectIdeas(inputText);

  if (response.data.success && response.data.ideas) {
    console.log('aiQuickActions: AI suggested project ideas:', response.data.ideas);
    return { ideas: response.data.ideas };
  }
  throw new Error('Failed to get project ideas');
}

/**
 * Create project after user picks an idea in ProjectIdeaSelectionModal.
 * @param {string} clipboardText original text passed to suggestProjectIdeas
 * @param {unknown} selectedIdea
 * @param {import('react-router-dom').NavigateFunction} navigate
 */
export async function quickActionCreateProjectFromIdea(clipboardText, selectedIdea, navigate) {
  const response = await aiAPI.createProjectFromIdea(
    clipboardText,
    selectedIdea,
    null,
    null
  );

  if (response.data.success && response.data.project) {
    const project = response.data.project;
    console.log('aiQuickActions: Project created successfully:', project);

    navigate('/projects', {
      replace: false,
      state: {
        openProjectId: project.id,
        successMessage: `Project "${project.name}" created successfully with ${project.tasks?.length || 0} tasks!`,
        timestamp: Date.now(),
      },
    });
    return { project };
  }
  throw new Error('Failed to create project');
}
