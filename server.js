import express from 'express';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static('public'));

// ===== WEATHER =====
app.get('/api/weather', async (req, res) => {
    const city = req.query.city || 'Ottawa';
    const key = process.env.OPENWEATHER_API_KEY;
    try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${key}`);
        const d = await r.json();
        if (!d.main) return res.json({ error: 'Weather unavailable' });
        res.json({
            name: d.name,
            temp: Math.round(d.main.temp),
            description: d.weather[0].description,
            humidity: d.main.humidity
        });
    } catch (e) { res.json({ error: 'Weather API error' }); }
});

// ===== TSX via Alpha Vantage =====
app.get('/api/tsx', async (req, res) => {
    try {
        const key = process.env.ALPHA_VANTAGE_KEY;
        // Alpha Vantage uses symbol ^GSPTSE (TSX Composite)
        const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=^GSPTSE&apikey=${key}`);
        const d = await r.json();
        const q = d['Global Quote'];
        if (!q) return res.json({ index: 'TSX', price: 0, change: 0, percent: 0 });
        res.json({
            index: 'TSX',
            price: parseFloat(q['05. price']),
            change: parseFloat(q['09. change']),
            percent: parseFloat(q['10. change percent'])
        });
    } catch (e) { 
        console.error(e);
        res.json({ index:'TSX', price:0, change:0, percent:0 }); 
    }
});

// ===== NEWS RSS =====
const feeds = {
    general: [
        "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        "https://www.cbc.ca/cmlink/rss-topstories"
    ],
    business: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
        "https://www.cbc.ca/cmlink/rss-business"
    ],
    tech: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
        "https://www.cbc.ca/cmlink/rss-technology"
    ],
    sports: [
        "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml",
        "https://www.cbc.ca/cmlink/rss-sports"
    ]
};

app.get('/api/news', async (req,res)=>{
    const cat = req.query.category || 'general';
    let items = [];
    try{
        for(const url of feeds[cat] || []){
            const feed = await parser.parseURL(url);
            items = items.concat(feed.items);
        }
        items.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
        res.json({ items });
    } catch { res.json({ items: [] }); }
});

// ===== SOCIAL =====
app.get('/api/social', async (req,res)=>{
    const posts = [
        { handle:'@TechCrunch', text:'Big startup news today!', time:new Date() },
        { handle:'@Verge', text:'New gadget review!', time:new Date() },
        { handle:'@Engadget', text:'Top tech deals this week.', time:new Date() },
        { handle:'@CNN', text:'Breaking news update!', time:new Date() },
        { handle:'@BBC', text:'World politics highlights.', time:new Date() }
    ];
    res.json({ items: posts });
});

// ===== START SERVER =====
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
