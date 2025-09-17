const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
