// auth.routes.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login',
  [body('email').isEmail(), body('password').notEmpty()],
  authController.login
);

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

router.post('/register', authenticate, requireAdmin,
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
  ],
  authController.register
);

module.exports = router;
