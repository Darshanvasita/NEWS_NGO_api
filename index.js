const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: './config.env' });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require('./src/routes/auth.routes');

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
