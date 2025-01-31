const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const puppeteer = require('puppeteer-core');
const express = require("express");

async function initializeBrowserAndClient() {
    // Launch Puppeteer with no sandbox
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log("Browser launched successfully");

    // Initialize WhatsApp client with session persistence
    const client = new Client({
        authStrategy: new LocalAuth(),
    });

    client.on("qr", (qr) => {
        console.log("Scan this QR Code to log in:");
        qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
        console.log("WhatsApp Web is ready!");
    });

    await client.initialize();

    // Send message function
    const sendMessage = (number, message) => {
        let chatId = number.includes("@c.us") ? number : number + "@c.us";
        client.sendMessage(chatId, message)
            .then(() => console.log("Message sent successfully!"))
            .catch(err => console.error("Error sending message:", err));
    };

    // Expose API endpoint
    const app = express();
    app.use(express.json());

    app.post("/send", (req, res) => {
        const { number, message } = req.body;
        if (!number || !message) {
            return res.status(400).json({ error: "Missing number or message" });
        }
        sendMessage(number, message);
        res.json({ success: true, message: "Message sent!" });
    });

    app.listen(3000, () => console.log("Server running on port 3000"));
}

// Run the initialize function
initializeBrowserAndClient().catch(err => console.error(err));
