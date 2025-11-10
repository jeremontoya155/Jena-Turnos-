const express = require('express');
const barberController = require('../controllers/barberController');
const router = express.Router();

// Middleware para verificar autenticación y rol de barbero
function ensureBarber(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'barber') {
    return next();
  }
  req.flash('error', 'Debes iniciar sesión como barbero');
  res.redirect('/auth/login');
}

// Dashboard
router.get('/dashboard', ensureBarber, barberController.dashboard);

// Perfil
router.get('/profile', ensureBarber, barberController.profile);
router.post('/profile', ensureBarber, barberController.updateProfile);

// Servicios
router.get('/services', ensureBarber, barberController.services);
router.post('/services', ensureBarber, barberController.createService);
router.post('/services/:id/update', ensureBarber, barberController.updateService);
router.post('/services/:id/delete', ensureBarber, barberController.deleteService);

// Horarios
router.get('/schedule', ensureBarber, barberController.schedule);
router.post('/schedule', ensureBarber, barberController.updateSchedule);

// Turnos
router.get('/appointments', ensureBarber, barberController.appointments);

module.exports = router;