const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const memberSelect = {
  include: { user: { select: { id: true, name: true, email: true } } },
};

const getUserProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberSelect,
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberSelect,
        _count: { select: { tasks: true, members: true } },
      },
    });
    res.status(201).json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberSelect,
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.members.some((m) => m.userId === req.user.id);
    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const member = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: req.user.id } },
    });
    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, description } = req.body;
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }) },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: memberSelect,
      },
    });
    res.json({ project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the owner can delete this project' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addMember = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role = 'MEMBER' } = req.body;
  try {
    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: req.user.id } },
    });
    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found with that email' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: userToAdd.id } },
    });
    if (existing) return res.status(400).json({ error: 'User is already a project member' });

    const member = await prisma.projectMember.create({
      data: { projectId: req.params.id, userId: userToAdd.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const removeMember = async (req, res) => {
  try {
    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: req.user.id } },
    });
    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (req.params.userId === project.ownerId) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }
    if (req.params.userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateMemberRole = async (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'MEMBER'].includes(role)) {
    return res.status(400).json({ error: 'Role must be ADMIN or MEMBER' });
  }

  try {
    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.id, userId: req.user.id } },
    });
    if (!requester || requester.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: req.params.id, userId: req.params.userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ member: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUserProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
};
