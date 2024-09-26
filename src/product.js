const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib/callback_api');
require('dotenv').config();

const app = express();
const port = process.env.PRODUCT_PORT || 9301;
app.use(express.json());

// PostgreSQL
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB_NAME,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

const connectToRabbitMQ = (callback) => {
    amqp.connect(process.env.RABBITMQ_URL, (error0, connection) => {
        if (error0) {
            console.error('Error connecting to RabbitMQ:', error0.message);
            return;
        }
        connection.createChannel((error1, channel) => {
            if (error1) {
                console.error('Error creating RabbitMQ channel:', error1.message);
                return;
            }
            callback(channel);
        });
    });
};

// Checkout route
app.post('/product/check-out', async (req, res) => {
    const { productId, qty, userId } = req.body;

    try {
        await pool.query('BEGIN');


        const productRes = await pool.query('SELECT * FROM product WHERE id = $1', [productId]);
        const product = productRes.rows[0];

        if (!product || product.qty < qty) {
            return res.status(400).json({ error: 'Insufficient product quantity' });
        }

        await pool.query('UPDATE product SET qty = qty - $1 WHERE id = $2', [qty, productId]);

        const paymentData = {
            userId,
            productId,
            qty,
            price: product.price,
            bill: product.price * qty,
            paymentAt: new Date(),
        };

        connectToRabbitMQ((channel) => {
            const msg = JSON.stringify(paymentData);
            channel.sendToQueue('M!PAYMENT', Buffer.from(msg));
            console.log('Sent message to Payment service:', msg);
        });

        await pool.query('COMMIT');
        return res.status(200).json({ message: 'Checkout successful, payment message sent.' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error during checkout:', err);
        return res.status(500).json({ error: 'Checkout failed' });
    }
});

app.listen(port, () => {
    console.log(`Product service running on http://localhost:${port}`);
});
