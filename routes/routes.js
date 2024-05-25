const express = require('express');
const router = express.Router();
const controller = require('../controller/controller');
const cekToken = require('../token/token')

router.get('/', controller.path)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.post('/profile', cekToken, controller.profile);
router.put('/editProfile', cekToken, controller.editProfile);
router.get('/getBooks', cekToken, controller.getBook);
router.get('/filter', cekToken, controller.filtering);

module.exports = router;