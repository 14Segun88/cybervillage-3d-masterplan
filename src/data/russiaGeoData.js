import * as d3geo from 'd3-geo';

// Официальные географические контуры РФ из Natural Earth 50m
import russia50mData from './russia_50m.json';
// Все 83+ региона и субъекта РФ с их внутренними административными границами
import russiaRegionsData from './russia_all_regions.json';

export const RUSSIA_GEOJSON = russia50mData;
export const RUSSIA_REGIONS_GEOJSON = russiaRegionsData;

// Стандартная коническая проекция Альберса для карт Российской Федерации
export const RUSSIA_PROJECTION_CONFIG = {
  rotate: [-100, 0],
  center: [0, 60],
  parallels: [52, 64],
  scale: 2100,
  canvasWidth: 4096,
  canvasHeight: 2048,
  planeWidth: 240,
  planeHeight: 120
};

// Экземпляр проектора D3-Geo для сверхчеткого 4096x2048 канваса карты РФ
export const d3Projection = d3geo.geoAlbers()
  .rotate(RUSSIA_PROJECTION_CONFIG.rotate)
  .center(RUSSIA_PROJECTION_CONFIG.center)
  .parallels(RUSSIA_PROJECTION_CONFIG.parallels)
  .scale(RUSSIA_PROJECTION_CONFIG.scale)
  .translate([RUSSIA_PROJECTION_CONFIG.canvasWidth / 2, RUSSIA_PROJECTION_CONFIG.canvasHeight / 2]);

/**
 * Проекция долготы и широты в 3D координаты Three.js сцены
 * 100% точное геометрическое совпадение с текстурой и PlaneGeometry(240, 120)
 */
export function projectGeo(lon, lat, scale = 1.0, height = 0) {
  const p = d3Projection([lon, lat]);
  if (!p) return { x: 0, y: height, z: 0 };
  const x = ((p[0] - RUSSIA_PROJECTION_CONFIG.canvasWidth / 2) / RUSSIA_PROJECTION_CONFIG.canvasWidth) * RUSSIA_PROJECTION_CONFIG.planeWidth * scale;
  const z = ((p[1] - RUSSIA_PROJECTION_CONFIG.canvasHeight / 2) / RUSSIA_PROJECTION_CONFIG.canvasHeight) * RUSSIA_PROJECTION_CONFIG.planeHeight * scale;
  return { x, y: height, z };
}

/**
 * Проекция долготы и широты в сферические 3D координаты Глобуса
 */
export function projectGlobe(lon, lat, radius = 50, height = 0) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = radius + height;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);

  return { x, y, z };
}

// Крупнейшие реки и водные артерии России (для аутентичной гидрографии)
export const RUSSIA_MAJOR_RIVERS = [
  {
    name: "Волга",
    points: [
      [32.47, 56.97], [35.92, 56.85], [37.62, 56.75], [38.83, 57.63], [41.00, 57.77],
      [44.00, 56.32], [47.25, 56.13], [49.12, 55.79], [49.00, 54.30], [48.50, 53.20],
      [46.00, 51.53], [44.50, 48.70], [48.05, 46.35]
    ]
  },
  {
    name: "Дон",
    points: [
      [38.25, 54.00], [39.00, 52.60], [39.20, 51.67], [41.00, 49.50], [43.50, 48.80],
      [41.50, 47.50], [39.71, 47.23]
    ]
  },
  {
    name: "Обь и Иртыш",
    points: [
      [85.00, 52.40], [83.75, 53.35], [82.93, 55.00], [84.95, 56.50], [77.00, 60.50],
      [73.50, 61.25], [69.00, 61.00], [65.50, 64.00], [66.60, 66.50]
    ]
  },
  {
    name: "Енисей",
    points: [
      [94.45, 51.72], [91.45, 53.72], [92.87, 56.01], [93.20, 58.50], [89.50, 61.50],
      [86.30, 66.00], [86.15, 69.40]
    ]
  },
  {
    name: "Лена",
    points: [
      [106.85, 53.95], [105.70, 56.80], [108.30, 58.30], [115.00, 60.00], [120.40, 60.40],
      [129.70, 62.00], [127.50, 64.00], [124.00, 67.00], [127.00, 72.00]
    ]
  },
  {
    name: "Амур",
    points: [
      [121.50, 53.30], [124.00, 53.00], [127.50, 50.25], [132.00, 48.00], [135.07, 48.48],
      [137.00, 50.50], [140.70, 53.15]
    ]
  }
];

// Крупнейшие озера и моря (Байкал, Ладога, Онега)
export const RUSSIA_MAJOR_LAKES = [
  {
    name: "Озеро Байкал",
    coords: [
      [103.7, 51.7], [104.3, 52.0], [105.5, 52.5], [107.0, 53.2], [108.5, 54.5],
      [109.5, 55.5], [108.0, 55.0], [106.5, 53.8], [104.8, 52.8], [103.7, 51.7]
    ]
  },
  {
    name: "Ладожское озеро",
    coords: [
      [30.8, 60.0], [31.5, 60.1], [32.5, 60.5], [32.0, 61.3], [31.0, 61.5],
      [30.0, 61.0], [30.8, 60.0]
    ]
  },
  {
    name: "Онежское озеро",
    coords: [
      [34.5, 61.0], [36.0, 61.2], [36.0, 62.0], [35.0, 62.8], [34.3, 62.2],
      [34.5, 61.0]
    ]
  }
];

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
