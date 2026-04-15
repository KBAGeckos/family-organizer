// ===== WEATHER ENGINE =====
// Uses Open-Meteo (free, no API key needed) + Open-Meteo Geocoding
// Moore, SC 29369 coords: 34.9912, -82.1321

const WEATHER_CONFIG = {
  lat: 34.9912,
  lon: -82.1321,
  city: 'Moore, SC'
};

const WMO_CODES = {
  0: { desc: 'Clear sky', icon: '☀️', type: 'sunny' },
  1: { desc: 'Mostly clear', icon: '🌤️', type: 'partly-cloudy' },
  2: { desc: 'Partly cloudy', icon: '⛅', type: 'partly-cloudy' },
  3: { desc: 'Overcast', icon: '☁️', type: 'cloudy' },
  45: { desc: 'Foggy', icon: '🌫️', type: 'foggy' },
  48: { desc: 'Icy fog', icon: '🌫️', type: 'foggy' },
  51: { desc: 'Light drizzle', icon: '🌦️', type: 'rainy' },
  53: { desc: 'Drizzle', icon: '🌧️', type: 'rainy' },
  55: { desc: 'Heavy drizzle', icon: '🌧️', type: 'rainy' },
  61: { desc: 'Light rain', icon: '🌧️', type: 'rainy' },
  63: { desc: 'Rain', icon: '🌧️', type: 'rainy' },
  65: { desc: 'Heavy rain', icon: '🌧️', type: 'rainy' },
  71: { desc: 'Light snow', icon: '🌨️', type: 'snowy' },
  73: { desc: 'Snow', icon: '❄️', type: 'snowy' },
  75: { desc: 'Heavy snow', icon: '❄️', type: 'snowy' },
  80: { desc: 'Rain showers', icon: '🌦️', type: 'rainy' },
  81: { desc: 'Rain showers', icon: '🌧️', type: 'rainy' },
  82: { desc: 'Violent showers', icon: '⛈️', type: 'stormy' },
  85: { desc: 'Snow showers', icon: '🌨️', type: 'snowy' },
  95: { desc: 'Thunderstorm', icon: '⛈️', type: 'stormy' },
  96: { desc: 'Thunderstorm', icon: '⛈️', type: 'stormy' },
  99: { desc: 'Severe storm', icon: '🌩️', type: 'stormy' },
};

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

