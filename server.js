import express from 'express';
import Parser from 'rss-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 5000;
const parser = new Parser();
app.use(express.json());
app.use(express.static('public'));

// ===== WEATHER =====
app.get('/api/weather', async (req,res)=>{
  const city = req.query.city || 'Ottawa';
  try{
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();
    res.json(data);
  }catch(err){
    console.error(err);
    res.status(500).json({error:'Weather API error'});
  }
});

// ===== NEWS =====
const feeds = {
  general: ['https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml','https://www.cbc.ca/cmlink/rss-topstories'],
  sports: ['https://www.espn.com/espn/rss/news','https://www.sportsnet.ca/feed/'],
  business: ['https://www.cnbc.com/id/10001147/device/rss/rss.html','https://feeds.a.dj.com/rss/RSSMarketsMain.xml']
};

app.get('/api/news', async (req,res)=>{
  const category = req.query.category || 'general';
  try{
    const rssList = feeds[category] || [];
    let items = [];
    for(const url of rssList){
      const feed = await parser.parseURL(url);
      items = items.concat(feed.items);
    }
    // sort by date descending
    items.sort((a,b)=>new Date(b.pubDate) - new Date(a.pubDate));
    res.json({items});
  }catch(err){
    console.error(err);
    res.status(500).json({error:'News API error'});
  }
});

// ===== SOCIAL FEED =====
const socialFeeds = {
  tech: ['https://techcrunch.com/feed/','https://www.theverge.com/rss/index.xml'],
  sports: ['https://www.espn.com/espn/rss/news'],
  finance: ['https://www.cnbc.com/id/10001147/device/rss/rss.html'],
  entertainment: ['https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml']
};

app.get('/api/social', async (req,res)=>{
  const category = req.query.category || 'tech';
  try{
    const rssList = socialFeeds[category] || [];
    let items = [];
    for(const url of rssList){
      const feed = await parser.parseURL(url);
      items = items.concat(feed.items);
    }
    items.sort((a,b)=>new Date(b.pubDate) - new Date(a.pubDate));
    res.json({items});
  }catch(err){
    console.error(err);
    res.status(500).json({error:'Social feed error'});
  }
});

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
