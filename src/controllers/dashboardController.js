const prisma = require('../lib/prisma');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const [totalTasks, myActiveTasks, overdueTasks, tasksByStatus, recentTasks, overduelist, projects] =
      await Promise.all([
        prisma.task.count({ where: { projectId: { in: projectIds } } }),

        prisma.task.count({
          where: { assigneeId: userId, status: { not: 'DONE' } },
        }),

        prisma.task.count({
          where: { projectId: { in: projectIds }, dueDate: { lt: now }, status: { not: 'DONE' } },
        }),

        prisma.task.groupBy({
          by: ['status'],
          where: { projectId: { in: projectIds } },
          _count: true,
        }),

        prisma.task.findMany({
          where: { assigneeId: userId, status: { not: 'DONE' } },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 6,
        }),

        prisma.task.findMany({
          where: { projectId: { in: projectIds }, dueDate: { lt: now }, status: { not: 'DONE' } },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 6,
        }),

        prisma.project.findMany({
          where: { id: { in: projectIds } },
          include: { _count: { select: { tasks: true, members: true } } },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]);

    const statusMap = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    tasksByStatus.forEach((s) => {
      statusMap[s.status] = s._count;
    });

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks,
        myActiveTasks,
        overdueTasks,
      },
      tasksByStatus: statusMap,
      recentTasks,
      overdueTasks: overduelist,
      projects,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboard };
