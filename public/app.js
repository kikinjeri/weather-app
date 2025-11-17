// ===== UTILS =====
function formatDate(d){ return d ? new Date(d).toLocaleDateString()+' '+new Date(d).toLocaleTimeString() : ''; }

// ===== WEATHER =====
async function loadWeather(city='Ottawa'){
  const div=document.getElementById('weather-info');
  div.textContent='Loading weather...';
  try{
    const res=await fetch(`/api/weather?city=${city}`);
    const data=await res.json();
    if(!data?.main){ div.textContent='Weather not available'; return; }
    div.innerHTML=`<p><strong>${data.name}</strong></p>
      <p>${Math.round(data.main.temp)}°C</p>
      <p>${data.weather[0].description}</p>
      <p>Humidity: ${data.main.humidity}%</p>`;
  }catch(e){ console.error(e); div.textContent='Weather error'; }
}

// ===== NEWS =====
async function loadNews(category, containerId, ticker=false){
  const container=document.getElementById(containerId);
  container.innerHTML='Loading...';
  try{
    const res=await fetch(`/api/news?category=${category}`);
    const data=await res.json();
    container.innerHTML='';
    if(!data?.items?.length){ container.innerHTML='<p>No articles</p>'; return; }

    const articles = data.items.slice(0,4); // 2x2 layout

    articles.forEach(a=>{
      const card=document.createElement('div');
      card.className='article-card';
      card.innerHTML=`${a.image?`<img src="${a.image}" alt="">`:''}
        <h3>${a.title}</h3>
        <p>${a.contentSnippet || ''}</p>
        <small>${formatDate(a.pubDate)}</small>`;
      card.addEventListener('click',()=>openModal(a));
      container.appendChild(card);
    });

    if(ticker){
      const tickerDiv=document.getElementById('breaking-ticker');
      tickerDiv.innerHTML='';
      data.items.forEach(a=>{
        const span=document.createElement('span');
        span.textContent=a.title;
        tickerDiv.appendChild(span);
      });
      document.getElementById('breaking-updated').textContent=`Updated: ${new Date().toLocaleTimeString()}`;
    }

  }catch(err){ console.error(err); container.innerHTML='<p>Error loading articles</p>'; }
}

// ===== MODAL =====
const modal=document.getElementById('modal');
document.getElementById('modal-close').addEventListener('click',()=>modal.style.display='none');
function openModal(a){
  document.getElementById('modal-title').textContent=a.title;
  document.getElementById('modal-summary').textContent=a.contentSnippet || '';
  document.getElementById('modal-link').href=a.link || '#';
  modal.style.display='flex';
}
window.addEventListener('click',e=>{ if(e.target===modal) modal.style.display='none'; });

// ===== CITY SEARCH =====
document.getElementById('city-form')?.addEventListener('submit',e=>{
  e.preventDefault();
  const city=document.getElementById('city-input').value.trim();
  if(city) loadWeather(city);
});

// ===== SOCIAL FEED =====
async function loadSocialFeed(category='tech'){
  const container=document.getElementById('social-feed');
  container.innerHTML='Loading feed...';
  try{
    const res=await fetch(`/api/social?category=${category}`);
    const data=await res.json();
    container.innerHTML='';
    if(!data?.items?.length){ container.innerHTML='<p>No posts found</p>'; return; }

    data.items.slice(0,10).forEach(p=>{
      const div=document.createElement('div');
      div.className='social-card';
      div.innerHTML=`<p>${p.title}</p><small>${formatDate(p.pubDate)}</small>`;
      container.appendChild(div);
    });
  }catch(err){ console.error(err); container.innerHTML='<p>Error loading feed</p>'; }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  loadWeather();
  loadNews('general','news-container',true);
  loadNews('sports','sports-container');
  loadNews('business','business-container');
  loadSocialFeed();
  document.getElementById('feed-type')?.addEventListener('change', e=>{
    loadSocialFeed(e.target.value);
  });
});
;
