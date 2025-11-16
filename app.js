// -------------------------
// LOCAL AI-STYLE SUMMARIZER
// -------------------------
function summarizeText(text) {
  if (!text) return '';
  const sentences = text.split(/(?<=\.|\?|!)/).map(s => s.trim()).filter(Boolean);
  return sentences.slice(0, 2).join(' '); // 2-sentence summary
}

// -------------------------
// FORMAT DATE
// -------------------------
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// -------------------------
// WEATHER
// -------------------------
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
      div.innerHTML = `
        <p><strong>${city}</strong></p>
        <p>20°C</p>
        <p>Clear sky</p>
        <p>Humidity: 50%</p>
      `;
    }
  } catch (err) {
    console.error(err);
    div.innerHTML = `
      <p><strong>${city}</strong></p>
      <p>20°C</p>
      <p>Clear sky</p>
      <p>Humidity: 50%</p>
    `;
  }
}

// -------------------------
// LOAD NEWS
// -------------------------
async function loadNews(category, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = 'Loading...';

  try {
    const countries = ['ca'];
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

      const date = article.publishedAt ? `<small>${formatDate(article.publishedAt)}</small>` : '';
      const summary = summarizeText(article.description || article.title);

      card.innerHTML = `
        <a href="#" class="article-link"><h3>${article.title}</h3></a>
        <p>${summary}</p>
        ${date}
      `;

      card.querySelector('.article-link').addEventListener('click', e => {
        e.preventDefault();
        openModal(article);
      });

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error loading articles</p>';
  }
}

// -------------------------
// BREAKING NEWS TICKER
// -------------------------
let breakingNews = [];
async function loadBreakingNews() {
  const ticker = document.getElementById('breaking-ticker');
  const updated = document.getElementById('breaking-updated');

  try {
    const res = await fetch(`/api/news?country=ca&category=general&pageSize=10`);
    const data = await res.json();
    breakingNews = data.articles || [];
    if (!breakingNews.length) {
      ticker.textContent = 'No breaking news';
      return;
    }

    let i = 0;
    function showNext() {
      if (!breakingNews.length) return;
      const article = breakingNews[i];
      ticker.textContent = article.title;
      i = (i + 1) % breakingNews.length;
      updated.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
    }

    showNext();
    setInterval(showNext, 5000);

  } catch (err) {
    console.error(err);
    ticker.textContent = 'Error loading breaking news';
  }
}

// -------------------------
// MODAL
// -------------------------
const modal = document.getElementById('summary-modal');
const modalTitle = document.getElementById('modal-title');
const modalSummary = document.getElementById('modal-summary');
const modalLink = document.getElementById('modal-link');
const modalSource = document.getElementById('modal-source');
const modalImage = document.getElementById('modal-image');
const modalClose = document.getElementById('modal-close');

function openModal(article) {
  modalTitle.textContent = article.title;
  modalSummary.textContent = summarizeText(article.description || article.title);
  modalLink.href = article.url;
  modalSource.textContent = article.source?.name || '';
  modalImage.src = article.urlToImage || '/images/news-placeholder.jpg';
  modalImage.alt = article.title;
  modal.setAttribute('aria-hidden', 'false');
  modal.style.display = 'block';
}

modalClose.addEventListener('click', () => {
  modal.setAttribute('aria-hidden', 'true');
  modal.style.display = 'none';
});

// -------------------------
// CITY SEARCH
// -------------------------
document.getElementById('city-form')?.addEventListener('submit', e => {
  e.preventDefault();
  const city = document.getElementById('city-input').value.trim();
  if (city) loadWeather(city);
});

// -------------------------
// INIT
// -------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadWeather();
  loadNews('general', 'news-container');
  loadNews('entertainment', 'ent-container');
  loadNews('sports', 'sports-container');
  loadBreakingNews();
});
