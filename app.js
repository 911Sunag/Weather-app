//Api
async function getLocation(country) {
  let url = `http://api.openweathermap.org/geo/1.0/direct?q=${country}&limit=1&appid=dd012067d4c108d2a2fe7a2f5c56789a`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    
    // getForecast();
    return result;
   
  } catch (error) {
    console.error(error.message);
  }
}

async function getForecast(lat,lon) {

  let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code&timezone=auto`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    return result;
   
  } catch (error) {
    console.error(error.message);
  }
}

async function processLocation(country) {
  try {
    let res = await getLocation(country); 
    // Await the resolution of the Promise
    console.log("getting long and lat : ",res);
    let geoLocationData = res;

    let longitude = geoLocationData[0].lon;
    let latitude = geoLocationData[0].lat;

    console.log("long : ", longitude);
    console.log("lat : ", latitude);

    let forecastData = await getForecast(latitude,longitude);
    console.log("forecast data : ",forecastData);
  } catch (error) {
    console.error("Error processing location data:", error);
  }
}

// processLocation(country); 

//Dom refs for header content
// const searchBtn = document.querySelector("#searchbtn");
const noResult = document.querySelector(".no-result");
const searchingbox = document.querySelector("#searching");

const unitsDrop = document.querySelector(".dropdown button");
const switchTo = document.querySelector(".imperial");
const items = document.querySelectorAll(".units");

function toggleBtwUnits() {
  if (switchTo.style.display === "flex") {
    switchTo.style.display = "none";
  } else {
    switchTo.style.display = "flex";
  }
}

const searchInput = document.getElementById("si");
const searchingBox = document.getElementById("searching");
const searchBtn = document.querySelector("#searchbtn");

// call API when user types
searchBtn.addEventListener("click",(event)=>{
    event.preventDefault();
   console.log(searchInput.value.trim());
   let searchCountry = searchInput.value.trim();
   processLocation(searchCountry);
});


unitsDrop.addEventListener("click", (event) => {
  toggleBtwUnits();
  event.stopPropagation();
});

searchBtn.addEventListener("click",(event)=>{
  event.preventDefault();
  
})


function mapWeatherCodeToIcon(code) {
  // Open-Meteo / WMO weather interpretation codes mapping
  // See: https://open-meteo.com/en/docs
  if (code === 0) return 'assets/images/icon-sunny.webp';
  if (code === 1) return 'assets/images/icon-partly-cloudy.webp';
  if (code === 2) return 'assets/images/icon-partly-cloudy.webp';
  if (code === 3) return 'assets/images/icon-overcast.webp';
  if (code === 45 || code === 48) return 'assets/images/icon-fog.webp';
  // Drizzle
  if ([51, 53, 55, 56, 57].includes(code)) return 'assets/images/icon-drizzle.webp';
  // Rain
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'assets/images/icon-rain.webp';
  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'assets/images/icon-snow.webp';
  // Thunder / Storm
  if ([95, 96, 99].includes(code)) return 'assets/images/icon-storm.webp';
  // Fallback
  return 'assets/images/icon-overcast.webp';
}


async function renderForecast(forecastData, geoLocationData, searchQuery) {
  try {
    const current = forecastData.current || forecastData.current_weather || null;

    // DOM refs
    const locNameEl = document.querySelector('.loc-name');
    const todayDateEl = document.querySelector('.today-date');
    const dataUpdateEl = document.querySelector('.data-update');
    const dataImgContainer = document.querySelector('.data');

    const infoEls = document.querySelectorAll('.current-info > div');

    // Set location name
    const displayName = (geoLocationData && geoLocationData[0] && geoLocationData[0].name) || searchQuery || 'Unknown location';
    locNameEl.textContent = displayName;

    // Set date
    const now = new Date((current && current.time) ? current.time : Date.now());
    todayDateEl.textContent = now.toLocaleString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

    // Set hourly tab label to current weekday (if element exists)
    const hourlyDayEl = document.getElementById('hourly-day');
    if (hourlyDayEl) {
      try {
        hourlyDayEl.textContent = now.toLocaleDateString(undefined, { weekday: 'long' });
      } catch (e) {
        hourlyDayEl.textContent = new Date().toLocaleDateString(undefined, { weekday: 'long' });
      }
    }

    // Current temperature
    if (current && typeof current.temperature_2m !== 'undefined') {
      dataUpdateEl.textContent = `${Math.round(current.temperature_2m)}°`;
    } else if (current && typeof current.temperature !== 'undefined') {
      dataUpdateEl.textContent = `${Math.round(current.temperature)}°`;
    }

    // Ensure there's an img inside .data for icon
    let img = dataImgContainer.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      dataImgContainer.insertBefore(img, dataUpdateEl);
    }

    const curCode = (current && (current.weather_code ?? current.weathercode ?? current.weather)) ?? null;
    if (curCode !== null) img.src = mapWeatherCodeToIcon(Number(curCode));

    // Current info blocks: Feels Like, Humidity, Wind, Precipitation
    if (infoEls && infoEls.length >= 4) {
      // Feels like
      const feels = (current && (current.apparent_temperature ?? current.feels_like)) ?? '_ _';
      infoEls[0].querySelector('span').textContent = (feels !== '_ _') ? `${Math.round(feels)}°` : '_ _';
      // Humidity
      const hum = (current && (current.relative_humidity_2m ?? current.humidity)) ?? '_ _';
      infoEls[1].querySelector('span').textContent = (hum !== '_ _') ? `${hum}%` : '_ _';
      // Wind
      const wind = (current && (current.wind_speed_10m ?? current.wind_speed)) ?? '_ _';
      infoEls[2].querySelector('span').textContent = (wind !== '_ _') ? `${wind} km/h` : '_ _';
      // Precipitation
      const precip = (current && (current.precipitation ?? 0)) ?? '_ _';
      infoEls[3].querySelector('span').textContent = (precip !== '_ _') ? `${precip} mm` : '_ _';
    }

    // Daily forecast (first 7 days)
    const dailyEls = document.querySelectorAll('.daily .day1');
    const daily = forecastData.daily || null;
    if (daily && daily.time && daily.time.length) {
      dailyEls.forEach((dayEl, idx) => {
        const label = dayEl.querySelector('p');
        const imgEl = dayEl.querySelector('img') || document.createElement('img');
        const temps = dayEl.querySelectorAll('.d1 span');

        if (!dayEl.querySelector('img')) dayEl.insertBefore(imgEl, dayEl.querySelector('.d1'));

        const dayTime = daily.time[idx];
        if (dayTime) {
          const d = new Date(dayTime);
          label.textContent = d.toLocaleDateString(undefined, { weekday: 'short' });
        }

        const code = daily.weather_code && daily.weather_code[idx];
        if (typeof code !== 'undefined') imgEl.src = mapWeatherCodeToIcon(Number(code));

        const tMax = daily.temperature_2m_max && daily.temperature_2m_max[idx];
        const tMin = daily.temperature_2m_min && daily.temperature_2m_min[idx];
        if (temps && temps.length >= 2) {
          temps[0].textContent = (typeof tMax !== 'undefined') ? `${Math.round(tMax)}°` : '-°';
          temps[1].textContent = (typeof tMin !== 'undefined') ? `${Math.round(tMin)}°` : '-°';
        }
      });
    }

    // Hourly forecast (first N cards)
    const hourCards = document.querySelectorAll('.hrly .hour-card');
    const hourly = forecastData.hourly || null;
    if (hourly && hourly.time && hourly.time.length) {
      // find current index in hourly.time that matches current.time if available
      let startIdx = 0;
      if (current && current.time) {
        startIdx = hourly.time.findIndex(t => t.startsWith((current.time || '').slice(0, 13))) ;
        if (startIdx === -1) startIdx = 0;
      }

      hourCards.forEach((card, i) => {
        const idx = startIdx + i;
        const left = card.querySelector('.hour-left');
        const timeSpan = left.querySelector('span');
        const iconImg = left.querySelector('img') || document.createElement('img');
        const tempSpan = card.querySelector('.hour-temp');

        if (!left.querySelector('img')) left.insertBefore(iconImg, timeSpan);

        const t = hourly.time[idx];
        if (t) {
          const d = new Date(t);
          timeSpan.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const code = hourly.weather_code && hourly.weather_code[idx];
        if (typeof code !== 'undefined') iconImg.src = mapWeatherCodeToIcon(Number(code));

        const temp = hourly.temperature_2m && hourly.temperature_2m[idx];
        tempSpan.textContent = (typeof temp !== 'undefined') ? `${Math.round(temp)}°` : '_ _';
      });
    }

  } catch (err) {
    console.error('Error rendering forecast:', err);
  }
}

// Try to render using fetched forecast; if forecast fetch fails, attempt to use local `resp.json` as fallback
async function tryRenderForecast(forecastData, geoLocationData, searchQuery) {
  if (forecastData) {
    await renderForecast(forecastData, geoLocationData, searchQuery);
    return;
  }

  try {
    const resp = await fetch('resp.json');
    if (resp.ok) {
      const data = await resp.json();
      await renderForecast(data, geoLocationData, searchQuery);
    }
  } catch (err) {
    console.error('No forecast available and resp.json fallback failed', err);
  }
}

// Wire processLocation to render UI
async function processLocation(country) {
  try {
    let res = await getLocation(country);
    console.log("getting long and lat : ", res);
    let geoLocationData = res;

    if (!geoLocationData || !geoLocationData.length) {
      console.warn('No geolocation data; attempting to use fallback resp.json');
      await tryRenderForecast(null, null, country);
      return;
    }

    let longitude = geoLocationData[0].lon;
    let latitude = geoLocationData[0].lat;

    console.log("long : ", longitude);
    console.log("lat : ", latitude);

    let forecastData = null;
    try {
      forecastData = await getForecast(latitude, longitude);
    } catch (err) {
      console.error('Forecast fetch failed, will try local fallback', err);
    }

    await tryRenderForecast(forecastData, geoLocationData, country);
  } catch (error) {
    console.error("Error processing location data:", error);
    // final fallback
    await tryRenderForecast(null, null, country);
  }
}
