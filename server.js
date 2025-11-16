// server.js
require('dotenv').config();
const express = require('express');
const Parser = require('rss-parser');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const parser = new Parser({ timeout: 10000 });
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(__dirname));

// -------------------------------
// RSS sources (breaking & sections)
// -------------------------------
const BREAKING_FEEDS = [
  { url: 'https://www.cbc.ca/cmlink/rss-topstories', source: 'CBC' },
  { url: 'https://www Global News feed placeholder', source: 'Global' }, // replace if needed
  { url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', source: 'WSJ' }, // optional
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', source: 'NYTimes' }, // optional
  { url: 'https://feeds.apnews.com/apf-topnews', source: 'AP' },
  { url: 'https://www.reutersagency.com/feed/?best-topics=top-news', source: 'Reuters' } // sometimes needs correct RSS URL
];

// fallback feeds for news categories (these are examples — you can adjust)
const SECTION_FEEDS = {
  general: [
    'https://www.cbc.ca/cmlink/rss-topstories',
    'https://www.theglobeandmail.com/?outputType=xml'
  ],
  entertainment: [
    'https://www.tmz.com/rss.xml',
    'https://people.com/fragment/rss' // adjust if necessary
  ],
  sports: [
    'https://www.espn.com/espn/rss/news',
    'https://www.cbc.ca/cmlink/rss-sports'
  ]
};

// -------------------------------
// In-memory cache
// -------------------------------
const cache = {
  breaking: { timestamp: 0, data: [] }, // refreshed every 60s
  sections: {} // per category cached 15 min
};

// -------------------------------
// Local summarizer (extractive)
// -------------------------------

const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren't as at be because been before being below between both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves`.split(/\s+/)
);

function summarizeExtractive(text, sentenceCount = 2) {
  if (!text) return '';
  // split into sentences
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);

  if (sentences.length <= sentenceCount) return sentences.join(' ');

  // build term frequency
  const freq = {};
  const normalize = (w) => w.replace(/[^a-zA-Z0-9']/g, '').toLowerCase();
  for (const s of sentences) {
    const words = s.split(/\s+/).map(normalize).filter(Boolean);
    for (const w of words) {
      if (STOPWORDS.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  if (!Object.keys(freq).length) {
    // fallback: return first N sentences
    return sentences.slice(0, sentenceCount).join(' ');
  }

  // score sentences
  const scores = sentences.map(s => {
    const words = s.split(/\s+/).map(normalize).filter(Boolean);
    let score = 0;
    for (const w of words) {
      score += freq[w] || 0;
    }
    return { s, score };
  });

  // pick top sentences in original order
  const top = scores
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .map(t => t.s);

  // preserve original order
  const ordered = sentences.filter(s => top.includes(s)).slice(0, sentenceCount);
  return ordered.join(' ');
}

// -------------------------------
// RSS parsing & normalization
// -------------------------------
async function fetchFeeds(feedUrls) {
  const out = [];
  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      if (feed && feed.items) {
        for (const item of feed.items) {
          out.push({ ...item, source: feed.title || url });
        }
      }
    } catch (err) {
      console.error('Feed error', url, err.message || err);
    }
  }
  return out;
}

function normalizeItem(item) {
  const id = item.guid || item.id || item.link || (item.isoDate ? `${item.title}-${item.isoDate}` : item.title);
  const title = item.title || item.headline || 'No title';
  const link = item.link || item.enclosure?.url || '#';
  const isoDate = item.isoDate || item.pubDate || new Date().toISOString();
  const source = item.source || item.creator || item.author || 'RSS';
  const content = (item.contentSnippet || item.content || item.summary || '').toString();
  const image = item.enclosure?.url || item.thumbnail || item.image || null;
  return { id, title, link, isoDate, source, content, image };
}

// -------------------------------
// BREAKING endpoint (cached 60s)
// -------------------------------
app.get('/api/breaking', async (req, res) => {
  const now = Date.now();
  if (cache.breaking.timestamp && now - cache.breaking.timestamp < 60_000) {
    return res.json(cache.breaking.data);
  }

  // flatten list of feeds (use a curated small set)
  const feedUrls = [
    'https://www.cbc.ca/cmlink/rss-topstories',
    'https://feeds.apnews.com/apf-topnews',
    'https://www.reuters.com/tools/rss',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
  ];

  try {
    const raw = await fetchFeeds(feedUrls);
    const items = raw.map(normalizeItem)
      .filter(Boolean)
      .sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate))
      .slice(0, 40);

    // generate summaries
    const enriched = items.map(it => {
      const short = summarizeExtractive(it.content || it.title, 1);
      const long = summarizeExtractive(it.content || it.title, 3);
      return {
        id: it.id,
        title: it.title,
        link: it.link,
        isoDate: it.isoDate,
        source: it.source,
        summaryShort: short,
        summaryLong: long,
        image: it.image || null
      };
    });

    cache.breaking = { timestamp: now, data: enriched };
    res.json(enriched);
  } catch (err) {
    console.error('breaking error', err);
    // fallback to cache if exists else empty list
    if (cache.breaking.data && cache.breaking.data.length) {
      return res.json(cache.breaking.data);
    }
    return res.json([]);
  }
});

