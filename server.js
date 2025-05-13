const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // Secure token access

app.post('/create-calendar-event', async (req, res) => {
  const {
    calendarId,
    summary,
    description,
    location,
    startDateTime,
    endDateTime,
    attendees
  } = req.body;

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: ACCESS_TOKEN });

    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.insert({
      calendarId,
      sendUpdates: 'all',
      conferenceDataVersion: 1,
      requestBody: {
        summary,
        description,
        location,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Los_Angeles'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Los_Angeles'
        },
        attendees: attendees.map(email => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: `vapi-${Date.now()}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      }
    });

    res.json({
      eventLink: response.data.htmlLink,
      meetLink: response.data.conferenceData.entryPoints?.[0]?.uri || null
    });
  } catch (err) {
    console.error('Google API Error:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to create calendar event',
      details: err.response?.data || err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
