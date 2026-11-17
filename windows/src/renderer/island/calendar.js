// Month-grid helpers for the planner tab (Gregorian calendar).

export function isoOf(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
export function dateOfIso(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12);
}
export function isoFromGregorian(gy, gm, gd) { return isoOf(new Date(gy, gm - 1, gd, 12)); }

// A month as a grid of weeks; ym is {y, m}.
// weekStart: 6 = Saturday, 1 = Monday, 0 = Sunday (JS getDay numbering).
export function monthGrid(ym, weekStart) {
  const first = new Date(ym.y, ym.m - 1, 1, 12);
  const days = new Date(ym.y, ym.m, 0).getDate();
  const lead = (first.getDay() - weekStart + 7) % 7;
  const cells = [];
  const start = new Date(first.getTime() - lead * 86400000);
  const total = Math.ceil((lead + days) / 7) * 7;
  for (let i = 0; i < total; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12);
    const inMonth = d.getFullYear() === ym.y && d.getMonth() + 1 === ym.m;
    cells.push({ iso: isoOf(d), g: d.getDate(), gm: d.getMonth() + 1, inMonth, dow: d.getDay() });
  }
  return cells;
}

export function currentYm(date = new Date()) {
  return { y: date.getFullYear(), m: date.getMonth() + 1 };
}

export function shiftYm(ym, delta) {
  let m = ym.m + delta;
  let y = ym.y;
  while (m < 1) { m += 12; y -= 1; }
  while (m > 12) { m -= 12; y += 1; }
  return { y, m };
}

export function ymOfIso(iso) { return currentYm(dateOfIso(iso)); }
