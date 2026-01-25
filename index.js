require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./Configs/db');

const app = express();
const PORT = process.env.PORT || 7000;

// DB
connectDB().catch((e) => console.warn('DB connection skipped:', e?.message || e));

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: false }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'PrivoAI backend is up' });
});
app.use('/api/chat', require('./Routes/chat'));
app.use('/api/auth', require('./Routes/auth'));
app.use('/api/chats', require('./Routes/chats'));
app.use('/api/images', require('./Routes/images'));

// Error handler (must be last)
app.use(require('./Middlewares/errorHandler'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});