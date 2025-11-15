require('dotenv').config();
const express = require('express');
const OpenAI = require('openai');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 5000;

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static(__dirname));

// WEATHER API
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'Ottawa';
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},CA&units=metric&appid=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Weather API error' });
  }
});

// NEWS API
app.get('/api/news', async (req, res) => {
  const country = req.query.country || 'ca';
  const category = req.query.category || 'general';
  const pageSize = req.query.pageSize || 5;
  const apiKey = process.env.NEWS_API_KEY;
  const url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'News API error' });
  }
});

// AI Recommendations
app.get('/api/recommend', async (req, res) => {
  const category = req.query.category || 'general';
  try {
    const prompt = `Provide 3 trending ${category} news headlines with URLs from Canada or US. Format as JSON array [{title, url}].`;
    const response = await openai.chat.completions.create({
      model: 'gpt-4-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    let articles = [];
    try {
      articles = JSON.parse(response.choices[0].message.content);
    } catch (e) {
      articles = [];
    }
    res.json({ articles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Recommendation error' });
  }
});

// AI Summarization
app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-mini",
      messages: [
        { role: "system", content: "Summarize this text in 2-3 concise sentences for a news dashboard." },
        { role: "user", content: text }
      ]
    });
    res.json({ summary: response.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Summarization error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
