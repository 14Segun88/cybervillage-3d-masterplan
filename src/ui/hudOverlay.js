import { soundFx } from '../audio/soundFx.js';
import { CITIES_DATA } from '../data/citiesData.js';

export class HudOverlay {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.onSelectCity = options.onSelectCity || null;
    this.onToggleAutoRotate = options.onToggleAutoRotate || null;
    this.onResetCamera = options.onResetCamera || null;
    this.onViewTop = options.onViewTop || null;
    this.onViewIso = options.onViewIso || null;
    this.onSetMapMode = options.onSetMapMode || null;

    this.isSoundOn = true;
    this.isAutoRotateOn = true;
    this.currentMapMode = 'atlas';

    this.hudEl = document.createElement('div');
    this.hudEl.className = 'main-hud-overlay';
    this.container.appendChild(this.hudEl);

    this.render();
  }

  render() {
    this.hudEl.replaceChildren();

    // 1. Top Left: Brand Header
    const brandBlock = document.createElement('div');
    brandBlock.className = 'hud-brand-block';

    const brandBadge = document.createElement('div');
    brandBadge.className = 'brand-badge';
    brandBadge.textContent = '● СИСТЕМА ДИСПЕТЧЕРИЗАЦИИ И 3D МОДЕЛИРОВАНИЯ';

    const brandTitle = document.createElement('h1');
    brandTitle.className = 'brand-title';
    brandTitle.textContent = 'КИБЕРДЕРЕВНЯ // КАРТА РФ 3D';

    const brandSub = document.createElement('div');
    brandSub.className = 'brand-sub';
    brandSub.textContent = 'Интеграция: Дом Такси • Завод SKD Серпухов • Hunyuan3D-WorldClaw';

    brandBlock.appendChild(brandBadge);
    brandBlock.appendChild(brandTitle);
    brandBlock.appendChild(brandSub);
    this.hudEl.appendChild(brandBlock);

    // 2. Top Right: Live Telemetry HUD
    const statsBlock = document.createElement('div');
    statsBlock.className = 'hud-stats-block';

    const metrics = [
      { label: 'ФЛОТ ЭЛЕКТРОТАКСИ', value: '600+ BYD', color: '#00f0ff' },
      { label: 'МОЩНОСТЬ СКД СЕРПУХОВ', value: '1 000 авт/мес', color: '#ffb700' },
      { label: 'ЭЛЕКТРОХАБ ВИТЯЗЬ', value: '240 кВт ULTRA', color: '#00ff9d' },
      { label: '3D ДВИЖОК МИРОВ', value: 'WorldClaw v2', color: '#e040fb' }
    ];

    metrics.forEach((m) => {
      const item = document.createElement('div');
      item.className = 'hud-stat-box';

      const val = document.createElement('div');
      val.className = 'hud-stat-val';
      val.style.color = m.color;
      val.textContent = m.value;

      const lbl = document.createElement('div');
      lbl.className = 'hud-stat-lbl';
      lbl.textContent = m.label;

      item.appendChild(val);
      item.appendChild(lbl);
      statsBlock.appendChild(item);
    });

    this.hudEl.appendChild(statsBlock);

    // 3. Bottom Center: Control Dock & City Selector
    const dock = document.createElement('div');
    dock.className = 'hud-dock-bar';

    // City Quick Selector Dropdown
    const selectWrap = document.createElement('div');
    selectWrap.className = 'dock-select-wrap';

    const select = document.createElement('select');
    select.className = 'city-select-dropdown';
    select.setAttribute('aria-label', 'Выбрать город');

    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = '📍 Выбрать город на карте...';
    select.appendChild(defaultOpt);

    CITIES_DATA.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} — ${c.badge}`;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      const cityId = e.target.value;
      if (cityId && this.onSelectCity) {
        const found = CITIES_DATA.find((c) => c.id === cityId);
        if (found) {
          soundFx.playClick();
          this.onSelectCity(found);
        }
      }
    });
    selectWrap.appendChild(select);
    dock.appendChild(selectWrap);

    // Быстрые кнопки ключевых городов
    const quickBar = document.createElement('div');
    quickBar.className = 'dock-quick-cities';
    CITIES_DATA.slice(0, 5).forEach((c) => {
      const pill = document.createElement('button');
      pill.className = `dock-city-pill ${c.id === 'serpukhov' ? 'flagship' : ''}`;
      pill.innerHTML = c.id === 'serpukhov' ? `⭐ <b>${c.name}</b>` : c.name;
      pill.style.borderColor = c.color;
      pill.addEventListener('click', () => {
        soundFx.playClick();
        if (this.onSelectCity) this.onSelectCity(c);
      });
      quickBar.appendChild(pill);
    });
    dock.appendChild(quickBar);

    // Auto rotate toggle
    const btnAutoRotate = document.createElement('button');
    btnAutoRotate.className = 'dock-btn active';
    btnAutoRotate.textContent = '🔄 Вращение: Вкл';
    btnAutoRotate.addEventListener('click', () => {
      soundFx.playClick();
      if (this.onToggleAutoRotate) {
        this.isAutoRotateOn = this.onToggleAutoRotate();
        btnAutoRotate.textContent = this.isAutoRotateOn ? '🔄 Вращение: Вкл' : '⏸ Вращение: Пауза';
        btnAutoRotate.classList.toggle('active', this.isAutoRotateOn);
      }
    });
    dock.appendChild(btnAutoRotate);

    // Camera view buttons
    const btnReset = document.createElement('button');
    btnReset.className = 'dock-btn';
    btnReset.textContent = '🎯 Центр РФ';
    btnReset.addEventListener('click', () => {
      soundFx.playClick();
      if (this.onResetCamera) this.onResetCamera();
    });
    dock.appendChild(btnReset);

    const btnIso = document.createElement('button');
    btnIso.className = 'dock-btn';
    btnIso.textContent = '📐 3D Изометрия';
    btnIso.addEventListener('click', () => {
      soundFx.playClick();
      if (this.onViewIso) this.onViewIso();
    });
    dock.appendChild(btnIso);

    const btnTop = document.createElement('button');
    btnTop.className = 'dock-btn';
    btnTop.textContent = '🗺️ Вид Сверху';
    btnTop.addEventListener('click', () => {
      soundFx.playClick();
      if (this.onViewTop) this.onViewTop();
    });
    dock.appendChild(btnTop);

    // Sound toggle
    const btnSound = document.createElement('button');
    btnSound.className = 'dock-btn active';
    btnSound.textContent = '🔊 Звук: Вкл';
    btnSound.addEventListener('click', () => {
      this.isSoundOn = soundFx.toggleSound();
      btnSound.textContent = this.isSoundOn ? '🔊 Звук: Вкл' : '🔇 Звук: Выкл';
      btnSound.classList.toggle('active', this.isSoundOn);
    });
    dock.appendChild(btnSound);

    // Fullscreen toggle
    const btnFs = document.createElement('button');
    btnFs.className = 'dock-btn';
    btnFs.textContent = '⛶ Экран';
    btnFs.addEventListener('click', () => {
      soundFx.playClick();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
    dock.appendChild(btnFs);

    this.hudEl.appendChild(dock);

    // 4. Instructions tooltip at bottom left
    const tip = document.createElement('div');
    tip.className = 'hud-tip-box';
    tip.textContent = '💡 Управление: Зажмите левую кнопку мыши для свободного вращения 3D карты РФ в любую сторону • Колесико — зум • Кликните на город для 3D-мира';
    this.hudEl.appendChild(tip);
  }

  show() {
    this.hudEl.classList.remove('hidden');
  }

  hide() {
    this.hudEl.classList.add('hidden');
  }
}
