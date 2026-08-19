import * as THREE from 'three';

/**
 * Высококачественный генератор четких PBR-текстур в аутентичной Lego-стилистике
 */
class TextureGenerator {
  constructor() {
    this.cache = new Map();
    this.maxAnisotropy = 16;
  }

  setRenderer(renderer) {
    if (renderer && renderer.capabilities) {
      this.maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    }
  }

  _setupTexture(texture, repeatX = 1, repeatY = 1) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = this.maxAnisotropy;
    return texture;
  }

  // 1. Аутентичная пластина Lego Baseplate с четкими 3D-шипами (Studs)
  getLegoBaseplateTexture(baseColor = '#10b981', studColor = '#059669', rimHighlight = '#34d399') {
    const key = `lego_base_${baseColor}_${studColor}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Базовый гладкий ABS-пластик
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 1024, 1024);

    // Сетка 16x16 круглых Lego-шипов (Studs)
    const gridSize = 16;
    const step = 1024 / gridSize;
    const radius = step * 0.28;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gy = 0; gy < gridSize; gy++) {
        const cx = gx * step + step / 2;
        const cy = gy * step + step / 2;

        // 1. Мягкая тень от шипа
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.arc(cx + 2.5, cy + 3.5, radius + 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 2. Тело шипа (радиальный градиент объема)
        const radGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
        radGrad.addColorStop(0, rimHighlight);
        radGrad.addColorStop(0.6, studColor);
        radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Верхняя плоская грань шипа
        ctx.fillStyle = studColor;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // 4. Тонкое внутреннее кольцо (логотип Lego)
        ctx.strokeStyle = rimHighlight;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
        ctx.stroke();

        // 5. Верхний белый блик
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx - 1, cy - 1, radius * 0.75, Math.PI * 1.1, Math.PI * 1.6);
        ctx.stroke();
      }
    }

    const texture = this._setupTexture(new THREE.CanvasTexture(canvas), 6, 6);
    this.cache.set(key, texture);
    return texture;
  }

  // 2. Аутентичные дорожные плиты Lego Road Plates (гладкий асфальт + разметка + боковые шипы)
  getAsphaltTexture() {
    if (this.cache.has('lego_road_plate')) return this.cache.get('lego_road_plate');

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Темный гладкий ABS-пластик дороги
    ctx.fillStyle = '#1e2530';
    ctx.fillRect(0, 0, 1024, 1024);

    // Дорожная проезжая часть
    ctx.fillStyle = '#263040';
    ctx.fillRect(128, 0, 768, 1024);

    // 2 ряда Lego-шипов по бокам дороги (обочины)
    const drawStudColumn = (startX) => {
      const step = 64;
      const radius = 18;
      for (let y = step / 2; y < 1024; y += step) {
        for (let col = 0; col < 2; col++) {
          const cx = startX + col * step + step / 2;
          const cy = y;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath(); ctx.arc(cx + 2, cy + 2, radius + 1, 0, Math.PI * 2); ctx.fill();

          const g = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, radius);
          g.addColorStop(0, '#64748b');
          g.addColorStop(0.7, '#334155');
          g.addColorStop(1, '#0f172a');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(cx - 1, cy - 1, radius * 0.7, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
        }
      }
    };
    drawStudColumn(0);
    drawStudColumn(896);

    // Боковые желтые полосы Lego
    ctx.fillStyle = '#facc15';
    ctx.fillRect(134, 0, 14, 1024);
    ctx.fillRect(876, 0, 14, 1024);

    // Центральная прерывистая разметка Lego (белые плитки)
    ctx.fillStyle = '#f8fafc';
    for (let y = 32; y < 1024; y += 128) {
      ctx.fillRect(504, y, 16, 72);
    }

    // Пешеходный переход Lego
    for (let z = 0; z < 8; z++) {
      ctx.fillRect(180 + z * 88, 40, 56, 120);
      ctx.fillRect(180 + z * 88, 864, 56, 120);
    }

    const texture = this._setupTexture(new THREE.CanvasTexture(canvas), 1, 1);
    this.cache.set('lego_road_plate', texture);
    return texture;
  }

  // 3. Тротуарные плиты Lego с квадратной сеткой и шипами
  getPavementTexture() {
    if (this.cache.has('lego_pavement_tiles')) return this.cache.get('lego_pavement_tiles');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 512, 512);

    const size = 64;
    for (let x = 0; x < 512; x += size) {
      for (let y = 0; y < 512; y += size) {
        ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#475569' : '#3e4c5e';
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

        // Центральный Lego-шип на каждой плитке
        const cx = x + size / 2;
        const cy = y + size / 2;
        const radius = 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath(); ctx.arc(cx + 1.5, cy + 2, radius + 1, 0, Math.PI * 2); ctx.fill();

        const g = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, radius);
        g.addColorStop(0, '#94a3b8');
        g.addColorStop(0.7, '#64748b');
        g.addColorStop(1, '#1e293b');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
      }
    }

    const texture = this._setupTexture(new THREE.CanvasTexture(canvas), 8, 8);
    this.cache.set('lego_pavement_tiles', texture);
    return texture;
  }

  // 4. Зеленый газон в Lego-стиле
  getGrassTexture() {
    return this.getLegoBaseplateTexture('#15803d', '#166534', '#22c55e');
  }

  // 5. Фасад здания из Lego-кирпичиков с витражными светящимися окнами
  getBuildingFacadeTexture(rows = 6, cols = 8) {
    const key = `lego_facade_hd_${rows}_${cols}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Базовый Lego-блок графитово-синего цвета
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 1024);

    const cellW = 1024 / cols;
    const cellH = 1024 / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;
        const y = r * cellH;

        // Lego-рамка кирпичика (объемные фаски)
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);

        // Оконный проем
        const isLit = (r + c) % 3 === 0 || (r * c) % 5 === 0;
        if (isLit) {
          const warm = (r + c) % 2 === 0;
          ctx.fillStyle = warm ? '#fbbf24' : '#38bdf8';
          ctx.fillRect(x + 8, y + 8, cellW - 16, cellH - 16);

          // Внутренний блик
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(x + 10, y + 10, (cellW - 20) * 0.4, cellH - 20);
        } else {
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(x + 8, y + 8, cellW - 16, cellH - 16);
          ctx.fillStyle = '#082f49';
          ctx.fillRect(x + 10, y + 10, cellW - 20, cellH - 20);
        }
      }
    }

    const texture = this._setupTexture(new THREE.CanvasTexture(canvas), 1, 1);
    this.cache.set(key, texture);
    return texture;
  }

  // 6. Солнечные фотоэлектрические Lego-панели (Solar Blue Tiles)
  getSolarPanelTexture() {
    if (this.cache.has('lego_solar_panel')) return this.cache.get('lego_solar_panel');

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Глубокий синий глянец кремниевых пластин
    ctx.fillStyle = '#031c38';
    ctx.fillRect(0, 0, 1024, 1024);

    const size = 128;
    for (let x = 0; x < 1024; x += size) {
      for (let y = 0; y < 1024; y += size) {
        // Фотоэлемент
        const g = ctx.createLinearGradient(x, y, x + size, y + size);
        g.addColorStop(0, '#0369a1');
        g.addColorStop(0.5, '#0284c7');
        g.addColorStop(1, '#075985');
        ctx.fillStyle = g;
        ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

        // Серебристые шины токосъема
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + size * 0.33, y + 4); ctx.lineTo(x + size * 0.33, y + size - 4);
        ctx.moveTo(x + size * 0.66, y + 4); ctx.lineTo(x + size * 0.66, y + size - 4);
        ctx.stroke();

        // Сетка микро-проводников
        ctx.strokeStyle = 'rgba(224, 242, 254, 0.3)';
        ctx.lineWidth = 1;
        for (let my = y + 16; my < y + size - 4; my += 16) {
          ctx.beginPath(); ctx.moveTo(x + 4, my); ctx.lineTo(x + size - 4, my); ctx.stroke();
        }
      }
    }

    const texture = this._setupTexture(new THREE.CanvasTexture(canvas), 4, 4);
    this.cache.set('lego_solar_panel', texture);
    return texture;
  }

  // 7. Профнастил и сэндвич-панели завода в Lego-стиле
  getCorrugatedMetalTexture() {
    if (this.cache.has('lego_corrugated_metal')) return this.cache.get('lego_corrugated_metal');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const stripeW = 32;
    for (let x = 0; x < 512; x += stripeW) {
      const grad = ctx.createLinearGradient(x, 0, x + stripeW, 0);
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.35, '#38bdf8');
      grad.addColorStop(0.7, '#0284c7');
      grad.addColorStop(1, '#0369a1');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, stripeW, 512);

      // Продольная тень и блик ребра
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + stripeW * 0.35, 0, 2, 512);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(x + stripeW - 2, 0, 2, 512);
    }

    const texture = this._setupTexture(new THREE.CanvasTexture(canvas), 4, 2);
    this.cache.set('lego_corrugated_metal', texture);
    return texture;
  }

  // 7. Светящаяся неоновая вывеска высокого разрешения
  createSignTexture(text, subtext = '', bgColor = '#050c18', textColor = '#00f0ff') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 1024, 256);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 10;
    ctx.shadowColor = textColor;
    ctx.shadowBlur = 20;
    ctx.strokeRect(14, 14, 996, 228);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 56px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = textColor;
    ctx.shadowBlur = 26;
    ctx.fillText(text, 512, subtext ? 95 : 128);

    if (subtext) {
      ctx.fillStyle = textColor;
      ctx.font = '700 32px "Inter", sans-serif';
      ctx.shadowBlur = 14;
      ctx.fillText(subtext, 512, 175);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // 8. Лего-текстура кирпичиков для башни масштабирования (2 000 000 авто)
  getLegoBrickTexture(color = '#ef4444') {
    const key = `lego_brick_${color}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 256, 256);

    // 4 круглых штырька (Lego studs)
    const studs = [
      [64, 64], [192, 64],
      [64, 192], [192, 192]
    ];

    studs.forEach(([cx, cy]) => {
      // Тень штырька
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 4, 34, 0, Math.PI * 2);
      ctx.fill();

      // Верх штырька
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();

      // Блик
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx - 4, cy - 4, 24, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    this.cache.set(key, texture);
    return texture;
  }

  // 9. Гидропоника для интерьера теплиц (Ряды зелени под фитолампами)
  getHydroponicsTexture() {
    if (this.cache.has('hydroponics_glow')) return this.cache.get('hydroponics_glow');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#062814';
    ctx.fillRect(0, 0, 512, 512);

    // 8 рядов лотков с зеленью
    for (let r = 0; r < 8; r++) {
      const y = r * 64 + 8;
      // Лоток
      ctx.fillStyle = '#1e3a24';
      ctx.fillRect(10, y, 492, 48);

      // Растения с фито-подсветкой
      for (let c = 0; c < 16; c++) {
        const x = c * 30 + 20;
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(x, y + 24, 10 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();

        // Розово-фиолетовый фитосвет
        ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
        ctx.beginPath();
        ctx.arc(x, y + 24, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('hydroponics_glow', texture);
    return texture;
  }

  // 10. Плита зарядного навеса со световыми индикаторами
  getChargingStationFloorTexture() {
    if (this.cache.has('charging_floor')) return this.cache.get('charging_floor');

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 512);

    // 6 парковочных мест с синей светящейся разметкой EV
    for (let i = 0; i < 6; i++) {
      const x = i * 82 + 10;
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(x, 20, 68, 472);

      // Символ электромобиля "⚡ EV"
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ EV', x + 34, 260);
      ctx.fillText(`240kW`, x + 34, 290);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('charging_floor', texture);
    return texture;
  }
}

export const textureGen = new TextureGenerator();

