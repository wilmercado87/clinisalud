import express from 'express';
import cors from 'cors';
import authRoutes from './routes/AuthRoutes';
import userRoutes from './routes/UserRoutes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

app.get('/', (req, res) => {
  res.send('Clinisalud API Running with SQLite');
});

export default app;