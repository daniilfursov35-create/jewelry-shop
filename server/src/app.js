import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/products', productRoutes);

app.use('/api/orders', orderRoutes);

app.listen(PORT, () => {
    console.log(`Сервер запущено! Порт: ${PORT}`);
});