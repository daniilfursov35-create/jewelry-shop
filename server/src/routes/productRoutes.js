import express from 'express';
import db from '../config/db.js';

const router = express.Router();

router.get('/products', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const offset = (page - 1) * limit;

    const query = `SELECT * FROM products LIMIT ? OFFSET ?`;

    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            console.error('Помилка при отриманні товарів:', err.message);
            return res.status(500).json({ error: 'Помилка сервера' });
        }

        res.json(rows);
    });
});
 
router.post('/products', (req, res) => {
    const { title, price, image_url, category } = req.body;

    if (!title || !price || !image_url) {
        return res.status(400).json({ error: 'Будь ласка, заповніть усі обов’язкові поля!' });
    }

    const query = `INSERT INTO products (title, price, image_url, category) VALUES (?, ?, ?, ?)`;
    
    db.run(query, [title, price, image_url, category || 'general'], function(err) {
        if (err) {
            console.error('Помилка при додаванні товару:', err.message);
            return res.status(500).json({ error: 'Помилка сервера при збереженні товару' });
        }

        res.status(201).json({
            message: 'Товар успішно додано!',
            productId: this.lastID,
            product: { id: this.lastID, title, price, image_url, category }
        });
    });
});
router.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    const query = `SELECT * FROM products WHERE id = ?`;

    db.get(query, [productId], (err, row) => {
        if (err) {
            console.error('Помилка бази даних:', err.message);
            return res.status(500).json({ error: 'Помилка сервера' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Товар не знайдено' });
        }

        res.json(row);
    });
});
export default router;