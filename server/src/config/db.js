import sqlite3 from 'sqlite3';

// 1. Створюємо (або відкриваємо) файл бази даних у корені проєкту
const db = new sqlite3.Database('./shop.db', (err) => {
    if (err) {
        console.error('Помилка підключення до бази даних:', err.message);
    } else {
        console.log('Успішно підключено до бази даних SQLite!');
    }
});

// 2. Ініціалізація всіх таблиць та початкових даних суворо по черзі
db.serialize(() => {
    // Вмикаємо підтримку зовнішніх ключів (Foreign Keys) у SQLite
    db.run('PRAGMA foreign_keys = ON');

    // Таблиця товарів
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price REAL NOT NULL,
            image_url TEXT NOT NULL,
            category TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Помилка створення таблиці products:', err.message);
            return;
        }
        console.log('Таблиця products успішно створена або перевірена');

        // 3. Перевіряємо, чи є товари в базі (Seeding)
        db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (err) {
                console.error('Помилка перевірки кількості товарів:', err.message);
                return;
            }

            if (row && row.count === 0) {
                const stmt = db.prepare("INSERT INTO products (title, price, image_url, category) VALUES (?, ?, ?, ?)");
                
                stmt.run('Necklace', 4500.00, './img/gallery-1.jpg', 'necklaces');
                stmt.run('Earrings 1', 2800.00, './img/gallery-2.jpg', 'earrings');
                stmt.run('Bracelet', 7200.00, './img/gallery-3.jpg', 'bracelets');
                stmt.run('Earrings 2', 3400.00, './img/gallery-4.jpg', 'earrings');
                
                stmt.finalize();
                console.log('Додано початкові тестові товари!');
            }
        });
    });

    // Таблиця замовлень із полями для SMS-верифікації
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_email TEXT,
            delivery_details TEXT NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Помилка створення таблиці orders:', err.message);
    });

    // Проміжна таблиця Many-to-Many для зв'язку замовлень і товарів
    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `, (err) => {
        if (err) console.error('Помилка створення таблиці order_items:', err.message);
    });
});

// 4. Експортуємо готовий об'єкт бази для використання в контролерах/роутах
export default db;