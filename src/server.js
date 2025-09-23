const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const newsRoutes = require('./routes/news.routes');
const ngoRoutes = require('./routes/ngo.routes');

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ngo', ngoRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
