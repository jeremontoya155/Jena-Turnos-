const express = require('express');
const Barber = require('../models/Barber');
const router = express.Router();

// Página principal - Buscar barberos
router.get('/', async (req, res) => {
  try {
    const { neighborhood, city } = req.query;
    
    const barbers = await Barber.search({ neighborhood, city });
    
    res.render('pages/index', {
      title: 'Encuentra tu Barbero',
      barbers,
      search: { neighborhood, city },
      user: req.user
    });
  } catch (error) {
    console.error('Error cargando barberos:', error);
    res.render('pages/index', {
      title: 'Encuentra tu Barbero',
      barbers: [],
      search: {},
      user: req.user
    });
  }
});

// Ver perfil público de barbero
router.get('/barber/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const barber = await Barber.findById(id);
    
    if (!barber || !barber.is_verified) {
      req.flash('error', 'Barbero no encontrado');
      return res.redirect('/');
    }
    
    const services = await Barber.getServices(id);
    const workingHours = await Barber.getWorkingHours(id);
    
    // Organizar horarios por día
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const schedule = days.map((day, index) => {
      const daySchedule = workingHours.find(wh => wh.day_of_week === index);
      return {
        day_name: day,
        ...daySchedule
      };
    }).filter(s => s.is_active);
    
    res.render('pages/barber-profile', {
      title: barber.shop_name,
      barber,
      services,
      schedule,
      user: req.user
    });
  } catch (error) {
    console.error('Error cargando perfil de barbero:', error);
    req.flash('error', 'Error cargando perfil del barbero');
    res.redirect('/');
  }
});

module.exports = router;