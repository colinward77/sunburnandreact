import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero-section">
      <div className="hero-overlay">
        <h1>Sunburn Estimator</h1>
        <p className="hero-subtitle">
          Real-time UV &amp; weather-aware burn-time calculator
        </p>
        <div className="home-buttons">
          <Link className="btn" to="/register">Register</Link>
          <Link className="btn btn-outline" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
