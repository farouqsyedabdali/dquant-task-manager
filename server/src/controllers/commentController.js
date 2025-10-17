const { PrismaClient } = require('@prisma/client');
const { createNotification, notifyTaskUsers } = require('./notificationController');
const { logAuditActionDirect } = require('../middleware/auditLogger');
const { autoChangeStatusToInProgress } = require('../utils/autoStatusManager');

const prisma = new PrismaClient();

// Get comments for a task
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    // Check if user has access to this task
    let whereClause = { 
      id: parseInt(taskId),
      companyId: companyId
    };
    if (userRole === 'EMPLOYEE') {
      whereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId },
        { coAssignees: { some: { userId: userId } } },
        { sharedWith: { some: { userId: userId } } }
      ];
    } // For ADMIN and SYSADMIN, no additional restriction (can see all tasks in company)

    const task = await prisma.task.findFirst({
      where: whereClause
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comments = await prisma.comment.findMany({
      where: { 
        taskId: parseInt(taskId),
        companyId: companyId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create comment
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const authorId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    // Check if user has access to this task
    let whereClause = { 
      id: parseInt(taskId),
      companyId: companyId
    };
    if (userRole === 'EMPLOYEE') {
      whereClause.OR = [
        { assigneeId: authorId },
        { assignerId: authorId },
        { coAssignees: { some: { userId: authorId } } }
      ];
    }

    const task = await prisma.task.findFirst({
      where: whereClause
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: parseInt(taskId),
        authorId,
        companyId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Notify creator, lead assignee, and all co-assignees
    // Special case: Don't notify creator if this is a comment on a subtask
    await notifyTaskUsers(
      'COMMENT_ADDED',
      'New Comment Added',
      `A new comment was added to task "${task.title}"`,
      task.id,
      authorId, // Don't notify the comment author
      companyId,
      { excludeCreatorForSubtaskComments: true } // Don't notify parent task creator for subtask comments
    );

    // Auto-change status from TODO to IN_PROGRESS if this is the first comment
    // and status hasn't been manually changed by the creator
    await autoChangeStatusToInProgress(parseInt(taskId), companyId);

    // Log audit action
    await logAuditActionDirect(req, 'COMMENT_CREATED', 'Comment', {
      entityId: comment.id,
      taskTitle: task.title,
      commentContent: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      metadata: {
        taskId: parseInt(taskId),
        commentLength: content.length
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update comment (author or admin only)
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;
    const companyId = req.user.companyId;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.comment.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      },
      include: {
        task: true
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user can edit this comment (author or admin)
    if (userRole !== 'ADMIN' && userRole !== 'SYSDMIN' && comment.authorId !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    // Check if user has access to the task this comment belongs to
    let taskWhereClause = { 
      id: comment.taskId,
      companyId: companyId
    };
    if (userRole === 'EMPLOYEE') {
      taskWhereClause.OR = [
        { assigneeId: userId },
        { assignerId: userId },
        { coAssignees: { some: { userId: userId } } }
      ];
    }

    console.log('Update comment debug:', {
      userId,
      userRole,
      companyId,
      commentId: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      taskWhereClause
    });

    const task = await prisma.task.findFirst({
      where: taskWhereClause
    });

    console.log('Task found:', !!task);

    if (!task) {
      return res.status(403).json({ error: 'You do not have access to this task' });
    }

    // Log audit action before update
    await logAuditActionDirect(req, 'COMMENT_UPDATED', 'Comment', {
      entityId: comment.id,
      taskTitle: task.title,
      oldCommentContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
      newCommentContent: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      metadata: {
        taskId: comment.taskId,
        oldLength: comment.content.length,
        newLength: content.length
      }
    });

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { 
        content,
        editedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(updatedComment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete comment (admin only)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    const comment = await prisma.comment.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      },
      include: {
        task: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Log audit action before deletion
    await logAuditActionDirect(req, 'COMMENT_DELETED', 'Comment', {
      entityId: comment.id,
      taskTitle: comment.task.title,
      commentContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
      metadata: {
        taskId: comment.taskId,
        commentLength: comment.content.length
      }
    });

    await prisma.comment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment
}; 