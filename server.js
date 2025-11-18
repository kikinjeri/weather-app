import express from 'express';
import Parser from 'rss-parser';
import fetch from 'node-fetch';
import 'dotenv/config';

const app=express();
const PORT=process.env.PORT||5000;
const parser=new Parser();
app.use(express.json());
app.use(express.static('public'));

// ===== WEATHER =====
app.get('/api/weather', async (req,res)=>{
    const city=req.query.city||'Ottawa';
    const API_KEY=process.env.OPENWEATHER_API_KEY;
    try{
        const r=await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
        const data=await r.json();
        if(!data?.main) return res.json({error:'Weather unavailable'});
        res.json({
            name:data.name,
            temp:Math.round(data.main.temp),
            description:data.weather[0].description,
            humidity:data.main.humidity
        });
    }catch(e){ res.status(500).json({error:'Weather API error'}); }
});

// ===== CRYPTO =====
app.get('/api/crypto', async (req,res)=>{
    try{
        const r=await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,ripple,litecoin,cardano,polkadot,solana,dogecoin,chainlink,uniswap');
        const coins=await r.json();
        const formatted=coins.map(coin=>({
            name: coin.name,
            price:`$${coin.current_price.toLocaleString()}`,
            change: coin.price_change_percentage_24h.toFixed(2),
            marketCap:`$${coin.market_cap.toLocaleString()}`
        }));
        res.json(formatted);
    }catch(e){ res.status(500).json({error:'Crypto API error'}); }
});

// ===== NEWS RSS FEEDS =====
const feeds={
    general:["https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"],
    business:["https://rss.nytimes.com/services/xml/rss/nyt/Business.xml"],
    tech:["https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml"],
    sports:["https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml"]
};
app.get('/api/news', async (req,res)=>{
    const cat=req.query.category||'general';
    let items=[];
    try{
        for(const url of feeds[cat]||[]){
            const feed=await parser.parseURL(url);
            items=items.concat(feed.items);
        }
        items.sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate));
        res.json({items:items.slice(0,10)});
    }catch(e){ res.status(500).json({error:'News error'}); }
});

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
