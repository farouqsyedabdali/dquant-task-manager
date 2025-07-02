const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignedTo: {
          select: { name: true }, // Include only the user's name
        },
        comments: true,
      },
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, assignedTo } = req.body;

    // Resolve the assignedTo name to a user ID
    const user = assignedTo
      ? await prisma.user.findUnique({ where: { name: assignedTo } })
      : null;

    if (assignedTo && !user) {
      return res.status(404).json({ error: "User not found" });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        assignedTo: user ? { connect: { id: user.id } } : undefined,
      },
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.task.delete({ where: { id: Number(id) } })
    res.json({ message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: updates
    })
    res.json(task)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
