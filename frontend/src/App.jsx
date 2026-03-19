import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import Skeleton from './Skeleton'

const API = import.meta.env.VITE_API_URL
const COLORS = ['#6366f1', '#06b6d4', '#10b981']

export default function App() {
  const [dark, setDark] = useState(false)
  const [token, setToken] = useState(localStorage.getItem('tf_token') || '')
  const [loginInput, setLoginInput] = useState({ user: '', pass: '' })
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [users, setUsers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('2024-01')
  const [dateTo, setDateTo] = useState('2026-03')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const authed = !!token

  const d = dark
  const bg = d ? '#0f1117' : '#f5f6fa'
  const card = d ? '#1a1d2e' : '#ffffff'
  const text = d ? '#ffffff' : '#1a1d2e'
  const muted = d ? '#8b92a5' : '#6b7280'
  const border = d ? '#2a2d3e' : '#e5e7eb'
  const input = d ? '#0f1117' : '#f9fafb'

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/stats`, { headers }).then(r => r.json()),
      fetch(`${API}/api/revenue`, { headers }).then(r => r.json()),
      fetch(`${API}/api/users`, { headers }).then(r => r.json()),
      fetch(`${API}/api/orders`, { headers }).then(r => r.json()),
    ]).then(([s, r, u, o]) => {
      if (s.error || r.error || u.error || o.error) {
        setToken('')
        localStorage.removeItem('tf_token')
        return
      }
      setStats(s)
      setRevenue(Array.isArray(r) ? r : [])
      setUsers(Array.isArray(u) ? u : [])
      setOrders(Array.isArray(o) ? o : [])
      setLoading(false)
    }).catch(() => {
      setToken('')
      localStorage.removeItem('tf_token')
    })
  }, [authed])
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginInput.user, password: loginInput.pass })
      })
      const data = await res.json()
      if (data.token) {
        localStorage.setItem('tf_token', data.token)
        setToken(data.token)
        setLoginError('')
      } else {
        setLoginError(data.error || 'Invalid credentials')
      }
    } catch {
      setLoginError('Server error — try again')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('tf_token')
    setToken('')
    setStats(null)
    setRevenue([])
    setUsers([])
    setOrders([])
  }

  const filteredRevenue = revenue.filter(r =>
    r.month >= dateFrom && r.month <= dateTo
  )
  const filteredUsers = users.filter(u =>
    u.month >= dateFrom && u.month <= dateTo
  )
  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    const matchSearch = o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchStatus && matchSearch
  })

  const planData = [
    { name: 'Enterprise', value: orders.filter(o => o.plan === 'Enterprise').length },
    { name: 'Pro', value: orders.filter(o => o.plan === 'Pro').length },
    { name: 'Starter', value: orders.filter(o => o.plan === 'Starter').length },
  ]

  const exportCSV = () => {
    const headers = ['Customer', 'Plan', 'Amount', 'Status', 'Date']
    const rows = filteredOrders.map(o => [
      o.customer_name, o.plan, o.amount, o.status,
      new Date(o.created_at).toLocaleDateString()
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orders.csv'
    a.click()
  }

  const statusColor = (s) => {
    if (s === 'completed') return { bg: '#064e3b', text: '#6ee7b7' }
    if (s === 'pending') return { bg: '#451a03', text: '#fcd34d' }
    return { bg: '#4c0519', text: '#fca5a5' }
  }

  const statCards = [
    { label: 'Total Revenue', value: stats ? `$${Number(stats.totalRevenue).toLocaleString()}` : null, color: '#6366f1' },
    { label: 'Total Users', value: stats ? Number(stats.totalUsers).toLocaleString() : null, color: '#06b6d4' },
    { label: 'Total Orders', value: stats ? stats.totalOrders : null, color: '#f59e0b' },
    { label: 'Growth', value: stats ? `${stats.growth}%` : null, color: '#10b981' },
  ]

  if (!authed) return (
    <div style={{
      minHeight: '100vh', background: bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: card, border: `1px solid ${border}`, borderRadius: 16,
        padding: 40, width: '100%', maxWidth: 400
      }}>
        <h1 style={{ color: text, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>TechFlow</h1>
        <p style={{ color: muted, fontSize: 14, marginBottom: 32 }}>Sign in to your dashboard</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: muted, fontSize: 13, marginBottom: 6 }}>Username</label>
          <input
            type="text"
            placeholder="admin"
            value={loginInput.user}
            onChange={e => setLoginInput({ ...loginInput, user: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
              background: input, border: `1px solid ${border}`, color: text,
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: muted, fontSize: 13, marginBottom: 6 }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={loginInput.pass}
            onChange={e => setLoginInput({ ...loginInput, pass: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
              background: input, border: `1px solid ${border}`, color: text,
              outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>

        {loginError && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 16 }}>{loginError}</p>
        )}

        <button onClick={handleLogin} style={{
          width: '100%', padding: '12px', borderRadius: 8, fontSize: 15,
          fontWeight: 600, background: '#6366f1', color: '#fff',
          border: 'none', cursor: 'pointer'
        }}>
          Sign in
        </button>

       
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'Inter, sans-serif', transition: 'all 0.3s' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>TechFlow Dashboard</h1>
            <p style={{ margin: '4px 0 0', color: muted, fontSize: 14 }}>SaaS Analytics Overview</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setDark(!dark)} style={{
              background: card, border: `1px solid ${border}`, color: text,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13
            }}>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
            <button onClick={handleLogout} style={{
              background: '#4c0519', border: 'none', color: '#fca5a5',
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13
            }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} style={{
              background: card, borderRadius: 12, padding: 24,
              border: `1px solid ${border}`, borderLeft: `4px solid ${s.color}`
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, color: muted }}>{s.label}</p>
              {loading ? <Skeleton height={32} /> :
                <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
              }
            </div>
          ))}
        </div>

        {/* Date filter */}
        <div style={{
          background: card, borderRadius: 12, padding: 16,
          border: `1px solid ${border}`, marginBottom: 24,
          display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap'
        }}>
          <span style={{ color: muted, fontSize: 13 }}>Date range:</span>
          <input type="month" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ background: input, border: `1px solid ${border}`, color: text, padding: '6px 10px', borderRadius: 6, fontSize: 13 }} />
          <span style={{ color: muted }}>→</span>
          <input type="month" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ background: input, border: `1px solid ${border}`, color: text, padding: '6px 10px', borderRadius: 6, fontSize: 13 }} />
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{ background: card, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Monthly Revenue</h2>
            {loading ? <Skeleton height={250} /> :
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={filteredRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: muted }} />
                  <YAxis tick={{ fontSize: 10, fill: muted }} />
                  <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
                  <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            }
          </div>

          <div style={{ background: card, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>New Users per Month</h2>
            {loading ? <Skeleton height={250} /> :
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke={border} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: muted }} />
                  <YAxis tick={{ fontSize: 10, fill: muted }} />
                  <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
                  <Bar dataKey="new_users" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </div>

          <div style={{ background: card, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 600 }}>Plan Distribution</h2>
            {loading ? <Skeleton height={250} /> :
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {planData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
                </PieChart>
              </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Orders table */}
        <div style={{ background: card, borderRadius: 12, padding: 24, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Recent Orders</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                placeholder="Search customer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: input, border: `1px solid ${border}`, color: text, padding: '6px 12px', borderRadius: 6, fontSize: 13 }}
              />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ background: input, border: `1px solid ${border}`, color: text, padding: '6px 12px', borderRadius: 6, fontSize: 13 }}>
                <option value="all">All status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button onClick={exportCSV} style={{
                background: '#6366f1', color: '#fff', border: 'none',
                padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13
              }}>
                Export CSV
              </button>
            </div>
          </div>

          {loading ? <Skeleton height={200} /> :
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {['Customer', 'Plan', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 13, color: muted, fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(o => {
                    const sc = statusColor(o.status)
                    return (
                      <tr key={o.id} style={{ borderBottom: `1px solid ${border}` }}>
                        <td style={{ padding: '12px', fontSize: 14 }}>{o.customer_name}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: d ? '#1e3a5f' : '#dbeafe', color: d ? '#93c5fd' : '#1d4ed8',
                            padding: '2px 10px', borderRadius: 20, fontSize: 12
                          }}>{o.plan}</span>
                        </td>
                        <td style={{ padding: '12px', fontSize: 14 }}>${o.amount}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: 13, color: muted }}>
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  )
}