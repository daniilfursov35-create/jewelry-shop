import express from 'express';
import crypto from 'crypto';
import db from '../config/db.js';

const router = express.Router();

// 1. Створення замовлення та відправка реальної SMS
router.post('/orders', (req, res) => {
    const { customer, delivery, items, totalPrice } = req.body;

    if (!customer || !customer.name || !customer.phone || !delivery || !items || items.length === 0) {
        return res.status(400).json({ error: 'Неповні дані замовлення!' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const orderQuery = `
        INSERT INTO orders (customer_name, customer_phone, customer_email, delivery_details, total_price, status, token) 
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `;
    
    db.run(orderQuery, [customer.name, customer.phone, customer.email || '', delivery, totalPrice, verificationToken], function(err) {
        if (err) {
            console.error('Помилка бази даних:', err.message);
            return res.status(500).json({ error: 'Помилка сервера при створенні замовлення' });
        }

        const orderId = this.lastID;
        const itemQuery = `INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)`;
        
        let completed = 0;
        let hasError = false;

        items.forEach(item => {
            db.run(itemQuery, [orderId, item.productId, item.quantity], async (itemErr) => {
                if (itemErr && !hasError) {
                    hasError = true;
                    return res.status(500).json({ error: 'Помилка збереження товарів' });
                }

                completed++;
                if (completed === items.length && !hasError) {
                    
                    // Беремо реальний домен із налаштувань сервера (.env)
                    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
                    const activationLink = `${baseUrl}/api/orders/verify?token=${verificationToken}`;
                    
                    // Текст SMS латиницею або кирилицею (латиниця дешевша — 1 сегмент замість 2-3)
                    const smsText = `Zamovlennya #${orderId} pryynyato. Pidtverdit za posylannyam: ${activationLink}`;

                    try {
                        const smsResponse = await fetch('https://api.turbosms.ua/message/send.json', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.TURBOSMS_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                recipients: [customer.phone],
                                sms: {
                                    sender: process.env.SMS_SENDER || 'Msg', // Ім'я відправника в кабінеті TurboSMS
                                    text: smsText
                                }
                            })
                        });

                        const smsResult = await smsResponse.json();

                        if (smsResult.response_code !== 200) {
                            console.error('Помилка TurboSMS:', smsResult);
                            return res.status(502).json({ error: 'Замовлення збережено, але SMS-шлюз відхилив відправку.' });
                        }

                        res.status(201).json({
                            message: 'Замовлення створено! Ми надіслали SMS із посиланням для підтвердження.',
                            orderId: orderId
                        });

                    } catch (smsErr) {
                        console.error('Помилка з’єднання з SMS-шлюзом:', smsErr);
                        res.status(500).json({ error: 'Помилка відправки SMS-підтвердження' });
                    }
                }
            });
        });
    });
});

// 2. Підтвердження замовлення за посиланням із SMS
router.get('/orders/verify', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).send('<h3>Помилка: відсутній токен активації.</h3>');
    }

    db.get(`SELECT * FROM orders WHERE token = ?`, [token], (err, order) => {
        if (err || !order) {
            return res.status(404).send('<h3>Помилка: посилання недійсне або замовлення вже підтверджено.</h3>');
        }

        db.run(`UPDATE orders SET status = 'confirmed', token = NULL WHERE id = ?`, [order.id], (updateErr) => {
            if (updateErr) {
                return res.status(500).send('<h3>Помилка сервера при активації.</h3>');
            }

            // Перенаправляємо клієнта назад на сайт із параметром успіху (або віддаємо сторінку подяки)
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            res.send(`
                <div style="text-align: center; font-family: sans-serif; margin-top: 60px;">
                    <h1 style="color: #2e7d32;">✅ Замовлення №${order.id} підтверджено!</h1>
                    <p>Дякуємо, ${order.customer_name}! Ми вже готуємо ваші прикраси до відправки.</p>
                    <a href="${frontendUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 4px;">Повернутися до магазину</a>
                </div>
            `);
        });
    });
});

export default router;