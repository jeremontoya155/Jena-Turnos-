-- Schema para sistema de turnos de barbería
-- Base de datos PostgreSQL

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS working_hours CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS google_tokens CASCADE;
DROP TABLE IF EXISTS barbers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Tabla de usuarios (barberos)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'barber',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de barberos (perfil extendido)
CREATE TABLE barbers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    shop_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    description TEXT,
    hourly_rate DECIMAL(10,2),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de servicios y precios
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de horarios de trabajo
CREATE TABLE working_hours (
    id SERIAL PRIMARY KEY,
    barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0=Domingo, 1=Lunes, ..., 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(barber_id, day_of_week)
);

-- Tabla de turnos/citas
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20) NOT NULL,
    client_email VARCHAR(255),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    notes TEXT,
    google_event_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de mensajes
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'client' o 'barber'
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para tokens de Google Calendar
CREATE TABLE google_tokens (
    id SERIAL PRIMARY KEY,
    barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50),
    expiry_date BIGINT,
    is_connected BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(barber_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_barbers_neighborhood ON barbers(neighborhood);
CREATE INDEX idx_barbers_city ON barbers(city);
CREATE INDEX idx_appointments_barber_date ON appointments(barber_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_messages_appointment ON messages(appointment_id);

-- Insertar usuario de prueba (barbero)
INSERT INTO users (name, email, password, phone, role) 
VALUES ('Juan Pérez', 'juan@barberia.com', '$2a$10$XqK3K3K3K3K3K3K3K3K3K.K3K3K3K3K3K3K3K3K3K3K3K3K3K', '+54911123456', 'barber');

-- Insertar barbería de prueba
INSERT INTO barbers (user_id, shop_name, address, neighborhood, city, description, hourly_rate, is_verified)
VALUES (1, 'Barbería El Tigre', 'Av. Corrientes 1234', 'Centro', 'Buenos Aires', 'Barbería tradicional con más de 10 años de experiencia', 5000.00, true);

-- Insertar servicios de prueba
INSERT INTO services (barber_id, name, description, price, duration_minutes)
VALUES 
    (1, 'Corte de pelo', 'Corte tradicional o moderno', 3000.00, 30),
    (1, 'Barba', 'Arreglo y perfilado de barba', 2000.00, 20),
    (1, 'Corte + Barba', 'Servicio completo', 4500.00, 45);

-- Insertar horarios de trabajo de prueba
INSERT INTO working_hours (barber_id, day_of_week, start_time, end_time)
VALUES 
    (1, 1, '09:00', '18:00'), -- Lunes
    (1, 2, '09:00', '18:00'), -- Martes
    (1, 3, '09:00', '18:00'), -- Miércoles
    (1, 4, '09:00', '18:00'), -- Jueves
    (1, 5, '09:00', '18:00'), -- Viernes
    (1, 6, '09:00', '13:00'); -- Sábado
