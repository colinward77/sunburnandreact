export default function WeatherBox({ data }) {
    const iconSrc = data.cloudIconType === 'sun'
      ? '/icons/sun.png'
      : data.cloudIconType === 'cloud'
      ? '/icons/cloud.png'
      : '/icons/partly.png';
  
    return (
      <section className="info-box">
        <h2>Hello, {data.username}</h2>
        <p>Temperature: {data.temperature} °F</p>
        <img src={iconSrc} className="weather-icon" alt="" />
        <p>UV Index: {data.uvIndex}</p>
      </section>
    );
  }
  