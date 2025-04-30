import { useState } from 'react';

export default function SunburnBox({ user, weather }) {
  const [result,setResult]   = useState('');
  const [loading,setLoading] = useState(false);

  async function calc() {
    if(weather.uvIndex === 0 || !weather.isDay){
      return setResult("You can't get burned right now — it's night-time or UV is zero!");
    }
    setLoading(true);
    const res = await fetch('/api/sunburn-time',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        uvIndex: weather.uvIndex,
        cloudCoverage: weather.cloudCoverage,
        hairColor: user.hairColor,
        eyeColor: user.eyeColor,
        skinType: user.skinType
      })
    });
    const { sunburnTime } = await res.json();
    const h = Math.floor(sunburnTime/60);
    const m = sunburnTime%60;
    setResult(h?`${h}h ${m}m`:`${m}m`);
    setLoading(false);
  }

  return (
    <section className="info-box">
      <button className="btn" disabled={loading} onClick={calc}>
        {loading ? 'Calculating…' : 'Check Sunburn Time'}
      </button>
      {result && <p>Approx Sunburn Time: {result}</p>}
    </section>
  );
}
