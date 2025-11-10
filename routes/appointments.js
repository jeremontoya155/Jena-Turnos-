const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const router = express.Router();

// Solicitar turno (público)
router.post('/request', appointmentController.requestAppointment);

// Ver turno
router.get('/:id', appointmentController.viewAppointment);

// Confirmar turno (barbero)
router.post('/:id/confirm', appointmentController.confirmAppointment);

// Cancelar turno
router.post('/:id/cancel', appointmentController.cancelAppointment);

// Enviar mensaje
router.post('/:id/message', appointmentController.sendMessage);

// API: Obtener horarios disponibles
router.get('/api/available-slots', appointmentController.getAvailableSlots);

module.exports = router;