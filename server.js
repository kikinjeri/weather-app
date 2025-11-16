// server.js
const express = require('express');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===== WEATHER (fallback) =====
app.get('/api/weather', (req,res)=>{
  const city = req.query.city || 'Ottawa';
  res.json({
    name: city,
    main: { temp: 20, humidity: 50 },
    weather: [{ description: 'Clear sky', icon: '01d' }]
  });
});

// ===== RSS FEEDS =====
const RSS_FEEDS = {
  general: [
    'https://www.cbc.ca/cmlink/rss-canada',
    'https://www.ctvnews.ca/rss/TopStories'
  ],
  entertainment: [
    'https://www.cbc.ca/cmlink/rss-arts-entertainment',
    'https://www.ctvnews.ca/rss/entertainment'
  ],
  sports: [
    'https://www.cbc.ca/cmlink/rss-sports',
    'https://www.ctvnews.ca/rss/sports'
  ]
};

// ===== HELPER: extract image from RSS content =====
function extractImage(item){
  if(item.enclosure?.url) return item.enclosure.url;
  if(item.content){
    const match = item.content.match(/<img.*?src="(.*?)"/);
    if(match) return match[1];
  }
  return 'https://via.placeholder.com/400x200?text=News';
}

// ===== NEWS via RSS =====
app.get('/api/news', async (req,res)=>{
  const category = req.query.category || 'general';
  const pageSize = Number(req.query.pageSize) || 5;
  const feeds = RSS_FEEDS[category] || RSS_FEEDS.general;

  try {
    let articles = [];

    for(const feedUrl of feeds){
      try {
        const feed = await parser.parseURL(feedUrl);
        feed.items.forEach(item=>{
          articles.push({
            title: item.title,
            description: item.contentSnippet || '',
            url: item.link,
            urlToImage: extractImage(item),
            publishedAt: item.isoDate || new Date().toISOString()
          });
        });
      } catch(feedErr){
        console.warn(`Failed to load feed ${feedUrl}: ${feedErr.message}`);
      }
    }

    if(!articles.length){
      articles = Array.from({length:pageSize}, (_,i)=>({
        title:`Fallback ${category} News ${i+1}`,
        description:`Fallback description for ${category} news ${i+1}.`,
        url:'#',
        urlToImage:'https://via.placeholder.com/400x200?text=News',
        publishedAt:new Date().toISOString()
      }));
    }

    articles.sort((a,b)=>new Date(b.publishedAt)-new Date(a.publishedAt));
    articles = articles.slice(0,pageSize);

    res.json({ articles });

  } catch(e){
    console.error(e);
    res.json({ articles: [] });
  }
});

// ===== AI SUMMARY (local simple) =====
app.post('/api/summarize', (req,res)=>{
  const text = req.body.text || '';
  const sentences = text.split(/(?<=\.|\?|!)/).map(s=>s.trim()).filter(Boolean);
  res.json({ summary: sentences.slice(0,2).join(' ') });
});

// ===== RECOMMENDATIONS (local sample) =====
app.get('/api/recommend', (req,res)=>{
  const category = req.query.category || 'general';
  const articles = [
    {title:`Recommended ${category} 1`,url:'#'},
    {title:`Recommended ${category} 2`,url:'#'},
    {title:`Recommended ${category} 3`,url:'#'}
  ];
  res.json({ articles });
});

// ===== SERVE FRONTEND =====
app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'index.html')));

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
