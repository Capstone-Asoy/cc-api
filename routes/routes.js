const express = require('express');
const router = express.Router();
const controller = require('../controller/controller');
const cekToken = require('../token/token')

router.get('/', controller.path)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.post('/aksi', cekToken, controller.aksi);

module.exports = router;