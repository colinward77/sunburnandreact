import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WeatherBox   from '../components/WeatherBox.jsx';
import SunburnBox   from '../components/SunburnBox.jsx';
import ProfilePanel from '../components/ProfilePanel.jsx';

export default function Dashboard() {
  const nav  = useNavigate();
  const [user,setUser]       = useState(null);
  const [weather,setWeather] = useState(null);

  /* 1: get user */
  useEffect(()=>{
    fetch('/api/user')
      .then(r=>r.ok?r.json():null)
      .then(u=>{ if(!u) nav('/login'); else setUser(u); });
  },[]);

  /* 2: geolocation -> weather */
  useEffect(()=>{
    if(!user) return;
    navigator.geolocation.getCurrentPosition(async ({coords})=>{
      const res = await fetch(`/api/weather-info?lat=${coords.latitude}&lon=${coords.longitude}`);
      if(res.ok) setWeather(await res.json());
    });
  },[user]);

  if(!user)    return null;
  if(!weather) return <p className="container">Loading weather…</p>;

  return (
    <div className="container">
      <WeatherBox data={weather}/>
      <SunburnBox user={user} weather={weather}/>
      <ProfilePanel user={user}/>
    </div>
  );
}
