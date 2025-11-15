const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(__dirname));

// WEATHER
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'Ottawa';
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},CA&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url); // Node v18+ native fetch
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Weather API error' });
  }
});

// NEWS
app.get('/api/news', async (req, res) => {
  const country = req.query.country || 'ca';
  const category = req.query.category || 'general';
  const pageSize = req.query.pageSize || 5;
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${apiKey}`;

  try {
    const response = await fetch(url); // Node v18+ native fetch
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'News API error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
