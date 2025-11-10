const express = require('express');
const passport = require('passport');
const authController = require('../controllers/authController');
const router = express.Router();

// Vistas
router.get('/register', authController.showRegister);
router.get('/login', authController.showLogin);

// Procesos
router.post('/register', authController.register);

router.post('/login', passport.authenticate('local', {
  successRedirect: '/barbers/dashboard',
  failureRedirect: '/auth/login',
  failureFlash: true
}));

router.get('/logout', authController.logout);

module.exports = router;