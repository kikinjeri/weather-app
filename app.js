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
      const temp = Math.round(data.main.temp);
      const icon = data.weather[0].icon
        ? `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="Weather Icon">`
        : '';
      div.innerHTML = `
        <p><strong>${data.name}</strong></p>
        ${icon}
        <p>${temp}°C</p>
        <p>${data.weather[0].description}</p>
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

// NEWS + AI Summaries + Recommendations
async function loadNews(category, containerId, recContainerId) {
  const container = document.getElementById(containerId);
  const recContainer = document.getElementById(recContainerId);
  container.innerHTML = 'Loading...';
  recContainer.innerHTML = '';

  try {
    const countries = ['ca', 'us'];
    let allArticles = [];

    for (const country of countries) {
      const res = await fetch(`/api/news?country=${country}&category=${category}&pageSize=5`);
      const data = await res.json();
      if (data.articles) allArticles = allArticles.concat(data.articles);
    }

    container.innerHTML = '';
    if (!allArticles.length) {
      container.innerHTML = '<p>No articles found</p>';
      return;
    }

    allArticles.forEach(article => {
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

      // Add AI summary container
      const summaryDiv = document.createElement('p');
      summaryDiv.textContent = 'Loading summary...';
      card.appendChild(summaryDiv);

      if (article.description) {
        fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: article.description })
        })
        .then(res => res.json())
        .then(data => {
          summaryDiv.textContent = data.summary || '';
        })
        .catch(err => {
          summaryDiv.textContent = '';
          console.error(err);
        });
      } else {
        summaryDiv.textContent = '';
      }

      container.appendChild(card);
    });

    // AI Recommendations
    const recRes = await fetch(`/api/recommend?category=${category}`);
    const recData = await recRes.json();
    if (recData.articles && recData.articles.length) {
      recData.articles.forEach(a => {
        const link = document.createElement('a');
        link.href = a.url;
        link.target = '_blank';
        link.textContent = a.title;
        recContainer.appendChild(link);
      });
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error loading articles</p>';
  }
}

// WEATHER CITY SEARCH
document.getElementById('city-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const city = document.getElementById('city-input').value.trim();
  if (city) loadWeather(city);
});

// INIT
document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
  loadNews('general', 'news-container', 'rec-container-news');
  loadNews('entertainment', 'ent-container', 'rec-container-entertainment');
  loadNews('sports', 'sports-container', 'rec-container-sports');
});
