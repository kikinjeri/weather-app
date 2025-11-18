import express from 'express';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 5000;
const parser = new Parser();

app.use(express.json());
app.use(express.static('public'));

// ===== WEATHER =====
app.get('/api/weather', async (req,res)=>{
    const city = req.query.city || 'Ottawa';
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    try {
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const data = await r.json();
        if(!data?.main) return res.json({error:'Weather unavailable'});
        res.json({
            name: data.name,
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            humidity: data.main.humidity
        });
    } catch(e){ 
        console.error('Weather API error', e);
        res.status(500).json({error:'Weather API error'}); 
    }
});

// ===== CRYPTO =====
app.get('/api/crypto', async (req,res)=>{
    try{
        const r = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1');
        const coins = await r.json();
        const formatted = coins.map(coin=>({
            name: coin.name,
            price: `$${coin.current_price.toLocaleString()}`,
            change: coin.price_change_percentage_24h?.toFixed(2) || 0,
            marketCap: `$${coin.market_cap.toLocaleString()}`
        }));
        res.json(formatted);
    }catch(e){ 
        console.error('Crypto API error', e);
        res.status(500).json({error:'Crypto API error'}); 
    }
});

// ===== NEWS RSS =====
const feeds = {
    general: ["https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"],
    business: ["https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"],
    tech: ["https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"],
    sports: ["https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml"]
};

app.get('/api/news', async (req,res)=>{
    const cat = req.query.category || 'general';
    let items = [];
    try{
        const feedUrls = feeds[cat] || [];
        for(const url of feedUrls){
            try{
                const feed = await parser.parseURL(url);
                items = items.concat(feed.items);
            }catch(e){
                console.error(`Failed to load feed ${url}:`, e);
            }
        }
        if(items.length===0){
            items.push({title:`${cat} feed unavailable`, pubDate:Date.now(), contentSnippet:''});
        }
        items.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
        res.json({items: items.slice(0,10)});
    }catch(e){
        console.error('News API error', e);
        res.status(500).json({error:'News error'});
    }
});

// ===== SOCIAL FEED =====
app.get('/api/social', async (req,res)=>{
    const socialFeeds = [
        'https://www.variety.com/feed/',
        'https://www.hollywoodreporter.com/t/feed/film/'
    ];
    let items=[];
    try{
        const results = await Promise.allSettled(socialFeeds.map(url=>parser.parseURL(url)));
        results.forEach(r=>{
            if(r.status==='fulfilled'){
                const feed=r.value;
                items = items.concat(feed.items.map(i=>({
                    title:i.title,
                    contentSnippet:i.contentSnippet||i.content||'',
                    pubDate:i.pubDate||Date.now(),
                    handle: feed.title||'Source'
                })));
            }
        });
        if(items.length===0){
            items.push({title:'No social feed available', contentSnippet:'', pubDate:Date.now(), handle:'Source'});
        }
        items.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
        res.json({items: items.slice(0,20)});
    }catch(e){ 
        console.error('Social feed error', e);
        res.status(500).json({error:'Social feed error'}); 
    }
});

// ===== STOCKS / MARKET =====
app.get('/api/stocks', async (req,res)=>{
    const symbols = ['^GSPTSE','AAPL','TSLA','MSFT'];
    const API_KEY = process.env.FINNHUB_API_KEY;
    try{
        const results = await Promise.all(symbols.map(sym=> 
            fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${API_KEY}`).then(r=>r.json())
        ));
        const data = results.map((item,i)=>({
            symbol: symbols[i],
            price: item.c ? `$${item.c.toFixed(2)}` : 'N/A',
            change: item.dp != null ? item.dp.toFixed(2) : '0'
        }));
        res.json(data);
    }catch(e){ 
        console.error('Stock data error', e);
        res.status(500).json({error:'Stock data unavailable'}); 
    }
});

// ===== START SERVER =====
app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
