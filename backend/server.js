require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://keyrushers.web.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '200kb' }));
app.use(compression());
app.use(morgan('tiny'));

// Only our API routes; no legacy /auth
app.use('/api/scores', require('./routes/scores'));
app.use('/api/me', require('./routes/me'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
