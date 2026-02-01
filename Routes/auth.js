const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../Validators/chatValidator');
const authController = require('../Controllers/authController');
const oauthController = require('../Controllers/oauthController');
const requireAuth = require('../Middlewares/requireAuth');
const requireDB = require('../Middlewares/requireDB');

const router = Router();

router.post(
  '/signup',
  requireDB,
  [
    body('name').isString().trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
  ],
  validate,
  authController.signup
);

router.post(
  '/signin',
  requireDB,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6 }),
  ],
  validate,
  authController.signin
);

// Current user
router.get('/me', requireAuth, authController.me);

// Update current user
router.put(
  '/me',
  [
    requireAuth,
    requireDB,
    body('name').isString().trim().notEmpty(),
  ],
  validate,
  authController.updateMe
);

// Change password (local accounts only)
router.post(
  '/password',
  [
    requireAuth,
    requireDB,
    body('currentPassword').isString().isLength({ min: 6 }),
    body('newPassword').isString().isLength({ min: 6 }),
  ],
  validate,
  authController.changePassword
);

// OAuth routes
router.get('/google', oauthController.googleStart);
router.get('/google/callback', requireDB, oauthController.googleCallback);
router.get('/github', oauthController.githubStart);
router.get('/github/callback', requireDB, oauthController.githubCallback);

module.exports = router;