function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// WEATHER
async function loadWeather(city = 'Ottawa') {
  const div = document.getElementById('weather-info');
  div.innerHTML = 'Loading weather...';
  try {
    const res = await fetch(`/api/weather?city=${city}`);
    const data = await res.json();
    if (data.main) {
      const icon = data.weather[0].icon
        ? `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">`
        : '';
      div.innerHTML = `<p><strong>${data.name}</strong></p>${icon}<p>${data.main.temp}°C</p><p>${data.weather[0].description}</p><p>Humidity: ${data.main.humidity}%</p>`;
    } else div.innerHTML = '<p>Weather unavailable</p>';
  } catch (err) {
    console.error(err);
    div.innerHTML = '<p>Error loading weather</p>';
  }
}

// NEWS
async function loadNews(category, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = 'Loading...';
  try {
    const countries = ['ca','us'];
    let allArticles = [];
    for (const country of countries) {
      const res = await fetch(`/api/news?country=${country}&category=${category}&pageSize=5`);
      const data = await res.json();
      if (data.articles) allArticles = allArticles.concat(data.articles);
    }

    container.innerHTML = '';
    if (!allArticles.length) container.innerHTML = '<p>No articles found</p>';

    allArticles.forEach(article => {
      const card = document.createElement('div');
      card.classList.add('article-card');
      const img = article.urlToImage ? `<img src="${article.urlToImage}" alt="Image">` : `<div class="placeholder-image">No Image</div>`;
      const date = article.publishedAt ? `<small>${formatDate(article.publishedAt)}</small>` : '';
      card.innerHTML = `${img}<a href="${article.url}" target="_blank"><h3>${article.title}</h3></a><p>${article.description || ''}</p>${date}`;
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error loading articles</p>';
  }
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
  loadNews('general', 'news-container');
  loadNews('entertainment', 'ent-container');
  loadNews('sports', 'sports-container');
});
