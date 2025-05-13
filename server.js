const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Write service account key from base64 env variable (Render-safe)
if (process.env.GOOGLE_SERVICE_ACCOUNT_B64) {
  fs.writeFileSync(
    'service-account.json',
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_B64, 'base64')
  );
}

// 🔑 Set up Google Auth using service account
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/calendar.events'],
});

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
    const authClient = await auth.getClient();
    const calendar = google.calendar({ version: 'v3', auth: authClient });

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
