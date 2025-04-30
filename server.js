/* server.js — Node 18, Express, DynamoDB (db.js helpers) */
const path       = require('path');
const express    = require('express');
const session    = require('express-session');
const bodyParser = require('body-parser');
const bcrypt     = require('bcrypt');
const axios      = require('axios');

const {
  createUser,
  findUserByUsername,
  getUserById
} = require('./db.js');

const app  = express();
const PORT = process.env.PORT || 3000;
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'changeMe',
  resave: false,
  saveUninitialized: false
}));

/* serve React build */
const DIST = path.join(__dirname, 'dist');
app.use(express.static(DIST));

/* ---------------- AUTH ---------------- */
app.post('/register', async (req, res) => {
  const { username, password, hairColor, eyeColor, skinType } = req.body;
  try {
    if (await findUserByUsername(username))
      return res.status(400).send('Username already taken');

    const hash = await bcrypt.hash(password, 10);
    const id   = await createUser({ username, password: hash, hairColor, eyeColor, skinType });

    req.session.userId = id;
    res.send('ok');
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

    req.session.userId = user.userID;
    res.send('ok');
  } catch (e) {
    console.error(e);
    res.status(500).send('Login error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.send('bye');
});

/* ---------------- USER / WEATHER ---------------- */
app.get('/api/user', async (req, res) => {
  if (!req.session?.userId) return res.status(401).send('Not logged in');
  const user = await getUserById(req.session.userId);
  if (!user) return res.status(404).send('User not found');
  const { userID:id, username, hairColor, eyeColor, skinType } = user;
  res.json({ id, username, hairColor, eyeColor, skinType });
});

app.get('/api/weather-info', async (req, res) => {
  if (!req.session?.userId) return res.status(401).send('Not logged in');
  const { lat, lon } = req.query;
  if (!lat || !lon)  return res.status(400).send('Missing lat/lon');

  try {
    const user = await getUserById(req.session.userId);
    if (!user) return res.status(404).send('User not found');

    const w = await axios.get('https://api.weatherapi.com/v1/current.json', {
      params: { key: WEATHERAPI_KEY, q: `${lat},${lon}` }
    });
    const c = w.data.current;
    const cloud = c.cloud;
    const icon  = cloud < 25 ? 'sun' : cloud >= 85 ? 'cloud' : 'partly';

    res.json({
      username:       user.username,
      uvIndex:        c.uv,
      temperature:    c.temp_f,
      cloudCoverage:  cloud,
      cloudIconType:  icon,
      isDay:          c.is_day === 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Weather fetch error');
  }
});

/* ---------------- SUNBURN TIME ---------------- */
app.post('/api/sunburn-time', (req, res) => {
  if (!req.session?.userId) return res.status(401).send('Not logged in');
  const { uvIndex, hairColor, eyeColor, skinType, cloudCoverage } = req.body;

  let base = 15;
  if (['blonde','red'].includes(hairColor)) base *= 0.9;
  else if (hairColor === 'black') base *= 1.1;
  if (eyeColor === 'blue') base *= 0.9;
  else if (eyeColor === 'brown') base *= 1.1;
  base *= { I:0.7, II:0.8, III:0.9, IV:1, V:1.1, VI:1.2 }[skinType] ?? 0.9;
  base *= Math.max(0.2, 12 / (uvIndex || 1));
  base *= 1 + (cloudCoverage / 100) * 0.5;

  res.json({ sunburnTime: Math.round(base) });
});

/* SPA catch-all */
app.get('*', (_, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, () => console.log(`Express + React listening on :${PORT}`));
