const { Router } = require('express');
const requireAuth = require('../Middlewares/requireAuth');
const { list, generate } = require('../Controllers/imageController');

const router = Router();

router.get('/', requireAuth, list);
router.post('/', requireAuth, generate);

module.exports = router;