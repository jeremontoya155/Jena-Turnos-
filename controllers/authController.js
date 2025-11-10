const User = require('../models/User');
const Barber = require('../models/Barber');
const pool = require('../config/database');

// Mostrar formulario de registro
exports.showRegister = (req, res) => {
  res.render('auth/register', { title: 'Registro de Barbero' });
};

// Procesar registro
exports.register = async (req, res) => {
  const { name, email, password, password2, phone, shop_name, address, neighborhood, city } = req.body;

  try {
    // Validaciones
    if (!name || !email || !password || !password2 || !shop_name || !address || !neighborhood || !city) {
      req.flash('error', 'Por favor completa todos los campos');
      return res.redirect('/auth/register');
    }

    if (password !== password2) {
      req.flash('error', 'Las contraseñas no coinciden');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error', 'La contraseña debe tener al menos 6 caracteres');
      return res.redirect('/auth/register');
    }

    // Verificar si el email ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      req.flash('error', 'El email ya está registrado');
      return res.redirect('/auth/register');
    }

    // Crear usuario y barbero en una transacción
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Crear usuario
      const user = await User.create({
        name,
        email,
        password,
        phone,
        role: 'barber'
      });

      // Crear perfil de barbero
      await Barber.create(user.id, {
        shop_name,
        address,
        neighborhood,
        city
      });

      await client.query('COMMIT');
      req.flash('success', 'Registro exitoso. Ahora puedes iniciar sesión.');
      res.redirect('/auth/login');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error en registro:', error);
    req.flash('error', 'Error en el registro: ' + error.message);
    res.redirect('/auth/register');
  }
};

// Mostrar formulario de login
exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar Sesión' });
};

// Logout
exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error en logout:', err);
    }
    req.flash('success', 'Sesión cerrada exitosamente');
    res.redirect('/');
  });
};
