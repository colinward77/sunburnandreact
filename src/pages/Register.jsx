import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username:  '',
    password:  '',
    hairColor: 'blonde',
    eyeColor:  'blue',
    skinType:  'I'
  });
  const [err, setErr] = useState('');

  /* submit -------------------------------------------------------------- */
  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      /* success → go straight to dashboard */
      if (res.ok) {
        navigate('/dashboard', { replace: true });
        return;
      }

      /* failure → show server-returned message */
      setErr(await res.text());
    } catch (error) {
      setErr(error.message || 'Registration failed');
    }
  }

  /* -------------------------------------------------------------------- */
  return (
    <div className="container form-container">
      <h1>Register</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Username
          <input
            required
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </label>

        <label>Password
          <input
            type="password"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <label>Hair Color
          <select
            value={form.hairColor}
            onChange={e => setForm({ ...form, hairColor: e.target.value })}
          >
            <option>blonde</option>
            <option>brown</option>
            <option>black</option>
            <option>red</option>
          </select>
        </label>

        <label>Eye Color
          <select
            value={form.eyeColor}
            onChange={e => setForm({ ...form, eyeColor: e.target.value })}
          >
            <option>blue</option>
            <option>green</option>
            <option>brown</option>
          </select>
        </label>

        <label>Fitzpatrick Skin Type
          <select
            value={form.skinType}
            onChange={e => setForm({ ...form, skinType: e.target.value })}
          >
            <option>I</option><option>II</option><option>III</option>
            <option>IV</option><option>V</option><option>VI</option>
          </select>
        </label>

        <button className="btn">Register</button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
      </form>

      <p className="form-footer">
        Already registered? <Link to="/login">Login</Link>.
      </p>
    </div>
  );
}
