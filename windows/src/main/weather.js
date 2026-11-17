'use strict';
// Weather via Open-Meteo (free, no API key). Uses Electron's net.fetch so system proxy/VPN settings apply.
const { net } = require('electron');
const { EventEmitter } = require('events');

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

async function getJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await net.fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function searchCity(query, lang = 'en') {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const url = `${GEO}?name=${encodeURIComponent(q)}&count=8&language=${encodeURIComponent(lang)}&format=json`;
  const j = await getJson(url);
  return (j.results || []).map((r) => ({
    name: r.name, country: r.country || '', admin1: r.admin1 || '', lat: r.latitude, lon: r.longitude,
    tz: r.timezone || 'auto', code: r.country_code || '',
  }));
}

class Weather extends EventEmitter {
  constructor(log) {
    super();
    this.log = log || (() => {});
    this.city = null;
    this.unit = 'c';
    this.data = null;
    this.timer = null;
    this.generation = 0;
  }

  configure({ city, unit, enabled }) {
    const changed = JSON.stringify(city) !== JSON.stringify(this.city) || unit !== this.unit || enabled !== this.enabled;
    this.city = city || null;
    this.unit = unit === 'f' ? 'f' : 'c';
    this.enabled = enabled !== false;
    if (changed) {
      this.data = null;
      this.refresh();
    }
  }

  schedule(ms) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.refresh(), ms);
  }

  async refresh() {
    const generation = ++this.generation;
    clearTimeout(this.timer);
    if (!this.enabled || !this.city) {
      this.data = null;
      this.emit('update', null);
      return;
    }
    const c = this.city;
    const unit = this.unit;
    const params = [
      `latitude=${c.lat}`, `longitude=${c.lon}`,
      'current=temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m',
      'hourly=temperature_2m,weather_code,is_day',
      'daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
      'timezone=auto', 'forecast_days=6', 'wind_speed_unit=kmh',
      `temperature_unit=${unit === 'f' ? 'fahrenheit' : 'celsius'}`,
    ].join('&');
    try {
      const j = await getJson(`${FORECAST}?${params}`);
      if (generation !== this.generation) return;
      const cur = j.current || {};
      const nowIso = cur.time;
      const hourly = [];
      if (j.hourly && j.hourly.time) {
        let start = j.hourly.time.findIndex((t) => t >= (nowIso || '').slice(0, 13));
        if (start < 0) start = 0;
        for (let i = start; i < Math.min(j.hourly.time.length, start + 12); i++) {
          hourly.push({ time: j.hourly.time[i], temp: j.hourly.temperature_2m[i], code: j.hourly.weather_code[i], isDay: !!j.hourly.is_day[i] });
        }
      }
      const daily = [];
      if (j.daily && j.daily.time) {
        for (let i = 0; i < j.daily.time.length; i++) {
          daily.push({
            date: j.daily.time[i], code: j.daily.weather_code[i], max: j.daily.temperature_2m_max[i], min: j.daily.temperature_2m_min[i],
            pop: j.daily.precipitation_probability_max ? j.daily.precipitation_probability_max[i] : null,
            sunrise: j.daily.sunrise ? j.daily.sunrise[i] : null, sunset: j.daily.sunset ? j.daily.sunset[i] : null,
          });
        }
      }
      this.data = {
        city: c.name, country: c.country, unit, updatedAt: Date.now(), utcOffset: j.utc_offset_seconds || 0,
        current: {
          temp: cur.temperature_2m, feels: cur.apparent_temperature, humidity: cur.relative_humidity_2m,
          wind: cur.wind_speed_10m, code: cur.weather_code, isDay: !!cur.is_day,
        },
        hourly, daily,
      };
      this.emit('update', this.data);
      this.emit('status', { ok: true, detail: `${c.name}` });
      this.schedule(20 * 60 * 1000);
    } catch (e) {
      if (generation !== this.generation) return;
      this.log(`weather failed: ${e.message}`);
      this.emit('status', { ok: false, detail: e.message });
      if (!this.data) this.emit('update', { error: true, city: c.name });
      this.schedule(3 * 60 * 1000);
    }
  }
}

module.exports = { Weather, searchCity };
