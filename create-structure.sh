#!/bin/bash

echo "Creando estructura de la aplicación de barbería..."

# Crear directorio principal
mkdir -p barberia-app
cd barberia-app

# Crear estructura de carpetas
mkdir -p config
mkdir -p controllers
mkdir -p middleware
mkdir -p models
mkdir -p routes
mkdir -p public/css
mkdir -p public/js
mkdir -p public/images
mkdir -p public/uploads
mkdir -p views/partials
mkdir -p views/auth
mkdir -p views/barbers
mkdir -p views/appointments
mkdir -p views/pages
mkdir -p utils

echo "Estructura de carpetas creada..."

# Crear archivos
touch config/database.js
touch config/passport.js
touch controllers/authController.js
touch controllers/barberController.js
touch controllers/appointmentController.js
touch controllers/userController.js
touch middleware/authMiddleware.js
touch middleware/validationMiddleware.js
touch models/User.js
touch models/Barber.js
touch models/Appointment.js
touch models/Service.js
touch routes/auth.js
touch routes/barbers.js
touch routes/appointments.js
touch routes/index.js
touch utils/calendarHelper.js
touch utils/notificationHelper.js
touch utils/validationHelper.js
touch .env
touch .gitignore
touch package.json
touch server.js

echo "Archivos creados exitosamente!"
echo "Estructura completada!"
