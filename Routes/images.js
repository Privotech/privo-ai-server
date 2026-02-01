const { Router } = require('express');
const requireAuth = require('../Middlewares/requireAuth');
const requireDB = require('../Middlewares/requireDB');
const { list, generate } = require('../Controllers/imageController');

const router = Router();

router.get('/', requireAuth, requireDB, list);
router.post('/', requireAuth, requireDB, generate);

module.exports = router;