const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const {
  getUserProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/projectController');
const { getProjectTasks, createTask } = require('../controllers/taskController');

router.use(authenticate);

router.get('/', getUserProjects);
router.post('/', [body('name').trim().isLength({ min: 1 }).withMessage('Project name required')], createProject);

router.get('/:id', getProject);
router.put('/:id', [body('name').optional().trim().isLength({ min: 1 })], updateProject);
router.delete('/:id', deleteProject);

// Members
router.post(
  '/:id/members',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
  ],
  addMember
);
router.delete('/:id/members/:userId', removeMember);
router.put('/:id/members/:userId', [body('role').isIn(['ADMIN', 'MEMBER'])], updateMemberRole);

// Tasks (nested under project)
router.get('/:id/tasks', getProjectTasks);
router.post(
  '/:id/tasks',
  [
    body('title').trim().isLength({ min: 1 }).withMessage('Task title required'),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  ],
  createTask
);

module.exports = router;
