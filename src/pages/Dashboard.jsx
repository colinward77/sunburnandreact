import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate         = useNavigate();
  const [user,    setUser]    = useState(null);
  const [weather, setWeather] = useState(null);
  const [err,     setErr]     = useState('');

  /* 1 ▸ fetch user (protect route) */
  useEffect(() => {
    fetch('/api/user')
      .then(r => r.ok ? r.json() : null)
      .then(u => {
        if (!u) navigate('/login', { replace: true });
        else    setUser(u);
      });
  }, []);

  /* 2 ▸ geolocation → weather */
  useEffect(() => {
    if (!user) return;
    if (!navigator.geolocation) {
      setErr('Geolocation is not supported.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const res = await fetch(`/api/weather-info?lat=${coords.latitude}&lon=${coords.longitude}`);
        if (res.ok) setWeather(await res.json());
        else setErr('Failed to load weather.');
      },
      () => setErr('Geolocation permission denied.')
    );
  }, [user]);

  if (err)          return <p className="container">{err}</p>;
  if (!user)        return null;
  if (!weather)     return <p className="container">Loading weather…</p>;

  /* simple display; replace with your WeatherBox / components */
  return (
    <div className="container">
      <h2>Hello, {user.username}</h2>
      <p>Temperature: {weather.temperature} °F</p>
      <p>UV Index: {weather.uvIndex}</p>
      <p>
        <img src={`/icons/${weather.cloudIconType}.png`} alt="" className="weather-icon"/>
        Cloud cover: {weather.cloudCoverage}%
      </p>
    </div>
  );
}
