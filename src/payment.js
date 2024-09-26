const express = require('express');
const { Client } = require('pg');
const amqp = require('amqplib/callback_api'); // For RabbitMQ
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9302;

app.use(express.json());

// PostgreSQL
const dbClient = new Client({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

dbClient.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err.stack));

// RabbitMQ setup
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

amqp.connect(RABBITMQ_URL, (error0, connection) => {
    if (error0) {
        throw error0;
    }

    connection.createChannel((error1, channel) => {
        if (error1) {
            throw error1;
        }

        const queue = 'payment_queue';
        channel.assertQueue(queue, {
            durable: false
        });

        console.log(`Waiting for messages in ${queue}`);

        channel.consume(queue, async (msg) => {
            const { userId, productId, qty, price } = JSON.parse(msg.content.toString());

            const bill = qty * price;

            const insertQuery = `
                INSERT INTO payment (paymentAt, userId, productId, price, qty, bill)
                VALUES (NOW(), $1, $2, $3, $4, $5) RETURNING id;
            `;
            try {
                const res = await dbClient.query(insertQuery, [userId, productId, price, qty, bill]);
                console.log(`Payment record added with ID: ${res.rows[0].id}`);

                const notificationMessage = {
                    userId,
                    productId,
                    qty,
                    bill
                };

                channel.sendToQueue('notification_queue', Buffer.from(JSON.stringify(notificationMessage)));
                console.log("Sent notification message");

            } catch (error) {
                console.error('Error inserting payment record:', error);
            }
        }, {
            noAck: true
        });
    });
});

app.listen(PORT, () => {
    console.log(`Payment service is running on http://localhost:${PORT}`);
});
