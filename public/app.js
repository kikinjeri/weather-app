// ===== WEATHER =====
async function loadWeather(city='Ottawa'){ 
    try{
        const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data = await res.json();
        const w = document.getElementById('weather-info');
        if(data.error){ w.innerHTML='Weather unavailable'; return; }
        w.innerHTML = `<h4>${data.name}</h4><p>${data.temp}°C — ${data.description}</p><small>Humidity: ${data.humidity}%</small>`;
    }catch(err){ console.error(err); document.getElementById('weather-info').textContent='Weather error'; }
}

// ===== TSX (safe fallback) =====
async function loadTSX(){
    try{
        const res = await fetch('/api/tsx');
        const d = await res.json();
        const tsx = document.getElementById('tsx-widget-header');
        tsx.innerHTML = `<strong>${d.index||'TSX'}:</strong> ${d.price?.toLocaleString()||'--'} CAD (${d.change?.toFixed(2)||'--'}, ${d.percent?.toFixed(2)||'--'}%)`;
    }catch(err){ 
        console.error(err);
        document.getElementById('tsx-widget-header').textContent='TSX unavailable';
    }
}

// ===== BREAKING NEWS =====
async function loadTicker(){
    try{
        const res = await fetch('/api/news?category=general');
        const { items } = await res.json();
        const ticker = document.getElementById('breaking-ticker');
        ticker.innerHTML='';
        items.slice(0,20).forEach(i=>{
            const span = document.createElement('span');
            span.textContent=i.title;
            ticker.appendChild(span);
        });
        document.getElementById('breaking-updated').textContent='Updated '+new Date().toLocaleTimeString();
    }catch(err){console.error(err);}
}

// ===== NEWS SECTIONS =====
const sections = [
    {category:'general', container:'news-container'},
    {category:'business', container:'business-container'},
    {category:'tech', container:'tech-container'},
    {category:'sports', container:'sports-container'},
];
async function loadSection(category, containerId){
    try{
        const res = await fetch(`/api/news?category=${category}`);
        const { items } = await res.json();
        const grid = document.getElementById(containerId);
        grid.innerHTML='';
        items.slice(0,4).forEach(a=>{
            const div=document.createElement('div');
            div.className='article-card';
            div.innerHTML=`<h3>${a.title}</h3><p>${a.contentSnippet||''}</p><small>${new Date(a.pubDate).toLocaleString()}</small>`;
            div.onclick=()=>openModal(a);
            grid.appendChild(div);
        });
    }catch(err){console.error(err);}
}

// ===== TWITTER FEED (placeholder) =====
function loadSocial(){
    const feed = document.getElementById('social-feed');
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
        div.innerHTML=`<div class='social-card-header'><strong>${p.handle}</strong></div><p>${p.tweet}</p><small>${p.date.toLocaleTimeString()}</small>`;
        feed.appendChild(div);
    });
}

// ===== MODAL =====
function openModal(a){
    document.getElementById('modal').style.display='flex';
    document.getElementById('modal-title').textContent=a.title;
    document.getElementById('modal-date').textContent=new Date(a.pubDate).toLocaleString();
    document.getElementById('modal-body').textContent=a.contentSnippet||'';
    document.getElementById('modal-link').href=a.link;
}
document.getElementById('modal-close').onclick=()=>document.getElementById('modal').style.display='none';
window.onclick=e=>{if(e.target.id==='modal')document.getElementById('modal').style.display='none';}

// ===== EVENTS =====
document.getElementById('city-form').addEventListener('submit',e=>{e.preventDefault(); loadWeather(document.getElementById('city-input').value);});

// ===== INIT =====
loadWeather();
loadTSX();
loadTicker();
sections.forEach(s=>loadSection(s.category,s.container));
loadSocial();
setInterval(()=>{loadWeather(); loadTSX(); loadTicker(); sections.forEach(s=>loadSection(s.category,s.container)); loadSocial();},300000);
