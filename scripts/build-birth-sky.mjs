// Precompute the real sky over Chiang Rai on 13 Jan 2011 (Khao Hom's birthday) into a compact JSON.
// Stars + constellation lines: d3-celestial (BSD-3, Olaf Frohn). Moon/planets: astronomy-engine (MIT).
import fs from 'node:fs';
import path from 'node:path';
import * as A from 'astronomy-engine';

const [dataDir, outFile] = process.argv.slice(2);
const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
const stars = read('stars.6.json');
const lines = read('constellations.lines.json');
const names = read('starnames.json');

const LAT = 19.9105, LON = 99.8406; // Chiang Rai city
const START = new Date('2011-01-13T11:00:00Z'); // 18:00 ICT
const HOURS = 13; // 18:00 → 06:00 next morning

const r = (n, d = 3) => Number(n.toFixed(d));
const toRa = (lon) => (lon < 0 ? lon + 360 : lon);

const starRows = [];
const starIds = [];
for (const f of stars.features) {
  const { mag, bv } = f.properties;
  if (mag > 6.0) continue;
  const [lon, dec] = f.geometry.coordinates;
  starRows.push(r(toRa(lon), 3), r(dec, 3), r(mag, 2), r(Number(bv) || 0.6, 2));
  starIds.push(f.id);
}

const named = [];
for (const f of stars.features) {
  const n = names[f.id];
  if (!n || !n.name || f.properties.mag > 2.2) continue;
  const [lon, dec] = f.geometry.coordinates;
  named.push({ name: n.name, ra: r(toRa(lon)), dec: r(dec), mag: f.properties.mag });
}

const constellationLines = lines.features.map((f) => ({
  id: f.id,
  lines: f.geometry.coordinates.map((seg) => seg.map(([lon, dec]) => [r(toRa(lon), 2), r(dec, 2)]))
}));

const observer = new A.Observer(LAT, LON, 400);
const bodies = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
const hourly = [];
for (let h = 0; h < HOURS; h++) {
  const t = new Date(START.getTime() + h * 3600e3);
  const moonEq = A.Equator('Moon', t, observer, true, true);
  const ill = A.Illumination('Moon', t);
  const planets = bodies.map((b) => {
    const eq = A.Equator(b, t, observer, true, true);
    return { id: b, ra: r(eq.ra * 15), dec: r(eq.dec), mag: r(A.Illumination(b, t).mag, 1) };
  });
  const sunEq = A.Equator('Sun', t, observer, true, true);
  hourly.push({ sun: { ra: r(sunEq.ra * 15), dec: r(sunEq.dec) }, moon: { ra: r(moonEq.ra * 15), dec: r(moonEq.dec), frac: r(ill.phase_fraction), angle: r(ill.phase_angle, 1) }, planets });
}

const out = {
  credit: 'Stars & constellation lines: d3-celestial (Olaf Frohn, BSD-3) from the Hipparcos/HYG catalogue. Moon & planets: astronomy-engine (Don Cross, MIT).',
  site: { lat: LAT, lon: LON, name: 'เชียงราย' },
  startUtc: START.toISOString(),
  hours: HOURS,
  stars: starRows,
  named,
  constellations: constellationLines,
  hourly
};
fs.writeFileSync(outFile, JSON.stringify(out));
console.log('stars', starRows.length / 4, 'named', named.length, 'bytes', fs.statSync(outFile).size);

// Report: what is high overhead at 20:00 ICT
const t20 = new Date('2011-01-13T13:00:00Z');
const report = [];
for (const s of named) {
  const hor = A.Horizon(t20, observer, s.ra / 15, s.dec, null);
  report.push([s.name, r(hor.altitude, 1), r(hor.azimuth, 0), s.mag]);
}
report.sort((a, b) => b[1] - a[1]);
console.log(report.slice(0, 3));
const pl = A.Horizon(t20, observer, 56.87/15, 24.12, null); console.log('Pleiades', r(pl.altitude,1), r(pl.azimuth,0));
const m = hourly[2].moon; const mh = A.Horizon(t20, observer, m.ra / 15, m.dec, null);
console.log('moon 20:00', r(mh.altitude, 1), r(mh.azimuth, 0), 'frac', m.frac);
for (const p of hourly[2].planets) { const ph = A.Horizon(t20, observer, p.ra / 15, p.dec, null); console.log(p.id, r(ph.altitude, 1), r(ph.azimuth, 0), p.mag); }
