// server.js  –  Express + DynamoDB (CommonJS)

const path          = require('path');
const express       = require('express');
const session       = require('express-session');
const bodyParser    = require('body-parser');
const bcrypt        = require('bcrypt');
const axios         = require('axios');

const {
  createUser,
  findUserByUsername,
  getUserById
} = require('./db.js');                    // ← Dynamo helpers

const app  = express();
const PORT = process.env.PORT || 3000;
const WEATHERAPI_KEY = '3e02deef63a14dac964180134251004';

/* ---------- middleware ---------- */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'mySuperSecretKey',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static('public'));         // static assets (icons, css)

/* ---------- HTML pages (legacy) ---------- */
app.get('/',        (_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/login',   (_,res)=>res.sendFile(path.join(__dirname,'views','login.html')));
app.get('/register',(_,res)=>res.sendFile(path.join(__dirname,'views','register.html')));
app.get('/dashboard',(req,res)=>{
  if (!req.session?.userId) return res.redirect('/login');
  res.sendFile(path.join(__dirname,'public','dashboard.html'));
});

/* ---------- AUTH ---------- */
app.post('/register', async (req, res) => {
  const { username, password, hairColor, eyeColor, skinType } = req.body;
  try {
    if (await findUserByUsername(username))
      return res.status(400).send('Username already taken');

    const hash = await bcrypt.hash(password, 10);
    const id   = await createUser({ username, password: hash, hairColor, eyeColor, skinType });
    req.session.userId = id;                      // auto-login
    res.redirect('/dashboard');
  } catch (e) {
    console.error(e);
    res.status(500).send('Registration error');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await findUserByUsername(username);
    if (!user) return res.status(400).send('Invalid username or password');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)  return res.status(400).send('Invalid username or password');

    req.session.userId = user.userID;            // Dynamo PK is userID
    res.redirect('/dashboard');
  } catch (e) {
    console.error(e);
    res.status(500).send('Login error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

/* ---------- Current user ---------- */
app.get('/api/user', async (req, res) => {
  if (!req.session?.userId) return res.status(401).send('Not logged in');
  const user = await getUserById(req.session.userId);
  if (!user) return res.status(404).send('User not found');

  const { userID:id, username, hairColor, eyeColor, skinType } = user;
  res.json({ id, username, hairColor, eyeColor, skinType });
});

/* ---------- Weather info (FIXED) ---------- */
app.get('/api/weather-info', async (req, res) => {
  if (!req.session?.userId) return res.status(401).send('Not logged in');

  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).send('Missing lat/lon query parameters');

  try {
    // 1) fetch user from DynamoDB
    const user = await getUserById(req.session.userId);
    if (!user) return res.status(404).send('User not found');

    // 2) call WeatherAPI
    const w = await axios.get('https://api.weatherapi.com/v1/current.json', {
      params: { key: WEATHERAPI_KEY, q: `${lat},${lon}` }
    });
    const c = w.data.current;

    const cloud = c.cloud;                       // 0-100
    let icon    = 'partly';
    if (cloud < 25)      icon = 'sun';
    else if (cloud >=85) icon = 'cloud';

    res.json({
      username:       user.username,
      uvIndex:        c.uv,
      temperature:    c.temp_f,
      cloudCoverage:  cloud,
      cloudIconType:  icon,
      isDay:          c.is_day === 1
    });

  } catch (err) {
    console.error('Weather fetch error:', err.message);
    res.status(500).send('Error fetching weather data');
  }
});

/* ---------- Sunburn estimator ---------- */
app.post('/api/sunburn-time', (req, res) => {
  if (!req.session?.userId) return res.status(401).send('Not logged in');

  const { uvIndex, hairColor, eyeColor, skinType, cloudCoverage } = req.body;
  const sunburnTime = estimateSunburnTime(uvIndex, hairColor, eyeColor, skinType, cloudCoverage);
  res.json({ sunburnTime });
});

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

/* ---------- start server ---------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
