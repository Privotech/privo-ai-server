const { Router } = require('express');
const { body, param } = require('express-validator');
const validate = require('../Validators/chatValidator');
const requireAuth = require('../Middlewares/requireAuth');
const ctrl = require('../Controllers/chatSessionController');

const router = Router();

router.use(requireAuth);

router.post('/', [body('title').optional().isString()], validate, ctrl.createChat);
router.get('/', ctrl.listChats);
router.get('/:id', [param('id').isString()], validate, ctrl.getChat);
router.post('/:id/messages', [param('id').isString(), body('message').isString().trim().notEmpty()], validate, ctrl.sendMessage);
router.delete('/:id', [param('id').isString()], validate, ctrl.deleteChat);

module.exports = router;