// World-clock cities shared by the island dashboard and the settings window.
export const CITY = {
  'Europe/London': 'London', 'Europe/Paris': 'Paris', 'Europe/Berlin': 'Berlin', 'Europe/Madrid': 'Madrid',
  'Europe/Istanbul': 'Istanbul', 'Europe/Moscow': 'Moscow', 'America/New_York': 'New York', 'America/Los_Angeles': 'Los Angeles',
  'America/Toronto': 'Toronto', 'America/Sao_Paulo': 'São Paulo', 'Asia/Dubai': 'Dubai', 'Asia/Riyadh': 'Riyadh',
  'Asia/Kolkata': 'Delhi', 'Asia/Singapore': 'Singapore', 'Asia/Shanghai': 'Beijing', 'Asia/Tokyo': 'Tokyo',
  'Australia/Sydney': 'Sydney',
};
export const CLOCK_ZONES = Object.keys(CITY);
// eslint-disable-next-line no-unused-vars
export function cityName(tz, lang) { return CITY[tz] || tz.split('/').pop().replace(/_/g, ' '); }
