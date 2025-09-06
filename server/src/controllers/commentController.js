const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('./notificationController');

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
        { coAssignees: { some: { userId: userId } } }
      ];
    }

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

    // Create notification for task assignee and assigner (if different from comment author)
    const notifyUsers = [];
    if (task.assigneeId !== authorId) {
      notifyUsers.push(task.assigneeId);
    }
    if (task.assignerId !== authorId && task.assignerId !== task.assigneeId) {
      notifyUsers.push(task.assignerId);
    }

    for (const userId of notifyUsers) {
      await createNotification(
        'COMMENT_ADDED',
        'New Comment Added',
        `A new comment was added to task "${task.title}"`,
        task.id,
        userId,
        companyId
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update comment (admin only)
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const companyId = req.user.companyId;

    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const comment = await prisma.comment.findFirst({
      where: { 
        id: parseInt(id),
        companyId: companyId
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content },
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
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

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