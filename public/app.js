// ===== HELPER =====
function $(id){ return document.getElementById(id); }

function formatTime(t){
    return new Date(t).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}

function animateNumber(el, start, end, duration = 1000){
    const range = end - start;
    const startTime = performance.now();

    function step(now){
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = start + range * progress;
        el.textContent = current.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
        if(progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

// ===== WEATHER =====
async function loadWeather(city='Ottawa'){
    try{
        const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        const w = $('weather-info');
        if(data.error){ w.textContent='Weather unavailable'; return; }
        w.innerHTML = `<strong>${data.name}</strong>: ${data.temp}°C — ${data.description}<br><small>Humidity: ${data.humidity}%</small>`;
    }catch(err){ console.error(err); $('weather-info').textContent='Weather error'; }
}

// ===== CRYPTO =====
async function loadCrypto(){
    const cryptoDiv = $('crypto-widget-header');
    try{
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum');
        const data = await res.json();
        if(!data){ cryptoDiv.textContent='Crypto unavailable'; return; }

        const btc = data.find(c=>c.id==='bitcoin');
        const eth = data.find(c=>c.id==='ethereum');

        const createSpan = (label, value, pctChange, mcap) => {
            const color = pctChange < 0 ? 'red' : 'limegreen';
            const arrow = pctChange < 0 ? '▼' : '▲';
            return `<strong>${label}:</strong> <span class="crypto-price" style="font-weight:bold;">$${value.toLocaleString()}</span> 
                    (<span style="color:${color}; font-weight:bold;">${arrow} ${pctChange.toFixed(2)}%</span>), 
                    <strong>MCap:</strong> $${(mcap/1e9).toFixed(2)}B`;
        };

        cryptoDiv.innerHTML = `
          ${createSpan('BTC', btc.current_price, btc.price_change_percentage_24h, btc.market_cap)}<br>
          ${createSpan('ETH', eth.current_price, eth.price_change_percentage_24h, eth.market_cap)}
        `;

        // Animate numbers
        cryptoDiv.querySelectorAll('.crypto-price').forEach((span, i) => {
            const val = i === 0 ? btc.current_price : eth.current_price;
            animateNumber(span, 0, val, 800);
        });

    }catch(err){ console.error(err); cryptoDiv.textContent='Crypto unavailable'; }
}

// ===== BREAKING NEWS TICKER =====
async function loadTicker(){
    try{
        const res = await fetch('/api/news?category=general');
        const { items } = await res.json();
        const ticker = $('breaking-ticker');
        ticker.innerHTML='';
        items.slice(0,20).forEach(i=>{
            const span = document.createElement('span');
            span.textContent = i.title;
            ticker.appendChild(span);
        });
        $('breaking-updated').textContent='Updated '+formatTime(new Date());
    }catch(err){ console.error(err); }
}

// ===== NEWS SECTIONS =====
const sections = [
    {category:'general', container:'news-container'},
    {category:'business', container:'business-container'},
    {category:'tech', container:'tech-container'},
    {category:'sports', container:'sports-container'}
];

async function loadSection(category, containerId){
    try{
        const res = await fetch(`/api/news?category=${category}`);
        const { items } = await res.json();
        const grid = $(containerId);
        grid.innerHTML='';
        items.slice(0,4).forEach(a=>{
            const div=document.createElement('div');
            div.className='article-card';
            div.innerHTML=`<h3>${a.title}</h3><p>${a.contentSnippet||''}</p><small>${new Date(a.pubDate).toLocaleString()}</small>`;
            div.onclick=()=>openModal(a);
            grid.appendChild(div);
        });
    }catch(err){ console.error(err); }
}

// ===== SOCIAL FEED =====
function loadSocial(){
    const feed = $('social-feed');
    const posts = [
        {handle:'@TechCrunch', tweet:'Big startup news today!', date:new Date()},
        {handle:'@Verge', tweet:'New gadget review!', date:new Date()},
        {handle:'@Engadget', tweet:'Top tech deals this week.', date:new Date()},
        {handle:'@CNN', tweet:'Breaking news update!', date:new Date()},
        {handle:'@BBC', tweet:'World politics highlights.', date:new Date()},
    ];
    feed.innerHTML='';
    posts.forEach(p=>{
        const div = document.createElement('div');
        div.className='social-card';
        div.innerHTML=`<div class='social-card-header'><strong>${p.handle}</strong></div><p>${p.tweet}</p><small>${formatTime(p.date)}</small>`;
        feed.appendChild(div);
    });
}

// ===== MODAL =====
function openModal(a){
    $('modal').style.display='flex';
    $('modal-title').textContent=a.title;
    $('modal-date').textContent=new Date(a.pubDate).toLocaleString();
    $('modal-body').textContent=a.contentSnippet||'';
    $('modal-link').href=a.link;
}
$('modal-close').onclick=()=>$('modal').style.display='none';
window.onclick=e=>{if(e.target.id==='modal')$('modal').style.display='none';};

// ===== EVENTS =====
$('city-form').addEventListener('submit', e=>{
    e.preventDefault();
    loadWeather($('city-input').value);
});

// ===== INIT =====
loadWeather();
loadCrypto();
loadTicker();
sections.forEach(s=>loadSection(s.category,s.container));
loadSocial();

// Refresh every 5 mins
setInterval(()=>{
    loadWeather();
    loadCrypto();
    loadTicker();
    sections.forEach(s=>loadSection(s.category,s.container));
    loadSocial();
}, 300000);
