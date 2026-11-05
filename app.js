console.log("App geladen");

// ===== Fixer Standort: Zürich HB =====
const LAT = 47.3779;
const LON = 8.5403;


// ===== Feature 1: Zufälliges Katzenbild =====
const catBtn = document.getElementById("cat-btn");
const catOutput = document.getElementById("cat-output");

catBtn.addEventListener("click", async () => {
  catOutput.textContent = "Lädt...";
  try {
    const response = await fetch("https://api.thecatapi.com/v1/images/search");
    const data = await response.json();
    catOutput.innerHTML = `<img src="${data[0].url}" alt="Zufällige Katze" class="img-fluid">`;
  } catch (error) {
    catOutput.textContent = "Fehler beim Laden 😿";
    console.error(error);
  }
});


// ===== Feature 2: Bitcoin-Preis =====
const btcBtn = document.getElementById("btc-btn");
const btcOutput = document.getElementById("btc-output");

btcBtn.addEventListener("click", async () => {
  btcOutput.innerHTML = `<li class="list-group-item">Lädt...</li>`;
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,chf");
    const data = await response.json();

    btcOutput.innerHTML = `
      <li class="list-group-item d-flex justify-content-between">
        USD <span class="fw-bold">${formatCurrency(data.bitcoin.usd, "USD")}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        CHF <span class="fw-bold">${formatCurrency(data.bitcoin.chf, "CHF")}</span>
      </li>`;
  } catch (error) {
    btcOutput.innerHTML = `<li class="list-group-item">Fehler beim Laden 😿</li>`;
    console.error(error);
  }
});

function formatCurrency(value, currency) {
  return value.toLocaleString("de-CH", { style: "currency", currency: currency });
}


// ===== Feature 3: Aktuelles Wetter =====
const weatherBtn = document.getElementById("weather-btn");
const weatherOutput = document.getElementById("weather-output");

weatherBtn.addEventListener("click", async () => {
  weatherOutput.innerHTML = `<li class="list-group-item">Lädt...</li>`;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,wind_speed_10m,weather_code`;
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current;

    weatherOutput.innerHTML = `
      <li class="list-group-item d-flex justify-content-between">
        Wetter <span class="fw-bold">${weatherText(current.weather_code)}</span>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        Temperatur <span class="fw-bold">${current.temperature_2m} °C</span>
      </li>
      <li class="list-group-item d-flex justify-content-between">
        Wind <span class="fw-bold">${current.wind_speed_10m} km/h</span>
      </li>`;
  } catch (error) {
    weatherOutput.innerHTML = `<li class="list-group-item">Fehler beim Laden 😿</li>`;
    console.error(error);
  }
});

// Wettercode (Zahl) in Text umwandeln
function weatherText(code) {
  if (code === 0) return "☀️ Klar";
  if (code <= 3) return "⛅ Bewölkt";
  if (code === 45 || code === 48) return "🌫️ Nebel";
  if (code >= 51 && code <= 67) return "🌧️ Regen";
  if (code >= 71 && code <= 77) return "❄️ Schnee";
  if (code >= 80 && code <= 82) return "🌦️ Schauer";
  if (code >= 95) return "⛈️ Gewitter";
  return "🌡️ Unbekannt";
}


// ===== Feature 4: 5 nächste E-Tankstellen =====
const evBtn = document.getElementById("ev-btn");
const evOutput = document.getElementById("ev-output");

evBtn.addEventListener("click", async () => {
  evOutput.innerHTML = `<li class="list-group-item">Lädt... (kann ein paar Sekunden dauern)</li>`;
  try {
    // Alle Ladestationen im Umkreis von 3 km suchen
    const query = `[out:json];nwr(around:3000,${LAT},${LON})[amenity=charging_station];out center;`;
    const response = await fetch("https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query));
    const data = await response.json();

    // Name und Distanz berechnen, nach Distanz sortieren, die 5 nächsten nehmen
    const stations = data.elements
      .map(el => {
        const lat = el.lat ?? el.center.lat;
        const lon = el.lon ?? el.center.lon;
        return {
          name: el.tags.name || el.tags.operator || "Ladestation",
          distance: getDistance(LAT, LON, lat, lon)
        };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    if (stations.length === 0) {
      evOutput.innerHTML = `<li class="list-group-item">Keine Ladestationen gefunden</li>`;
      return;
    }

    evOutput.innerHTML = stations
      .map(s => `
        <li class="list-group-item d-flex justify-content-between">
          ${s.name} <span class="badge rounded-pill text-bg-light">${formatDistance(s.distance)}</span>
        </li>`)
      .join("");
  } catch (error) {
    evOutput.innerHTML = `<li class="list-group-item">Fehler beim Laden 😿</li>`;
    console.error(error);
  }
});

// Distanz zwischen zwei Koordinaten in Metern (Haversine-Formel)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Erdradius in Metern
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}


// ===== Feature 5: Karte =====
const mapBtn = document.getElementById("map-btn");
const mapOutput = document.getElementById("map-output");

mapBtn.addEventListener("click", () => {
  const d = 0.01; // Kartenausschnitt: ca. 1 km in jede Richtung
  const bbox = `${LON - d},${LAT - d},${LON + d},${LAT + d}`;
  mapOutput.innerHTML = `
    <iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${LAT},${LON}"
      class="map-frame"
      title="Karte Zürich HB">
    </iframe>`;
});