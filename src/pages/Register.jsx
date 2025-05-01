import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', password: '',
    hairColor: 'blonde', eyeColor: 'blue', skinType: 'I'
  });
  const [err, setErr] = useState('');

  async function handleSubmit(e) { 
    e.preventDefault();
    setErr('');
    const res = await fetch('/register', { //pass to server
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
      <h1>Register</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Username <input required value={form.username} onChange={h('username')}/></label>
        <label>Password <input type="password" required value={form.password} onChange={h('password')}/></label>

        <label>Hair Color
          <select value={form.hairColor} onChange={h('hairColor')}>
            <option>blonde</option><option>brown</option><option>black</option><option>red</option>
          </select>
        </label>

        <label>Eye Color
          <select value={form.eyeColor} onChange={h('eyeColor')}>
            <option>blue</option><option>green</option><option>brown</option>
          </select>
        </label>

        <label>Fitzpatrick Skin Type
          <select value={form.skinType} onChange={h('skinType')}>
            <option value="I">I — Very fair / pale white</option>
            <option value="II">II — Fair / white</option>
            <option value="III">III — Light olive / beige</option>
            <option value="IV">IV — Moderate brown</option>
            <option value="V">V — Dark brown</option>
            <option value="VI">VI — Deeply pigmented dark brown / black</option>
          </select>
        </label>

        <button className="btn">Register</button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
      </form>

      <p className="form-footer">Already registered? <Link to="/login">Login</Link>.</p>
    </div>
  );
}
