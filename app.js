function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

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
      div.innerHTML = `
        <p><strong>${data.name}</strong></p>
        ${icon}
        <p>Temperature: ${data.main.temp}°C</p>
        <p>Condition: ${data.weather[0].description}</p>
        <p>Humidity: ${data.main.humidity}%</p>
      `;
    } else {
      div.innerHTML = '<p>Weather unavailable</p>';
    }
  } catch (err) {
    console.error(err);
    div.innerHTML = '<p>Error loading weather</p>';
  }
}

async function loadNews(category = 'general', containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = 'Loading...';

  try {
    const res = await fetch(`/api/news?category=${category}`);
    const data = await res.json();

    container.innerHTML = '';

    if (data.articles && data.articles.length > 0) {
      data.articles.forEach(article => {
        const card = document.createElement('div');
        card.classList.add('article-card');

        const img = article.urlToImage
          ? `<img src="${article.urlToImage}" alt="Article Image">`
          : `<div class="placeholder-image">No Image</div>`;

        const date = article.publishedAt ? `<small>${formatDate(article.publishedAt)}</small>` : '';

        card.innerHTML = `
          ${img}
          <a href="${article.url}" target="_blank"><h3>${article.title}</h3></a>
          <p>${article.description || ''}</p>
          ${date}
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = `<p>No ${category} news</p>`;
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p>Error loading ${category} news</p>`;
  }
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
  loadNews('general', 'news-container');
  loadNews('entertainment', 'ent-container');
  loadNews('sports', 'sports-container');
  loadNews('fashion', 'fashion-container');
});
