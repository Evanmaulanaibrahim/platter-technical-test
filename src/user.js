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
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'postgres',
    database: process.env.PG_DATABASE || 'platter_db',
    password: process.env.PG_PASSWORD || 'postgres123',
    port: process.env.PG_PORT || 5432,
});

// Error handling
pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});

// Create an HTTP & Websocket
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Function to broadcast data to all connected clients
const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
};

// User route
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

// WebSocket Conn Handler
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        handleNotification(message);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Handle notif and broadcast
const handleNotification = (message) => {
    try {
        const notificationData = JSON.parse(message);
        console.log('Received notification:', notificationData);
        broadcast(JSON.stringify(notificationData)); // Broadcast to all clients
    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

server.listen(port, () => {
    console.log(`User service running on http://localhost:${port}`);
});
