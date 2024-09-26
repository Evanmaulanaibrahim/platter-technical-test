const express = require('express');
const { Pool } = require('pg');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const port = process.env.USER_PORT || 9303;
app.use(express.json());

// PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// User route to get user details by ID
app.get('/user/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10);

    try {
        const userRes = await pool.query('SELECT * FROM "user" WHERE id = $1', [userId]);
        const user = userRes.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json(user);
    } catch (err) {
        console.error('Error retrieving user:', err);
        return res.status(500).json({ error: 'Error retrieving user' });
    }
});

// WebSocket
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const handleNotification = (message) => {
    const notificationData = JSON.parse(message);
    console.log('Received notification:', notificationData);
    broadcast(JSON.stringify(notificationData)); // Broadcast to all clients
};

wss.on('message', handleNotification);

server.listen(port, () => {
    console.log(`User service running on http://localhost:${port}`);
});
