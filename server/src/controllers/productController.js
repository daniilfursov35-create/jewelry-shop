// server/src/controllers/productController.js
import db from '../config/db.js';

export const getProducts = (req, res) => {
    // 1. Зчитуємо page та limit із запиту (якщо їх нема, беремо сторінку 1 і ліміт 4)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    
    // 2. Рахуємо зсув (offset) за формулою: (сторінка - 1) * ліміт
    // Для сторінки 1: (1 - 1) * 4 = 0 (пропустити 0, взяти перші 4)
    // Для сторінки 2: (2 - 1) * 4 = 4 (пропустити перші 4, взяти наступні 4)
    const offset = (page - 1) * limit;

    // 3. Робимо запит до бази SQLite з параметрами
    const query = "SELECT * FROM products LIMIT ? OFFSET ?";

    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            console.error('Помилка при отриманні товарів:', err.message);
            return res.status(500).json({ error: 'Помилка сервера при завантаженні товарів' });
        }
        
        // 4. Відправляємо порцію товарів на фронтенд
        res.json(rows);
    });
};