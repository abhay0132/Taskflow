const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getTask, updateTask, deleteTask, updateTaskStatus } = require('../controllers/taskController');

router.use(authenticate);

router.get('/:id', getTask);

router.put(
  '/:id',
  [
    body('title').optional().trim().isLength({ min: 1 }),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
  ],
  updateTask
);

router.delete('/:id', deleteTask);

router.patch('/:id/status', [body('status').isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])], updateTaskStatus);

module.exports = router;
