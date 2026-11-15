import express from 'express';
import cors from 'cors';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static('client/src'));

app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Маршрут не знайдено' });
});

export default app;