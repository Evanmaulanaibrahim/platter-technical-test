require('dotenv').config();
const WebSocket = require('ws');

const PORT = process.env.NOTIFICATION_PORT || 9304; // Default port if not specified in .env

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
    });

    // Welcome Message
    ws.send(JSON.stringify({ message: 'Welcome to the notification service!' }));

    // Notif every 5 seconds
    const intervalId = setInterval(() => {
        const notification = {
            message: 'This is a notification',
            timestamp: new Date(),
        };
        ws.send(JSON.stringify(notification));
    }, 5000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(intervalId);
    });
});

console.log(`Notification service is running on ws://localhost:${PORT}`);
