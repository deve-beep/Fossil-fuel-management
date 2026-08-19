const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const productionRoutes = require('./routes/productionRoutes');
const reserveRoutes = require('./routes/reserveRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const fsaRoutes = require('./routes/fsaRoutes');
const crisisRoutes = require('./routes/crisisRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'FFRSCM API', status: 'operational', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/reserves', reserveRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/fsa', fsaRoutes);
app.use('/api/crisis', crisisRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
