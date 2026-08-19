import { soundFx } from '../audio/soundFx.js';

export class CityCardUI {
  constructor(container, onEnterWorld) {
    this.container = container;
    this.onEnterWorld = onEnterWorld;
    this.currentCity = null;

    this.cardEl = document.createElement('div');
    this.cardEl.className = 'city-card-overlay hidden';
    this.container.appendChild(this.cardEl);
  }

  show(city) {
    this.currentCity = city;
    this.cardEl.replaceChildren();

    // 1. Header
    const header = document.createElement('div');
    header.className = 'city-card-header';

    const titleWrap = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = 'city-badge';
    badge.style.borderColor = city.color;
    badge.style.color = city.color;
    badge.textContent = city.badge;

    const title = document.createElement('h2');
    title.className = 'city-name';
    title.textContent = city.name;

    const region = document.createElement('div');
    region.className = 'city-region';
    region.textContent = city.region;

    titleWrap.appendChild(badge);
    titleWrap.appendChild(title);
    titleWrap.appendChild(region);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Закрыть');
    closeBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.hide();
    });

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);
    this.cardEl.appendChild(header);

    // 2. Subtitle & Description
    const body = document.createElement('div');
    body.className = 'city-card-body';

    const subtitle = document.createElement('h3');
    subtitle.className = 'city-subheading';
    subtitle.textContent = city.title;
    body.appendChild(subtitle);

    const desc = document.createElement('p');
    desc.className = 'city-desc';
    desc.textContent = city.shortDesc;
    body.appendChild(desc);

    // 3. Stats Grid
    const statsGrid = document.createElement('div');
    statsGrid.className = 'city-stats-grid';

    Object.entries(city.stats).forEach(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'stat-item';

      const lbl = document.createElement('div');
      lbl.className = 'stat-label';
      lbl.textContent = label;

      const val = document.createElement('div');
      val.className = 'stat-value';
      val.textContent = value;

      item.appendChild(lbl);
      item.appendChild(val);
      statsGrid.appendChild(item);
    });
    body.appendChild(statsGrid);

    // 4. Hunyuan3D-WorldClaw Info Box
    const hwBox = document.createElement('div');
    hwBox.className = 'worldclaw-banner';

    const hwTitle = document.createElement('div');
    hwTitle.className = 'hw-title';
    hwTitle.textContent = '⚡ 3D ДВИЖОК: HUNYUAN3D-WORLDCLAW';

    const hwDesc = document.createElement('div');
    hwDesc.className = 'hw-desc';
    hwDesc.textContent = `Привязанный мир: ${city.hunyuanWorld.worldName}`;

    hwBox.appendChild(hwTitle);
    hwBox.appendChild(hwDesc);
    body.appendChild(hwBox);

    this.cardEl.appendChild(body);

    // 5. Action Button: Enter 3D World
    const footer = document.createElement('div');
    footer.className = 'city-card-footer';

    const enterBtn = document.createElement('button');
    enterBtn.className = 'btn-primary-glow';
    enterBtn.style.setProperty('--btn-accent', city.color);
    enterBtn.textContent = 'ЗАГРУЗИТЬ 3D МИР И МАКЕТ СОБЫТИЙ →';
    enterBtn.addEventListener('click', () => {
      soundFx.playWarp();
      if (this.onEnterWorld) {
        this.onEnterWorld(city);
      }
    });

    footer.appendChild(enterBtn);
    this.cardEl.appendChild(footer);

    this.cardEl.classList.remove('hidden');
    soundFx.playHover();
  }

  hide() {
    this.cardEl.classList.add('hidden');
    this.currentCity = null;
  }
}
