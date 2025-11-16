import express from "express";
import Parser from "rss-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ES modules fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// ===== RSS Parser =====
const parser = new Parser({
  requestOptions: {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  }
});

// ===== RSS Feeds =====
const feeds = {
  general: [
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.a.dj.com/rss/RSSWorldNews.xml"
  ],
  sports: [
    "https://www.espn.com/espn/rss/news"
  ],
  business: [
    "https://feeds.a.dj.com/rss/RSSMarketsMain.xml"
  ]
};

// ===== NEWS ROUTE =====
app.get("/api/news", async (req, res) => {
  const category = req.query.category || "general";
  const urls = feeds[category] || [];
  let articles = [];

  try {
    for (const url of urls) {
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        const imageUrl = item.enclosure?.url || item['media:content']?.url || '';
        articles.push({
          title: item.title || "No title",
          description: item.contentSnippet || item.content || "",
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
          link: item.link || "#",
          image: imageUrl
        });
      });
    }

    // Sort by date and take top 4
    articles.sort((a,b) => b.pubDate - a.pubDate);
    articles = articles.slice(0,4);

    res.json({ articles });
  } catch(err) {
    console.error("RSS ERROR:", err);
    res.status(500).json({ articles: [] });
  }
});

// ===== WEATHER ROUTE =====
app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "Ottawa";
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${WEATHER_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    if(data.cod !== 200) return res.status(400).json({ error: data.message });

    data.main.temp = Math.round(data.main.temp);
    res.json(data);
  } catch(err) {
    console.error("WEATHER ERROR:", err);
    res.status(500).json({ error: "Weather API error" });
  }
});

// ===== START SERVER =====
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
