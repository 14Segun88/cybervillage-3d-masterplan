import fs from 'fs';
import * as d3geo from 'd3-geo';

const russia = JSON.parse(fs.readFileSync('src/data/russia_50m.json', 'utf-8'));

// Albers conic projection specifically calibrated for standard maps of the Russian Federation
const projection = d3geo.geoAlbers()
  .rotate([-100, 0])
  .center([0, 65])
  .parallels([52, 64])
  .scale(150)
  .translate([0, 0]);

export function project(lon, lat) {
  const p = projection([lon, lat]);
  if (!p) return null;
  return { x: +p[0].toFixed(3), z: +p[1].toFixed(3) };
}

const projectedPolygons = [];
let totalPoints = 0;

russia.geometry.coordinates.forEach((poly) => {
  const projectedRings = [];
  poly.forEach((ring) => {
    const projectedPts = [];
    ring.forEach(([lon, lat]) => {
      const pt = project(lon, lat);
      if (pt && !isNaN(pt.x) && !isNaN(pt.z)) {
        projectedPts.push([pt.x, pt.z]);
      }
    });
    if (projectedPts.length >= 3) {
      projectedRings.push(projectedPts);
      totalPoints += projectedPts.length;
    }
  });
  if (projectedRings.length > 0) {
    projectedPolygons.push(projectedRings);
  }
});

console.log(`Successfully projected ${projectedPolygons.length} polygons with ${totalPoints} vertices!`);

const outputData = `/**
 * Автоматически сгенерированные точные полигоны границ и островов РФ
 * на базе Natural Earth 1:50m и Conic Albers Projection.
 */
import * as d3geo from 'd3-geo';

const projection = d3geo.geoAlbers()
  .rotate([-100, 0])
  .center([0, 65])
  .parallels([52, 64])
  .scale(150)
  .translate([0, 0]);

export function projectGeo(lon, lat, scale = 1.0, height = 0) {
  const p = projection([lon, lat]);
  if (!p) return { x: 0, y: height, z: 0 };
  return { x: p[0] * scale, y: height, z: p[1] * scale };
}

export const RUSSIA_DETAILED_POLYGONS = ${JSON.stringify(projectedPolygons)};

export const ENERGY_AND_LOGISTICS_HIGHWAYS = [
  {
    name: "Транссибирский энергетический коридор СКД & Электрохабы",
    color: "#00f0ff",
    points: [
      [37.62, 55.75], // Москва
      [44.00, 56.32], // Нижний Новгород
      [49.12, 55.79], // Казань
      [60.60, 56.84], // Екатеринбург
      [73.37, 54.99], // Омск
      [82.93, 55.00], // Новосибирск
      [86.08, 55.35], // Кемерово
      [92.87, 56.01], // Красноярск
      [104.30, 52.28], // Иркутск
      [135.07, 48.48], // Хабаровск
      [131.88, 43.11]  // Владивосток
    ]
  },
  {
    name: "Магистраль Кибердеревня: Серпухов — Москва — СПб",
    color: "#ffb700",
    points: [
      [37.41, 54.91], // Серпухов
      [37.62, 55.75], // Москва
      [31.27, 58.52], // Великий Новгород
      [30.33, 59.93]  // Санкт-Петербург
    ]
  },
  {
    name: "Южная ветка зеленой энергии: Москва — Черноморье",
    color: "#00ff9d",
    points: [
      [37.62, 55.75], // Москва
      [39.20, 51.67], // Воронеж
      [39.71, 47.23], // Ростов-на-Дону
      [39.72, 43.60]  // Сочи
    ]
  },
  {
    name: "Коридор энергогенерации: Кузбасс — Урал",
    color: "#ff5500",
    points: [
      [86.08, 55.35], // Кемерово
      [76.55, 59.05], // Нижневартовск
      [65.53, 57.15], // Тюмень
      [60.60, 56.84]  // Екатеринбург
    ]
  },
  {
    name: "Северный логистический путь СКД поставок",
    color: "#7b61ff",
    points: [
      [33.08, 68.97], // Мурманск
      [71.50, 71.27], // Сабетта
      [128.87, 71.63], // Тикси
      [170.25, 69.70], // Певек
      [131.88, 43.11]  // Владивосток
    ]
  }
];
`;

fs.writeFileSync('src/data/russiaGeoData.js', outputData, 'utf-8');
console.log('Successfully wrote src/data/russiaGeoData.js!');
