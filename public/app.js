// ===== UTILS =====
function formatDate(d){ 
  return d ? new Date(d).toLocaleDateString() + ' ' + new Date(d).toLocaleTimeString() : ''; 
}

// ===== WEATHER =====
async function loadWeather(city='Ottawa'){
  const div = document.getElementById('weather-info');
  div.textContent = 'Loading weather...';
  try{
    const res = await fetch(`/api/weather?city=${city}`);
    const data = await res.json();
    if(!data?.main || !data?.weather){ div.textContent='Weather data not available'; return; }
    div.innerHTML = `<p><strong>${data.name}</strong></p>
      <p>${data.main.temp}°C</p>
      <p>${data.weather[0].description}</p>
      <p>Humidity: ${data.main.humidity}%</p>`;
  } catch(e){ console.error(e); div.textContent='Weather error'; }
}

// ===== NEWS / SPORTS / BUSINESS =====
async function loadNews(category, containerId, limit=4){
  const container = document.getElementById(containerId);
  container.innerHTML = 'Loading...';
  try{
    const res = await fetch(`/api/news?category=${category}`);
    const data = await res.json();
    container.innerHTML = '';
    if(!data?.articles?.length){ container.innerHTML='<p>No articles</p>'; return; }

    // Take top 'limit' articles for main section
    const articles = data.articles.slice(0, limit);

    articles.forEach(a => {
      const card = document.createElement('div');
      card.className = 'article-card';
      card.innerHTML = `${a.image ? `<img src="${a.image}" alt="">` : ''}
        <h3>${a.title}</h3>
        <p>${a.description.substring(0,100)}${a.description.length>100?'...':''}</p>
        <small>${formatDate(a.pubDate)}</small>`;
      card.addEventListener('click',()=>openModal(a));
      container.appendChild(card);
    });
  } catch(err){ console.error(err); container.innerHTML='<p>Error loading articles</p>'; }
}

// ===== BREAKING NEWS TICKER =====
async function loadTicker(){
  const tickerDiv = document.getElementById('breaking-ticker');
  tickerDiv.innerHTML = 'Loading...';
  try{
    const res = await fetch(`/api/news?category=general`);
    const data = await res.json();
    tickerDiv.innerHTML = '';
    if(!data?.articles?.length) return;

    // Add all headlines to ticker
    data.articles.forEach(a=>{
      const span = document.createElement('span');
      span.textContent = a.title;
      tickerDiv.appendChild(span);
    });

    document.getElementById('breaking-updated').textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    tickerDiv.style.animation = 'ticker 40s linear infinite';
  } catch(err){
    console.error(err);
    tickerDiv.innerHTML = '<span>Unable to load headlines</span>';
  }
}

// ===== MODAL =====
const modal = document.getElementById('modal');
document.getElementById('modal-close').addEventListener('click',()=>modal.style.display='none');
function openModal(a){
  document.getElementById('modal-title').textContent = a.title;
  document.getElementById('modal-summary').textContent = a.description;
  document.getElementById('modal-link').href = a.link || '#';
  modal.style.display='flex';
}
window.addEventListener('click', e => { if(e.target===modal) modal.style.display='none'; });

// ===== CITY SEARCH =====
document.getElementById('city-form')?.addEventListener('submit', e=>{
  e.preventDefault();
  const city = document.getElementById('city-input').value.trim();
  if(city) loadWeather(city);
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', ()=>{
  loadWeather();
  loadNews('general','news-container'); // top 4
  loadNews('sports','sports-container'); // top 4
  loadNews('business','business-container'); // top 4
  loadTicker(); // all headlines
});

