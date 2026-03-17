const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'techflow_secret_2026';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1', [username]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid credentials' });

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats', auth, async (req, res) => {
  try {
    const revenue = await pool.query('SELECT SUM(amount) as total FROM revenue');
    const users = await pool.query('SELECT SUM(new_users) as total FROM users');
    const orders = await pool.query('SELECT COUNT(*) as total FROM orders');
    const growth = await pool.query(`
      SELECT ROUND(
        ((MAX(amount) - MIN(amount)) / MIN(amount) * 100)::numeric, 1
      ) as growth FROM revenue
    `);
    res.json({
      totalRevenue: revenue.rows[0].total,
      totalUsers: users.rows[0].total,
      totalOrders: orders.rows[0].total,
      growth: growth.rows[0].growth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/revenue', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT month, amount FROM revenue ORDER BY month'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT month, new_users FROM users ORDER BY month'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 15'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

