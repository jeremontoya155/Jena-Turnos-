const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const flash = require('express-flash');
require('dotenv').config();

const app = express();

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET || 'mi_secreto_por_defecto',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Passport
require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.error = req.flash('error');
  next();
});

// Rutas
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/barbers', require('./routes/barbers'));
app.use('/appointments', require('./routes/appointments'));
app.use('/calendar', require('./routes/calendar'));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Página no encontrada' });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('pages/error', { 
    title: 'Error', 
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Importante: escuchar en todas las interfaces

app.listen(PORT, HOST, () => {
  console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});