// -------------------------------
// NEWS sections (cached 15 min) - uses SECTION_FEEDS
// -------------------------------
app.get('/api/news', async (req, res) => {
  const category = (req.query.category || 'general').toLowerCase();
  const pageSize = parseInt(req.query.pageSize || '5', 10);
  const now = Date.now();

  if (cache.sections[category] && (now - cache.sections[category].timestamp) < 15 * 60_000) {
    return res.json(cache.sections[category].data);
  }

  const feeds = SECTION_FEEDS[category] || SECTION_FEEDS['general'];
  try {
    const raw = await fetchFeeds(feeds);
    const normalized = raw.map(normalizeItem)
      .sort((a,b) => new Date(b.isoDate) - new Date(a.isoDate))
      .slice(0, Math.max(5, pageSize));

    // attach short snippet if missing
    const articles = normalized.map(a => ({
      title: a.title,
      link: a.link,
      isoDate: a.isoDate,
      contentSnippet: a.content ? (a.content.length > 240 ? a.content.slice(0,240) + '…' : a.content) : '',
      image: a.image || null
    }));

    const payload = { articles };
    cache.sections[category] = { timestamp: now, data: payload };
    return res.json(payload);
  } catch (err) {
    console.error('news error', err);
    if (cache.sections[category]) return res.json(cache.sections[category].data);
    // fallback placeholders
    return res.json({
      articles: [
        { title: 'Sample Article 1', description: 'Placeholder', url: '#', publishedAt: new Date().toISOString() },
        { title: 'Sample Article 2', description: 'Placeholder', url: '#', publishedAt: new Date().toISOString() }
      ]
    });
  }
});

// -------------------------------
// WEATHER (open-meteo + geocoding)
// cached 5 minutes
// -------------------------------
const weatherCache = {};
app.get('/api/weather', async (req, res) => {
  const city = (req.query.city || 'Ottawa').trim();
  const now = Date.now();
  if (weatherCache[city] && now - weatherCache[city].timestamp < 5 * 60_000) {
    return res.json(weatherCache[city].data);
  }

  try {
    // Geocoding (open-meteo)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geo = await geoRes.json();
    if (!geo || !geo.results || !geo.results.length) {
      // fallback minimal response
      const fallback = { name: city, current_weather: null };
      weatherCache[city] = { timestamp: now, data: fallback };
      return res.json(fallback);
    }

    const top = geo.results[0];
    const lat = top.latitude;
    const lon = top.longitude;
    const name = `${top.name}${top.country ? ', ' + top.country : ''}`;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    const weatherJson = await weatherRes.json();
    const payload = { name, current_weather: weatherJson.current_weather };

    weatherCache[city] = { timestamp: now, data: payload };
    return res.json(payload);
  } catch (err) {
    console.error('weather error', err);
    const fallback = { name: city, current_weather: null };
    weatherCache[city] = { timestamp: now, data: fallback };
    return res.json(fallback);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
