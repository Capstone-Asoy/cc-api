const express = require('express');
const router = express.Router();
const controller = require('../controller/controller');
const cekToken = require('../token/token')

router.get('/', controller.path)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', cekToken, controller.profile);
router.put('/editProfile', cekToken, controller.editProfile);
router.post('/detailBook/addRating', cekToken, controller.addRating);
// router.get('/getBooks', cekToken, controller.getBook);
router.get('/filter', controller.filtering);
router.get('/getHistory', cekToken, controller.getHistory);
router.patch('/change-password', cekToken, controller.chgPass);

module.exports = router;