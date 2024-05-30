const express = require('express');
const router = express.Router();
const controller = require('../controller/controller');
const cekToken = require('../token/token')

router.get('/', controller.path)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/profile', cekToken, controller.profile);
router.put('/editProfile', cekToken, controller.editProfile);
router.get('/getBooks', cekToken, controller.getBook);
router.get('/filter', cekToken, controller.filtering);
router.get('/detailBook/:id', controller.detailBook);
router.post('/bookmarks', cekToken, controller.addBookmark);
router.delete('/bookmarks/:bookmarks_id', cekToken, controller.deleteBookmark);
router.get('/bookmarks', cekToken, controller.getBookmarks);
router.get('/search', controller.searchBooks);
// router.post('/preferensi/:userId', cekToken, controller.saveUserPreferences);

module.exports = router;