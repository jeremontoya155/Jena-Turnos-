const express = require('express');
const pool = require('../config/database');
const calendarHelper = require('../utils/calendarHelper');
const router = express.Router();

// Middleware para verificar autenticación
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

// Conectar Google Calendar
router.get('/connect', ensureAuthenticated, async (req, res) => {
  try {
    // Obtener el barbero del usuario logueado
    const barberResult = await pool.query(
      'SELECT * FROM barbers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (barberResult.rows.length === 0) {
      req.flash('error', 'Primero debes completar tu perfil de barbero');
      return res.redirect('/barbers/profile');
    }
    
    const barber = barberResult.rows[0];
    const authUrl = calendarHelper.generateAuthUrl(barber.id);
    res.redirect(authUrl);
  } catch (error) {
    req.flash('error', 'Error conectando Google Calendar: ' + error.message);
    res.redirect('/barbers/dashboard');
  }
});

// Callback de Google OAuth
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const barberId = parseInt(state);
    
    if (!code) {
      throw new Error('No se recibió código de autorización');
    }
    
    // Obtener tokens
    const tokens = await calendarHelper.getTokens(code);
    
    // Guardar tokens en la base de datos
    await calendarHelper.saveTokens(barberId, tokens);
    
    req.flash('success', 'Google Calendar conectado exitosamente');
    res.redirect('/barbers/dashboard');
  } catch (error) {
    req.flash('error', 'Error en la autenticación: ' + error.message);
    res.redirect('/barbers/dashboard');
  }
});

// Desconectar Google Calendar
router.post('/disconnect', ensureAuthenticated, async (req, res) => {
  try {
    const barberResult = await pool.query(
      'SELECT * FROM barbers WHERE user_id = $1',
      [req.user.id]
    );
    
    if (barberResult.rows.length > 0) {
      await pool.query(
        'UPDATE google_tokens SET is_connected = false WHERE barber_id = $1',
        [barberResult.rows[0].id]
      );
    }
    
    req.flash('success', 'Google Calendar desconectado');
    res.redirect('/barbers/dashboard');
  } catch (error) {
    req.flash('error', 'Error desconectando Google Calendar');
    res.redirect('/barbers/dashboard');
  }
});

module.exports = router;