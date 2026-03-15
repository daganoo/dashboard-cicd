const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.get('/api/stats', async (req, res) => {
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

app.get('/api/revenue', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT month, amount FROM revenue ORDER BY month'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT month, new_users FROM users ORDER BY month'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 10'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});