function $(id){return document.getElementById(id);}
function formatTime(t){return new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}

// WEATHER
async function loadWeather(city='Ottawa'){
    try{
        const res=await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
        const data=await res.json();
        const w=$('weather-info');
        if(data.error){w.textContent='Weather unavailable'; return;}
        w.innerHTML=`<h4>${data.name}</h4><p>${data.temp}°C — ${data.description}</p><small>Humidity: ${data.humidity}%</small>`;
    }catch(e){console.error(e);$('weather-info').textContent='Weather error';}
}

// CRYPTO
async function loadCrypto(){
    try{
        const res=await fetch('/api/crypto');
        const data=await res.json();
        const container=$('crypto-container');
        container.innerHTML='';
        const table = document.createElement('table');
        table.className='crypto-table';
        table.innerHTML=`<thead><tr><th>Name</th><th>Price</th><th>Change(24h)</th><th>Market Cap</th></tr></thead><tbody></tbody>`;
        container.appendChild(table);
        const tbody = table.querySelector('tbody');

        data.forEach(coin=>{
            const isPositive = coin.change>=0;
            const color = isPositive?'var(--positive-color)':'var(--negative-color)';
            const arrow = isPositive?'▲':'▼';
            const row = document.createElement('tr');
            row.innerHTML=`<td>${coin.name}</td>
                <td>${coin.price}</td>
                <td style="color:${color}; font-weight:bold;">${arrow} ${Math.abs(coin.change)}%</td>
                <td>${coin.marketCap}</td>`;
            tbody.appendChild(row);
        });
    }catch(e){console.error(e);$('crypto-container').textContent='Crypto unavailable';}
}

// STOCKS
async function loadStocks(){
    try{
        const res=await fetch('/api/stocks');
        const data=await res.json();
        const container=$('stocks-container');
        container.innerHTML='';
        const table = document.createElement('table');
        table.className='stocks-table';
        table.innerHTML=`<thead><tr><th>Symbol</th><th>Price</th><th>Change (%)</th></tr></thead><tbody></tbody>`;
        container.appendChild(table);
        const tbody = table.querySelector('tbody');

        data.forEach(stock=>{
            const isPositive = parseFloat(stock.change) >=0;
            const color = isPositive?'var(--positive-color)':'var(--negative-color)';
            const arrow = isPositive?'▲':'▼';
            const row = document.createElement('tr');
            row.innerHTML=`<td>${stock.symbol}</td>
                <td>${stock.price}</td>
                <td style="color:${color}; font-weight:bold;">${arrow} ${Math.abs(stock.change)}%</td>`;
            tbody.appendChild(row);
        });
    }catch(e){console.error(e);$('stocks-container').textContent='Unable to load stock data';}
}

// NEWS / SPORTS
const sections=[
    {category:'general', container:'news-container'},
    {category:'business', container:'business-container'},
    {category:'tech', container:'tech-container'},
    {category:'sports', container:'sports-container'}
];
async function loadSection(category, containerId){
    try{
        const res=await fetch(`/api/news?category=${category}`);
        const {items}=await res.json();
        const grid=$(containerId);
        grid.innerHTML='';
        items.slice(0,4).forEach(a=>{
            const div=document.createElement('div');
            div.className='article-card';
            div.innerHTML=`<h3>${a.title}</h3><p>${a.contentSnippet||''}</p><small>${new Date(a.pubDate).toLocaleString()}</small>`;
            div.onclick=()=>openModal(a);
            grid.appendChild(div);
        });
    }catch(e){console.error(e);$(containerId).innerHTML='<p>Unable to load news</p>';}
}

// BREAKING TICKER
async function loadTicker(){
    try{
        const res=await fetch('/api/news?category=general&limit=20');
        const {items}=await res.json();
        const ticker=$('breaking-ticker');
        ticker.innerHTML='';
        const allItems=[...items,...items];
        allItems.forEach(i=>{
            const span=document.createElement('span');
            span.textContent=i.title;
            ticker.appendChild(span);
        });
        $('breaking-updated').textContent='Updated '+formatTime(Date.now());
    }catch(e){console.error(e);}
}

// SOCIAL
async function loadSocial(){
    const feed=$('social-feed'); feed.innerHTML='Loading social feed...';
    try{
        const res=await fetch('/api/social');
        const {items}=await res.json();
        feed.innerHTML='';
        items.forEach(post=>{
            const div=document.createElement('div');
            div.className='social-card';
            let summary=post.contentSnippet||'';
            if(summary.length>200) summary=summary.slice(0,200)+'…';
            div.innerHTML=`<p><strong>${post.handle}:</strong> ${summary}</p><small>${new Date(post.pubDate||Date.now()).toLocaleString()}</small>`;
            feed.appendChild(div);
        });
    }catch(e){console.error(e);feed.textContent='Unable to load social feed';}
}

// MODAL
function openModal(a){
    $('modal').style.display='flex';
    $('modal-title').textContent=a.title;
    $('modal-date').textContent=new Date(a.pubDate).toLocaleString();
    $('modal-body').textContent=a.contentSnippet||'';
    $('modal-link').href=a.link;
}
$('modal-close').onclick=()=>$('modal').style.display='none';
window.onclick=e=>{if(e.target.id==='modal') $('modal').style.display='none';};
window.addEventListener('keydown',e=>{if(e.key==='Escape') $('modal').style.display='none';});

// WEATHER FORM
$('city-form').onsubmit=e=>{
    e.preventDefault();
    const city=$('city-input').value.trim();
    if(city) loadWeather(city);
};

// INITIAL LOAD
window.onload=()=>{
    loadWeather();
    loadCrypto();
    loadStocks();
    loadTicker();
    sections.forEach(s=>loadSection(s.category,s.container));
    loadSocial();

    // Auto-refresh stocks every 60s
    setInterval(loadStocks,60000);
};
