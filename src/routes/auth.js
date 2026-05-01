const router = require('express').Router();
const { body } = require('express-validator');
const { signup, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  signup
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  login
);

router.get('/me', authenticate, getMe);

module.exports = router;
