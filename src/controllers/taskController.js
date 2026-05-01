const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  creator: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
};

const getMembership = (projectId, userId) =>
  prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

// GET /api/projects/:id/tasks
const getProjectTasks = async (req, res) => {
  try {
    const member = await getMembership(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const { status, priority, assigneeId } = req.query;
    const where = { projectId: req.params.id };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/projects/:id/tasks
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const member = await getMembership(req.params.id, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const { title, description, priority, dueDate, assigneeId } = req.body;

    if (assigneeId) {
      const assignee = await getMembership(req.params.id, assigneeId);
      if (!assignee) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        projectId: req.params.id,
        creatorId: req.user.id,
      },
      include: taskInclude,
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskInclude,
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await getMembership(task.projectId, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    res.json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await getMembership(task.projectId, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    if (assigneeId) {
      const assignee = await getMembership(task.projectId, assigneeId);
      if (!assignee) return res.status(400).json({ error: 'Assignee must be a project member' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: taskInclude,
    });
    res.json({ task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await getMembership(task.projectId, req.user.id);
    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required to delete tasks' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  const { status } = req.body;
  const valid = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status value' });

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const member = await getMembership(task.projectId, req.user.id);
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status },
      include: taskInclude,
    });
    res.json({ task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
};
