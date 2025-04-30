import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) return navigate('/dashboard', { replace: true });
    setErr(await res.text());
  }

  const h = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container form-container">
      <h1>Login</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Username <input required value={form.username} onChange={h('username')} /></label>
        <label>Password <input type="password" required value={form.password} onChange={h('password')} /></label>
        <button className="btn">Login</button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
      </form>

      <p className="form-footer">No account? <Link to="/register">Register here</Link>.</p>
    </div>
  );
}
