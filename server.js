import express from 'express';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;
const parser = new Parser();

app.use(express.json());
app.use(express.static('public'));

// ===== RSS FEEDS =====
const feeds = {
    general: [
        "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        "https://www.cbc.ca/cmlink/rss-topstories"
    ],
    business: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
        "https://www.cbc.ca/cmlink/rss-business"
    ],
    sports: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
        "https://www.cbc.ca/cmlink/rss-sports"
    ],
    entertainment: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Movies.xml",
        "https://www.cbc.ca/cmlink/rss-entertainment"
    ],
    tech: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
        "https://www.cbc.ca/cmlink/rss-technology"
    ],
    politics: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml",
        "https://www.cbc.ca/cmlink/rss-canada-politics"
    ]
};

// ===== WEATHER =====
app.get('/api/weather', async (req, res) => {
    const city = req.query.city || 'Ottawa';
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await response.json();
        if (!data?.main) return res.json({ error: "Weather not available" });
        res.json({
            name: data.name,
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity
        });
    } catch (e) { res.status(500).json({ error: "Weather API error" }); }
});

// ===== TSX =====
app.get('/api/tsx', async (req, res) => {
    try {
        const r = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5EGSPTSE`);
        const data = await r.json();
        const q = data.quoteResponse.result[0];
        res.json({
            index: q.shortName,
            price: q.regularMarketPrice,
            change: q.regularMarketChange,
            percent: q.regularMarketChangePercent,
            marketCap: q.marketCap
        });
    } catch { res.status(500).json({ error: "TSX API error" }); }
});

// ===== NEWS =====
app.get('/api/news', async (req, res) => {
    const category = req.query.category || "general";
    let items = [];
    try {
        for (const url of feeds[category] || []) {
            const feed = await parser.parseURL(url);
            items = items.concat(feed.items);
        }
        items.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
        res.json({ items });
    } catch { res.status(500).json({ error: "News error" }); }
});

// ===== SOCIAL =====
app.get('/api/social', async (req,res)=>{
    const category = req.query.category || 'tech';
    let items = [];
    try {
        for(const url of feeds[category] || []){
            const feed = await parser.parseURL(url);
            items = items.concat(feed.items.map(i=>({
                title:i.title,
                contentSnippet:i.contentSnippet,
                pubDate:i.pubDate,
                link:i.link,
                image:'https://via.placeholder.com/50'
            })));
        }
        // Deduplicate by title
        const unique = [];
        const seen = new Set();
        items.forEach(i=>{ if(!seen.has(i.title)){ seen.add(i.title); unique.push(i); } });
        res.json({ items: unique.slice(0,5) });
    } catch { res.status(500).json({ error:'Social feed error'}); }
});

// ===== START SERVER =====
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
