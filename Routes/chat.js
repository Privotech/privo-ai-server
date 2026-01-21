const { Router } = require('express');
const { body } = require('express-validator');
const chatController = require('../Controllers/chatController');
const validate = require('../Validators/chatValidator');

const router = Router();

router.post(
  '/',
  [
    body('message').isString().trim().notEmpty().withMessage('message is required'),
    body('history').optional().isArray(),
  ],
  validate,
  chatController.handleChat
);

module.exports = router;