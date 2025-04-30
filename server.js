// server.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const axios = require('axios');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const WEATHERAPI_KEY = '3e02deef63a14dac964180134251004';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: 'mySuperSecretKey',
    resave: false,
    saveUninitialized: false
  })
);

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// ------------------ ROUTES ------------------ //

// Home
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Login page
app.get('/login', (req, res) => {
  if (req.session?.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(__dirname + '/views/login.html');
});

// Register page
app.get('/register', (req, res) => {
  if (req.session?.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile(__dirname + '/views/register.html');
});

// POST Register
app.post('/register', async (req, res) => {
  const { username, password, hairColor, eyeColor, skinType } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, password, hairColor, eyeColor, skinType)
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashedPassword, hairColor, eyeColor, skinType],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(400).send('Username already taken or an error occurred');
        }
        req.session.userId = this.lastID; // Auto-login after registration
        res.redirect('/dashboard');
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during registration');
  }
});

// POST Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error during login');
    }
    if (!user) {
      return res.status(400).send('Invalid username or password');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).send('Invalid username or password');
    }
    req.session.userId = user.id;
    res.redirect('/dashboard');
  });
});

// GET Dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session?.userId) {
    return res.redirect('/login');
  }
  res.sendFile(__dirname + '/public/dashboard.html');
});

// GET Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// GET Current user data
app.get('/api/user', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).send('Not logged in');
  }
  db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], (err, row) => {
    if (err) {
      return res.status(500).send('Server error fetching user data');
    }
    if (!row) {
      return res.status(404).send('User not found');
    }
    const { id, username, hairColor, eyeColor, skinType } = row;
    res.json({ id, username, hairColor, eyeColor, skinType });
  });
});

/**
 * GET /api/weather-info
 * Expects ?lat=xx&lon=yy as query params from the client
 * Returns { username, uvIndex, temperature, cloudCoverage, cloudIconType, isDay }
 */
app.get('/api/weather-info', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).send('Not logged in');
  }

  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).send('Missing lat/lon query parameters');
  }

  // 1) Fetch the user from DB for display of username
  db.get(`SELECT * FROM users WHERE id = ?`, [req.session.userId], async (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error fetching user data');
    }
    if (!user) {
      return res.status(404).send('User not found');
    }

    try {
      // 2) Call WeatherAPI to get the current weather for lat/lon
      const weatherResponse = await axios.get('https://api.weatherapi.com/v1/current.json', {
        params: {
          key: WEATHERAPI_KEY,
          q: `${lat},${lon}`
        }
      });

      const current = weatherResponse.data.current;
      const uvIndex = current.uv;
      const temperature = current.temp_f; // Fahrenheit
      const cloudCoverage = current.cloud; // integer (0-100)
      const isDay = (current.is_day === 1);

      // Decide which icon to show for clouds
      let cloudIconType = 'partly';
      if (cloudCoverage < 25) {
        cloudIconType = 'sun';
      } else if (cloudCoverage >= 85) {
        cloudIconType = 'cloud';
      }

      // Return user name + weather
      res.json({
        username: user.username,
        uvIndex,
        temperature,
        cloudCoverage,
        cloudIconType,
        isDay
      });
    } catch (error) {
      console.error('Error calling WeatherAPI:', error.message);
      res.status(500).send('Error fetching weather data');
    }
  });
});

/**
 * POST /api/sunburn-time
 * Body: { uvIndex, hairColor, eyeColor, skinType, cloudCoverage }
 * Returns: { sunburnTime } => in raw minutes
 */
app.post('/api/sunburn-time', (req, res) => {
  if (!req.session?.userId) {
    return res.status(401).send('Not logged in');
  }
  const { uvIndex, hairColor, eyeColor, skinType, cloudCoverage } = req.body;

  // Calculate & respond
  const sunburnTime = estimateSunburnTime(uvIndex, hairColor, eyeColor, skinType, cloudCoverage);
  res.json({ sunburnTime });
});

/**
 * A more nuanced function that uses Fitzpatrick scale, cloud coverage, etc.
 * Returns time in minutes
 */
function estimateSunburnTime(uvIndex, hairColor, eyeColor, skinType, cloudCoverage) {
  // Base time
  let baseTime = 15;

  // Hair color
  switch ((hairColor || '').toLowerCase()) {
    case 'blonde':
    case 'red':
      baseTime *= 0.9;
      break;
    case 'brown':
      baseTime *= 1.0;
      break;
    case 'black':
      baseTime *= 1.1;
      break;
  }

  // Eye color
  switch ((eyeColor || '').toLowerCase()) {
    case 'blue':
      baseTime *= 0.9;
      break;
    case 'green':
      baseTime *= 1.0;
      break;
    case 'brown':
      baseTime *= 1.1;
      break;
  }

  // Fitzpatrick I–VI
  switch ((skinType || '').toUpperCase()) {
    case 'I':
      baseTime *= 0.7;
      break;
    case 'II':
      baseTime *= 0.8;
      break;
    case 'III':
      baseTime *= 0.9;
      break;
    case 'IV':
      baseTime *= 1.0;
      break;
    case 'V':
      baseTime *= 1.1;
      break;
    case 'VI':
      baseTime *= 1.2;
      break;
    default:
      baseTime *= 0.9; // assume III
      break;
  }

  // Factor in UV index (inverse proportion, capped at 0.2)
  const uvFactor = Math.max(0.2, 12 / (uvIndex || 1));
  baseTime *= uvFactor;

  // Adjust for cloud coverage (0% => factor=1; 100% => factor=1.5)
  const cloudFactor = 1 + (cloudCoverage / 100) * 0.5;
  baseTime *= cloudFactor;

  return Math.round(baseTime);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
