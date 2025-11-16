document.addEventListener('DOMContentLoaded', () => {

  // WEATHER
  const weatherDiv = document.getElementById('weather-info');
  async function loadWeather(city='Ottawa'){
    weatherDiv.textContent = 'Loading weather...';
    try{
      const res = await fetch(`/api/weather?city=${city}`);
      const data = await res.json();
      const temp = Math.round(data.main.temp);
      const icon = data.weather[0].icon 
        ? `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">` 
        : '';
      weatherDiv.innerHTML = `<strong>${data.name}</strong> ${icon} ${temp}°C ${data.weather[0].description} Humidity: ${data.main.humidity}%`;
    }catch(e){
      weatherDiv.textContent='Weather unavailable';
    }
  }

  document.getElementById('city-form').addEventListener('submit', e=>{
    e.preventDefault();
    const city = document.getElementById('city-input').value.trim();
    if(city) loadWeather(city);
  });

  loadWeather();

  // NEWS
  async function loadNews(category, containerId){
    const container = document.getElementById(containerId);
    container.innerHTML='Loading...';
    try{
      const res = await fetch(`/api/news?category=${category}&pageSize=10`);
      const data = await res.json();
      container.innerHTML='';
      if(!data.articles.length){
        container.innerHTML='<p>No articles</p>';
        return;
      }

      data.articles.forEach(article=>{
        const card = document.createElement('div');
        card.className='article-card';
        const img = article.urlToImage
          ? `<img src="${article.urlToImage}" alt="Image">`
          : `<div class="placeholder-image">No Image</div>`;
        card.innerHTML=`
          ${img}
          <a href="#" class="modal-open"><h3>${article.title}</h3></a>
          <p>${article.description}</p>
        `;
        card.querySelector('.modal-open').addEventListener('click', e=>{
          e.preventDefault();
          openModal(article);
        });
        container.appendChild(card);
      });

    }catch(e){
      container.innerHTML='<p>Error loading news</p>';
    }
  }

  loadNews('general','news-container');
  loadNews('entertainment','ent-container');
  loadNews('sports','sports-container');

  // MODAL
  const modal = document.getElementById('summary-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalSummary = document.getElementById('modal-summary');
  const modalImage = document.getElementById('modal-image');
  const modalLink = document.getElementById('modal-link');

  async function openModal(article){
    modalTitle.textContent=article.title;
    modalSummary.textContent='Loading summary...';
    modalImage.src = article.urlToImage || '';
    modalLink.href = article.url || '#';
    modal.style.display='block';

    if(article.description){
      try{
        const res = await fetch('/api/summarize',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({text:article.description})
        });
        const data = await res.json();
        modalSummary.textContent = data.summary;
      }catch(e){ modalSummary.textContent=''; }
    } else modalSummary.textContent='';
  }

  modalClose.addEventListener('click',()=>modal.style.display='none');
  window.addEventListener('click',e=>{ if(e.target===modal) modal.style.display='none'; });

  // BREAKING NEWS TICKER
  const tickerDiv = document.getElementById('breaking-ticker');
  async function loadTicker(){
    try{
      const res = await fetch('/api/news?category=general&pageSize=10');
      const data = await res.json();
      if(!data.articles.length) return;

      tickerDiv.innerHTML='';
      data.articles.forEach(a=>{
        const span = document.createElement('span');
        span.textContent = a.title;
        tickerDiv.appendChild(span);
      });

    }catch(e){ tickerDiv.textContent='No breaking news'; }
  }
  loadTicker();

});

