import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) return nav('/dashboard');
    setErr(await res.text());
  }

  return (
    <div className="container form-container">
      <h1>Login</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Username
          <input required value={form.username}
            onChange={e=>setForm({...form,username:e.target.value})}/>
        </label>
        <label>Password
          <input type="password" required value={form.password}
            onChange={e=>setForm({...form,password:e.target.value})}/>
        </label>
        <button className="btn">Login</button>
        {err && <p style={{color:'red'}}>{err}</p>}
      </form>
      <p className="form-footer">
        No account? <Link to="/register">Register here</Link>.
      </p>
    </div>
  );
}