async function fetchWeather() {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_CONFIG.lat}&longitude=${WEATHER_CONFIG.lon}&current=temperature_2m,weathercode,is_day&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&forecast_days=5&timezone=America%2FNew_York`;
    const res = await fetch(url);
    const data = await res.json();
    renderWeather(data);
  } catch(e) {
    document.getElementById('w-desc').textContent = 'Weather unavailable';
    setWeatherBg('partly-cloudy', true);
  }
}

function renderWeather(data) {
  const cur = data.current;
  const daily = data.daily;
  const code = cur.weathercode;
  const isDay = cur.is_day === 1;
  const info = WMO_CODES[code] || { desc: 'Clear', icon: '🌤️', type: 'partly-cloudy' };
  const weatherType = (!isDay) ? 'night' : info.type;

  // Current conditions
  document.getElementById('w-icon').textContent = isDay ? info.icon : '🌙';
  document.getElementById('w-temp').textContent = Math.round(cur.temperature_2m) + '°F';
  document.getElementById('w-desc').textContent = info.desc;

  // 5-day forecast
  const forecastRow = document.getElementById('forecast-row');
  forecastRow.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const dayDate = new Date(daily.time[i] + 'T12:00:00');
    const dayCode = daily.weathercode[i];
    const dayInfo = WMO_CODES[dayCode] || { icon: '🌤️' };
    const isToday = i === 0;
    const div = document.createElement('div');
    div.className = 'forecast-day';
    div.innerHTML = `
      <div class="fd-name">${isToday ? 'Today' : DAY_NAMES[dayDate.getDay()]}</div>
      <div class="fd-icon">${dayInfo.icon}</div>
      <div class="fd-hi">${Math.round(daily.temperature_2m_max[i])}°</div>
      <div class="fd-lo">${Math.round(daily.temperature_2m_min[i])}°</div>
    `;
    forecastRow.appendChild(div);
  }

  setWeatherBg(weatherType, isDay);
}

function setWeatherBg(type, isDay) {
  const body = document.body;
  // Remove all weather classes
  ['sunny','cloudy','rainy','stormy','snowy','foggy','partly-cloudy','night'].forEach(c => {
    body.classList.remove('weather-' + c);
  });
  body.classList.add('weather-' + type);
  buildWeatherParticles(type, isDay);
}

function buildWeatherParticles(type, isDay) {
  const layer = document.getElementById('weather-layer');
  if (!layer) return;
  layer.innerHTML = '';

  if (type === 'sunny') {
    const sun = document.createElement('div');
    sun.className = 'sun';
    for (let i = 0; i < 8; i++) {
      const ray = document.createElement('div');
      ray.className = 'sun-ray';
      ray.style.transform = `translateY(-50%) rotate(${i * 45}deg)`;
      ray.style.animationDelay = `${i * 0.2}s`;
      sun.appendChild(ray);
    }
    layer.appendChild(sun);
  }

  else if (type === 'partly-cloudy') {
    const sun = document.createElement('div');
    sun.className = 'sun';
    sun.style.opacity = '0.7';
    layer.appendChild(sun);
    addClouds(layer, 3, 0.4);
  }

  else if (type === 'cloudy') {
    addClouds(layer, 6, 0.6);
  }

  else if (type === 'rainy') {
    addClouds(layer, 4, 0.5);
    addRain(layer, 80);
  }

  else if (type === 'stormy') {
    addClouds(layer, 5, 0.7);
    addRain(layer, 120);
    const bolt = document.createElement('div');
    bolt.className = 'lightning';
    bolt.style.height = (80 + Math.random() * 80) + 'px';
    bolt.style.left = (20 + Math.random() * 60) + '%';
    bolt.style.animationDelay = (Math.random() * 4) + 's';
    layer.appendChild(bolt);
  }

  else if (type === 'snowy') {
    addClouds(layer, 3, 0.4);
    addSnow(layer, 40);
  }

  else if (type === 'foggy') {
    for (let i = 0; i < 5; i++) {
      const fog = document.createElement('div');
      fog.className = 'fog-layer';
      fog.style.top = (10 + i * 18) + '%';
      fog.style.width = (120 + Math.random() * 80) + '%';
      fog.style.animationDuration = (8 + Math.random() * 6) + 's';
      fog.style.animationDelay = (Math.random() * 4) + 's';
      layer.appendChild(fog);
    }
  }

  else if (type === 'night') {
    const moon = document.createElement('div');
    moon.className = 'moon';
    layer.appendChild(moon);
    for (let i = 0; i < 60; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = (Math.random() * 100) + '%';
      star.style.top = (Math.random() * 70) + '%';
      star.style.animationDuration = (2 + Math.random() * 4) + 's';
      star.style.animationDelay = (Math.random() * 4) + 's';
      const sz = Math.random() < 0.2 ? 3 : 2;
      star.style.width = sz + 'px'; star.style.height = sz + 'px';
      layer.appendChild(star);
    }
  }
}

function addClouds(layer, count, opacity) {
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    const w = 150 + Math.random() * 200;
    const h = 50 + Math.random() * 60;
    cloud.style.width = w + 'px';
    cloud.style.height = h + 'px';
    cloud.style.top = (5 + Math.random() * 30) + '%';
    cloud.style.opacity = opacity;
    const dur = 25 + Math.random() * 40;
    cloud.style.animationDuration = dur + 's';
    cloud.style.animationDelay = -(Math.random() * dur) + 's';
    layer.appendChild(cloud);
  }
}

function addRain(layer, count) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.left = (Math.random() * 110) + '%';
    drop.style.height = (15 + Math.random() * 30) + 'px';
    drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
    drop.style.animationDelay = -(Math.random() * 2) + 's';
    drop.style.opacity = 0.4 + Math.random() * 0.4;
    layer.appendChild(drop);
  }
}

function addSnow(layer, count) {
  const flakes = ['❄', '❅', '❆', '*', '·'];
  for (let i = 0; i < count; i++) {
    const flake = document.createElement('div');
    flake.className = 'snowflake' + (Math.random() < 0.2 ? ' large' : Math.random() < 0.3 ? ' small' : '');
    flake.textContent = flakes[Math.floor(Math.random() * flakes.length)];
    flake.style.left = (Math.random() * 100) + '%';
    flake.style.animationDuration = (3 + Math.random() * 5) + 's';
    flake.style.animationDelay = -(Math.random() * 6) + 's';
    layer.appendChild(flake);
  }
}

// Init
fetchWeather();
// Refresh every 15 min
setInterval(fetchWeather, 15 * 60 * 1000);
