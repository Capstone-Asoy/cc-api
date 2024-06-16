const express = require('express');
const router = express.Router();
const controller = require('../controller/controller');
const cekToken = require('../token/token')

router.get('/', controller.path)
router.get('/readiness_check', controller.path)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logout);
router.get('/me', cekToken, controller.profile);
router.put('/editProfile', cekToken, controller.editProfile);

router.get('/detailBook/:id', cekToken, controller.detailBook);
router.post('/bookmarks', cekToken, controller.addBookmark);
router.delete('/bookmarks/:books_id', cekToken, controller.deleteBookmark);
router.get('/bookmarks', cekToken, controller.getBookmarks);
router.get('/search', controller.searchBooks);
// router.post('/preferensi/:userId', cekToken, controller.saveUserPreferences);

router.post('/detailBook/addRating', cekToken, controller.addRating);
// router.get('/getBooks', cekToken, controller.getBook);
router.get('/filter', cekToken, controller.filtering);
router.get('/getHistory', cekToken, controller.getHistory);
// router.patch('/change-password', cekToken, controller.chgPass);
router.post('/preference', cekToken, controller.preference);
router.get('/getRekomendasi', cekToken, controller.getPreference);

router.get('/genres', controller.getGenres);

module.exports = router;