const { google } = require('googleapis');
const pool = require('../config/database');

class CalendarHelper {
  // Crear cliente OAuth2
  createOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Generar URL de autenticación
  generateAuthUrl(barberId) {
    const oauth2Client = this.createOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: barberId.toString()
    });
  }

  // Obtener tokens con código de autorización
  async getTokens(code) {
    const oauth2Client = this.createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  // Guardar tokens en la base de datos
  async saveTokens(barberId, tokens) {
    const query = `
      INSERT INTO google_tokens (barber_id, access_token, refresh_token, expiry_date, is_connected)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (barber_id) 
      DO UPDATE SET 
        access_token = $2,
        refresh_token = $3,
        expiry_date = $4,
        is_connected = $5,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const values = [
      barberId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expiry_date,
      true
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Obtener cliente autenticado para un barbero
  async getAuthenticatedClient(barberId) {
    const tokenResult = await pool.query(
      'SELECT * FROM google_tokens WHERE barber_id = $1 AND is_connected = true',
      [barberId]
    );
    
    if (tokenResult.rows.length === 0) {
      throw new Error('Barbero no tiene Google Calendar conectado');
    }
    
    const tokens = tokenResult.rows[0];
    const oauth2Client = this.createOAuth2Client();
    
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });
    
    return oauth2Client;
  }

  // Crear evento en Google Calendar
  async createAppointmentEvent(barberId, appointmentData) {
    try {
      const auth = await this.getAuthenticatedClient(barberId);
      const calendar = google.calendar({ version: 'v3', auth });
      
      const startDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
      const endDateTime = new Date(startDateTime.getTime() + appointmentData.duration * 60000);
      
      const event = {
        summary: `Cita de Barbería - ${appointmentData.clientName}`,
        description: `Servicio: ${appointmentData.serviceName}\nTeléfono: ${appointmentData.clientPhone}\nNotas: ${appointmentData.notes || 'Sin notas'}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires',
        },
        attendees: [
          { email: appointmentData.clientEmail, displayName: appointmentData.clientName }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      
      return response.data.id;
    } catch (error) {
      console.error('Error creando evento en Google Calendar:', error);
      throw error;
    }
  }

  // Eliminar evento de Google Calendar
  async deleteAppointmentEvent(barberId, eventId) {
    try {
      const auth = await this.getAuthenticatedClient(barberId);
      const calendar = google.calendar({ version: 'v3', auth });
      
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
      });
    } catch (error) {
      console.error('Error eliminando evento de Google Calendar:', error);
      throw error;
    }
  }
}

module.exports = new CalendarHelper();