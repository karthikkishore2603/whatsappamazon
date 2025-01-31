const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
let isAuthenticated = false;  // Flag to track authentication status

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome-stable',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});;

app.use(bodyParser.json());

let qrCodeUrl = ''; // Store QR Code URL

// Generate QR Code
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error("Error generating QR code:", err);
            return;
        }
        qrCodeUrl = url;
    });
});

// When WhatsApp is authenticated
client.on('ready', () => {
    console.log('WhatsApp is ready!');
    isAuthenticated = true;
});

// When WhatsApp logs out
client.on('disconnected', () => {
    console.log('WhatsApp Disconnected!');
    isAuthenticated = false;
});

// QR Code or Logout Button Page
app.get('/qr', (req, res) => {
    if (isAuthenticated) {
        res.send(`
            <p>You are already logged in!</p>
            <form action="/logout" method="POST">
                <button type="submit">Sign Out</button>
            </form>
        `);
    } else {
        res.send(`
            <p>Scan this QR code to log in:</p>
            <img src="${qrCodeUrl}" alt="QR Code"><br/>
        `);
    }
});

// Logout Route
app.post('/logout', async (req, res) => {
    try {
        await client.logout();
        isAuthenticated = false;
        res.send("<p>Logged out successfully! <a href='/qr'>Go back</a></p>");
    } catch (error) {
        console.error('Logout failed:', error);
        res.status(500).send('<p>Error logging out</p>');
    }
});

// Send Message API
app.post('/send-message', async (req, res) => {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
        return res.status(400).send({ error: 'phoneNumber and message are required' });
    }

    try {
        const chatId = `${phoneNumber}@c.us`;
        await client.sendMessage(chatId, message);
        res.status(200).send({ success: true, message: `Message sent to ${phoneNumber}` });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send({ error: 'Failed to send message' });
    }
});

// Start server
app.listen(3000, () => {
    console.log('App running on port 3000');
});

client.initialize();
