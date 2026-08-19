import { soundFx } from '../audio/soundFx.js';

export class WorldClawPromptUI {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.onBackToMap = options.onBackToMap || null;
    this.onCameraMode = options.onCameraMode || null;
    this.onTimeOfDay = options.onTimeOfDay || null;
    this.onPlayEvent = options.onPlayEvent || null;
    this.onPauseEvent = options.onPauseEvent || null;
    this.onStopEvent = options.onStopEvent || null;
    this.onSelectStep = options.onSelectStep || null;
    this.onRegenerateWorld = options.onRegenerateWorld || null;

    this.currentCity = null;
    this.currentSimulationState = null;
    this.activeStudioTab = 'pipeline'; // 'pipeline' | 'layout' | 'assets' | 'spec'

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'worldclaw-ui-overlay hidden';
    this.container.appendChild(this.wrapper);
  }

  show(city) {
    this.currentCity = city;
    this.wrapper.classList.remove('hidden');
    this.render();
  }

  hide() {
    this.wrapper.classList.add('hidden');
    this.wrapper.replaceChildren();
    this.currentCity = null;
  }

  showZoneInfo(zone) {
    let card = document.getElementById('zone-hud-popup');
    if (!card) {
      card = document.createElement('div');
      card.id = 'zone-hud-popup';
      card.className = 'zone-info-card';
      document.body.appendChild(card);
    }

    card.replaceChildren();

    const title = document.createElement('div');
    title.className = 'zone-card-title';
    title.textContent = `📍 ${zone.name}`;

    const desc = document.createElement('div');
    desc.className = 'zone-card-desc';
    desc.textContent = zone.desc || "Объект мастер-плана экосистемы";

    const closeBtn = document.createElement('button');
    closeBtn.className = 'zone-card-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => card.remove());

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(closeBtn);

    card.classList.remove('hidden');
    soundFx.playHover();
  }

  updateSimulationState(state) {
    this.currentSimulationState = state;
    this.renderEventTimeline();
  }

  render() {
    this.wrapper.replaceChildren();
    const city = this.currentCity;
    if (!city) return;

    // 1. Верхняя панель навигации и управления
    const topBar = document.createElement('div');
    topBar.className = 'world-top-bar';

    const leftNav = document.createElement('div');
    leftNav.className = 'world-nav-left';

    const backBtn = document.createElement('button');
    backBtn.className = 'btn-back-map';
    backBtn.textContent = '← НАЗАД К КАРТЕ РФ';
    backBtn.addEventListener('click', () => {
      soundFx.playClick();
      const popup = document.getElementById('zone-hud-popup');
      if (popup) popup.remove();
      if (this.onBackToMap) this.onBackToMap();
    });

    const cityTag = document.createElement('div');
    cityTag.className = 'world-city-tag';

    const cityName = document.createElement('span');
    cityName.className = 'world-city-title';
    cityName.textContent = `Tencent Hunyuan3D-WorldClaw • ${city.name}`;

    const badge = document.createElement('span');
    badge.className = 'world-badge';
    badge.style.color = city.color;
    badge.textContent = city.badge;

    cityTag.appendChild(cityName);
    cityTag.appendChild(badge);

    leftNav.appendChild(backBtn);
    leftNav.appendChild(cityTag);

    // Правая часть управления (Режимы камеры, время суток, схема генплана, Студия WorldClaw)
    const rightNav = document.createElement('div');
    rightNav.className = 'world-nav-right';

    // Кнопка запуска студии WorldClaw
    const studioBtn = document.createElement('button');
    studioBtn.className = 'btn-worldclaw-modal';
    studioBtn.textContent = '🧠 СТУДИЯ WORLDCLAW';
    studioBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.openWorldClawStudioModal();
    });

    // Кнопка NVIDIA AI Директор
    const aiBtn = document.createElement('button');
    aiBtn.className = 'btn-photo-plan';
    aiBtn.style.borderColor = '#76b900';
    aiBtn.style.color = '#76b900';
    aiBtn.textContent = '🟢 NVIDIA AI ДИРЕКТОР';
    aiBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.openNvidiaDirectorModal();
    });

    // Кнопка фото-схемы генплана
    const planBtn = document.createElement('button');
    planBtn.className = 'btn-photo-plan';
    planBtn.textContent = '📋 СХЕМА ГЕНПЛАНА (ФОТО)';
    planBtn.addEventListener('click', () => {
      soundFx.playClick();
      this.openMasterplanPhotoModal();
    });

    // Режимы камеры и секторов мастер-плана
    const camGroup = document.createElement('div');
    camGroup.className = 'btn-pill-group';

    const modes = [
      { id: 'masterplan', label: '📐 Изометрия плана' },
      { id: 'hub', label: '⚡ Дом Такси' },
      { id: 'skd', label: '🏭 Завод SKD' },
      { id: 'agro', label: '🌱 ТЭЦ и Теплицы' },
      { id: 'tech', label: '🏙️ Кибердеревня' },
      { id: 'firstPerson', label: '🚶 FPS Прогулка' },
      { id: 'drone', label: '🚁 Облет' }
    ];

    modes.forEach((m, idx) => {
      const btn = document.createElement('button');
      btn.className = `btn-pill ${idx === 0 ? 'active' : ''}`;
      btn.textContent = m.label;
      btn.addEventListener('click', () => {
        soundFx.playClick();
        camGroup.querySelectorAll('.btn-pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.onCameraMode) this.onCameraMode(m.id);
      });
      camGroup.appendChild(btn);
    });

    rightNav.appendChild(studioBtn);
    rightNav.appendChild(aiBtn);
    rightNav.appendChild(planBtn);
    rightNav.appendChild(camGroup);

    topBar.appendChild(leftNav);
    topBar.appendChild(rightNav);
    this.wrapper.appendChild(topBar);

    // 2. Нижняя панель сценария макета событий
    this.eventPanel = document.createElement('div');
    this.eventPanel.className = 'event-simulation-panel';
    this.wrapper.appendChild(this.eventPanel);

    this.renderEventTimeline();
  }

  openNvidiaDirectorModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'masterplan-modal'; // reusing style
    modal.style.border = '2px solid #76b900';
    modal.style.boxShadow = '0 0 30px rgba(118, 185, 0, 0.2)';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h2');
    title.innerHTML = '🟢 <span style="color:#76b900">NVIDIA NIM:</span> ИИ-Директор 3D Мира';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body-photo';
    body.style.padding = '24px';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '16px';

    const info = document.createElement('div');
    info.style.color = '#a1a1aa';
    info.style.lineHeight = '1.5';
    info.innerHTML = 'Введите команду для нейросети (Llama-3.1-70B). ИИ преобразует ваш запрос в команду для движка Three.js и изменит мир в реальном времени.<br/><i>Примеры: "Сделай ночь", "Нагони дождь", "Добавь 3 желтые машины".</i>';
    body.appendChild(info);

    const logBox = document.createElement('div');
    logBox.style.flex = '1';
    logBox.style.background = 'rgba(0,0,0,0.5)';
    logBox.style.border = '1px solid #334155';
    logBox.style.borderRadius = '8px';
    logBox.style.padding = '12px';
    logBox.style.fontFamily = 'monospace';
    logBox.style.color = '#76b900';
    logBox.style.minHeight = '150px';
    logBox.style.overflowY = 'auto';
    body.appendChild(logBox);

    const inputWrap = document.createElement('div');
    inputWrap.style.display = 'flex';
    inputWrap.style.gap = '8px';

    const input = document.createElement('input');
    input.type = 'text';
    input.style.flex = '1';
    input.style.background = 'rgba(15,23,42,0.8)';
    input.style.border = '1px solid #76b900';
    input.style.color = '#fff';
    input.style.padding = '12px 16px';
    input.style.borderRadius = '8px';
    input.style.fontSize = '16px';
    input.placeholder = 'Команда для ИИ...';

    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn-primary-glow';
    sendBtn.style.background = 'linear-gradient(45deg, #76b900, #3e6e00)';
    sendBtn.textContent = 'ОТПРАВИТЬ ⏎';

    inputWrap.appendChild(input);
    inputWrap.appendChild(sendBtn);
    body.appendChild(inputWrap);

    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const log = (msg, color = '#76b900') => {
      const line = document.createElement('div');
      line.style.color = color;
      line.innerHTML = msg;
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log('▶ Система ИИ-Директора (NVIDIA NIM) активирована. Ожидание ввода...');

    const processCommand = async () => {
      const prompt = input.value.trim();
      if (!prompt) return;
      
      log(`<br/>> USER: ${prompt}`, '#fff');
      input.value = '';
      sendBtn.disabled = true;
      input.disabled = true;
      log('▶ [NVIDIA NIM] Анализ промта через Llama-3.1-70B...', '#facc15');
      soundFx.playHover();

      try {
        const res = await fetch('http://127.0.0.1:8000/api/worldclaw/nvidia-director', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        
        if (data.success) {
          if (data.command.message) {
             log('▶ [NVIDIA NIM] Ответ нейросети:');
             log(`<br/>${data.command.message.replace(/\\n/g, '<br/>')}<br/>`, '#a1a1aa');
             soundFx.playPulse();

             // Попытка извлечь JavaScript код из ответа
             let jsCode = '';
             const codeMatch = data.command.message.match(/```(?:javascript|js)\n([\s\S]*?)```/);
             if (codeMatch) {
                jsCode = codeMatch[1];
             } else if (data.command.message.includes('THREE.') || data.command.message.includes('scene.add')) {
                // Если нет маркеров, но похож на код
                jsCode = data.command.message;
             }

             if (jsCode && window._executeNvidiaCode) {
                log('⚡ [АВТО-ВЫПОЛНЕНИЕ] Исполняю сгенерированный код...', '#facc15');
                const result = window._executeNvidiaCode(jsCode);
                if (result === 'Success') {
                   log('✅ Код успешно материализован в 3D мире!', '#22c55e');
                } else {
                   log(`❌ Ошибка выполнения: ${result}`, '#ef4444');
                }
             }

          } else {
             log('▶ [NVIDIA NIM] JSON Команда получена:');
             log(JSON.stringify(data.command, null, 2), '#a1a1aa');
             soundFx.playPulse();
             
             // Execute standard JSON commands
             if (window._executeNvidiaCommand) {
               window._executeNvidiaCommand(data.command);
             } else {
               log('❌ Ошибка: Обработчик команд движка не привязан.', '#ef4444');
             }
          }
        } else {
          log(`❌ Ошибка API: ${data.detail}`, '#ef4444');
        }
      } catch (err) {
        log(`❌ Ошибка сети: ${err.message}`, '#ef4444');
      }

      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
    };

    sendBtn.addEventListener('click', processCommand);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') processCommand();
    });
    input.focus();
  }

  openWorldClawStudioModal() {
    const city = this.currentCity;
    if (!city) return;

    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'worldclaw-studio-modal';

    // 1. Header
    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'studio-header-title';
    titleWrap.innerHTML = `
      <span class="studio-logo-icon">🧠</span>
      <div>
        <h2>Tencent Hunyuan3D-WorldClaw • Центр Управления Пайплайном</h2>
        <div class="studio-subtitle">Генерация цифрового двойника города Серпухов из мастер-плана</div>
      </div>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());

    header.appendChild(titleWrap);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // 2. Tab Navigation
    const tabNav = document.createElement('div');
    tabNav.className = 'studio-tab-nav';

    const tabs = [
      { id: 'pipeline', label: '⚡ Пайплайн Генерации' },
      { id: 'blender', label: '🎨 Blender 3D Pipeline' },
      { id: 'layout', label: '🗺️ Layout Agent (Сетка Зон)' },
      { id: 'assets', label: '🧩 3D-Ассеты Hunyuan3D' },
      { id: 'spec', label: '📄 JSON Спецификация' }
    ];

    const contentArea = document.createElement('div');
    contentArea.className = 'studio-content-area';

    const renderTabContent = (tabId) => {
      this.activeStudioTab = tabId;
      tabNav.querySelectorAll('.studio-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
      });
      contentArea.replaceChildren();

      if (tabId === 'pipeline') {
        this.renderPipelineTab(contentArea, city, overlay);
      } else if (tabId === 'blender') {
        this.renderBlenderTab(contentArea);
      } else if (tabId === 'layout') {
        this.renderLayoutTab(contentArea);
      } else if (tabId === 'assets') {
        this.renderAssetsTab(contentArea);
      } else if (tabId === 'spec') {
        this.renderSpecTab(contentArea);
      }
    };

    tabs.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `studio-tab-btn ${t.id === this.activeStudioTab ? 'active' : ''}`;
      btn.dataset.tab = t.id;
      btn.textContent = t.label;
      btn.addEventListener('click', () => {
        soundFx.playClick();
        renderTabContent(t.id);
      });
      tabNav.appendChild(btn);
    });

    modal.appendChild(tabNav);
    modal.appendChild(contentArea);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const linkOfficial = document.createElement('a');
    linkOfficial.className = 'btn-secondary-link';
    linkOfficial.href = 'https://tencent-hunyuan.github.io/Hunyuan3D-WorldClaw/';
    linkOfficial.target = '_blank';
    linkOfficial.rel = 'noreferrer noopener';
    linkOfficial.textContent = 'Официальный репозиторий Tencent-Hunyuan/Hunyuan3D-WorldClaw ↗';

    const rebuildBtn = document.createElement('button');
    rebuildBtn.className = 'btn-primary-glow';
    rebuildBtn.textContent = '⚡ ЗАПУСТИТЬ ПЕРЕСБОРКУ СЕРПУХОВА';
    rebuildBtn.addEventListener('click', () => {
      soundFx.playWarp();
      overlay.remove();
      this.runLiveWorldClawGeneration(city);
    });

    footer.appendChild(linkOfficial);
    footer.appendChild(rebuildBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    renderTabContent(this.activeStudioTab);
  }

  runLiveWorldClawGeneration(city) {
    const overlay = document.createElement('div');
    overlay.className = 'generation-hud-overlay';

    const card = document.createElement('div');
    card.className = 'generation-hud-card';

    card.innerHTML = `
      <div class="gen-hud-header">
        <div class="gen-hud-icon">🧠</div>
        <div>
          <div class="gen-hud-title">TENCENT HUNYUAN3D-WORLDCLAW</div>
          <div class="gen-hud-sub">Генерация цифрового двойника: Серпухов (Завод SKD, Электрохаб Витязь, ТЭЦ, Кибердеревня)</div>
        </div>
      </div>

      <div class="gen-progress-track">
        <div class="gen-progress-fill" id="gen-bar-fill"></div>
      </div>

      <div class="gen-terminal-logs" id="gen-terminal-logs">
        <div class="gen-log-line active">▶ [Stage 1/4] Инициализация WorldClaw Agentic Pipeline...</div>
      </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const logContainer = card.querySelector('#gen-terminal-logs');
    const barFill = card.querySelector('#gen-bar-fill');

    const steps = [
      { delay: 400, percent: 25, text: '🧠 [Layout Agent] engine/layout_agent.py: Извлечение пространственных зон из мастер-плана...', sound: 'playPulse' },
      { delay: 1000, percent: 55, text: '🧩 [Hunyuan3D-2] Синтез 3D геометрии: BYD E6 Taxi, ЭЗС 240кВт, роботы Kuka, агротеплицы...', sound: 'playPulse' },
      { delay: 1700, percent: 85, text: '🏗️ [Scene Assembler] engine/serpukhov_world_builder.py: Сборка PBR-материалов, асфальта и трафика...', sound: 'playPulse' },
      { delay: 2400, percent: 100, text: '✅ [WorldClaw Ready] Мир успешно скомпилирован в public/data/serpukhov_worldclaw.json!', sound: 'playWarp' }
    ];

    steps.forEach(st => {
      setTimeout(() => {
        if (barFill) barFill.style.width = `${st.percent}%`;
        if (logContainer) {
          const line = document.createElement('div');
          line.className = 'gen-log-line active';
          line.textContent = st.text;
          logContainer.appendChild(line);
          logContainer.scrollTop = logContainer.scrollHeight;
        }
        if (st.sound === 'playWarp') {
          soundFx.playWarp();
        } else {
          soundFx.playHover();
        }
      }, st.delay);
    });

    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        if (this.onRegenerateWorld) this.onRegenerateWorld(city);
      }, 300);
    }, 3000);
  }

  renderPipelineTab(container, city, overlay) {
    const wrap = document.createElement('div');
    wrap.className = 'pipeline-tab-wrap';

    wrap.innerHTML = `
      <div class="studio-section-title">1. Текстовый мастер-план (Natural Language Prompt Intake)</div>
      <div class="prompt-box">
        <textarea class="worldclaw-textarea" id="studio-prompt-input" rows="3">Tencent Hunyuan3D-WorldClaw Serpukhov Masterplan: Dom Taxi Vityaz mega charging hub with 11x 240kW liquid-cooled charging pillars, telemedicine clinic, glass-roof factory kitchen, SKD BYD automotive assembly factory with 4-axis robotic welding arms and motorized conveyor line, coal/gas thermal power plant with rising steam pipes feeding arched greenhouses, and Cyber-Village tech center skyscraper with rotating AI dome.</textarea>
      </div>

      <div class="studio-section-title" style="margin-top: 16px;">2. Пошаговый пайплайн WorldClaw</div>
      <div class="pipeline-flow-grid">
        <div class="pipe-card active">
          <div class="pipe-num">01</div>
          <div class="pipe-name">Layout Agent</div>
          <div class="pipe-desc">Анализирует текст и инфографику, строит топологию дорог и 4 ключевых сектора Серпухова.</div>
          <div class="pipe-status">✅ Выполнено (engine/layout_agent.py)</div>
        </div>
        <div class="pipe-card active">
          <div class="pipe-num">02</div>
          <div class="pipe-name">Hunyuan3D-2 Generator</div>
          <div class="pipe-desc">Генерирует высокодетализированные 3D-ассеты (электрокары BYD, роботы-сварщики, ЭЗС 240кВт).</div>
          <div class="pipe-status">✅ Выполнено (Hunyuan3D-2 Engine)</div>
        </div>
        <div class="pipe-card active">
          <div class="pipe-num">03</div>
          <div class="pipe-name">Scene Assembler</div>
          <div class="pipe-desc">Сборка PBR-материалов, расстановка ассетов, расчет теней, коллизий и трафика.</div>
          <div class="pipe-status">✅ Выполнено (serpukhov_world_builder.py)</div>
        </div>
        <div class="pipe-card active">
          <div class="pipe-num">04</div>
          <div class="pipe-name">First-Person View</div>
          <div class="pipe-desc">Рендеринг в WebGL с физикой движения, шагами и свободным обзором на 360°.</div>
          <div class="pipe-status">✅ Активно в реальном времени</div>
        </div>
      </div>

      <div class="studio-section-title" style="margin-top: 16px;">3. Официальная схема архитектуры Tencent WorldClaw</div>
      <div class="pipeline-diagram-wrap">
        <img src="/assets/worldclaw/pipeline.jpg" alt="Tencent WorldClaw Pipeline" class="pipeline-diagram-img" />
      </div>
    `;

    container.appendChild(wrap);
  }

  renderBlenderTab(container) {
    const wrap = document.createElement('div');
    wrap.className = 'blender-tab-wrap';

    wrap.innerHTML = `
      <div class="studio-section-title">🎨 Blender 4.2 LTS: Архитектурный 3D-пайплайн Кибердеревни</div>
      
      <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 18px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <div style="font-weight: 700; font-size: 15px; color: #38bdf8;">⚙️ Статус 3D Engine: <span id="blender-status-text" style="color: #4ade80;">Проверка...</span></div>
          <a href="/cybervillage_masterplan.blend" download="cybervillage_masterplan.blend" class="btn-secondary-link" style="padding: 6px 12px; font-size: 13px; text-decoration: none;">
            📥 Скачать .blend проект
          </a>
        </div>
        <div style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          Headless-пайплайн Blender позволяет генерировать высокополигональные здания со скошенными фасками (bevel), запекать PBR-материалы и компилировать чистые GLB-ассеты прямо для WebGL.
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-bottom: 20px;">
        <div class="asset-card">
          <div class="asset-name" style="color: #38bdf8;">⚡ Сектор: Энергетика и Агро</div>
          <div class="asset-desc">Угольная ТЭЦ с каркасом, Газовая ТЭЦ с плазмой, 6 теплиц и ферма.</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">GLB: <code>agro_power_complex.glb</code></div>
        </div>
        <div class="asset-card">
          <div class="asset-name" style="color: #38bdf8;">🚕 Сектор: Дом Такси «Витязь»</div>
          <div class="asset-desc">Главный терминал, медцентр с 3D-крестом, 6 станций ЭЗС 240 кВт.</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">GLB: <code>vityaz_taxi_hub.glb</code></div>
        </div>
        <div class="asset-card">
          <div class="asset-name" style="color: #38bdf8;">🏭 Сектор: Автозавод SKD BYD</div>
          <div class="asset-desc">Цех сборки с шедовой кровлей, роботы Kuka, автосалон, башня 2 млн.</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">GLB: <code>skd_factory_complex.glb</code></div>
        </div>
        <div class="asset-card">
          <div class="asset-name" style="color: #38bdf8;">🌐 Сектор: Техноцентр</div>
          <div class="asset-desc">Многоярусный кибер-небоскреб со шпилем, стеклянными ламелями и неонами.</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 8px;">GLB: <code>tech_skyscraper.glb</code></div>
        </div>
      </div>

      <div style="display: flex; gap: 12px; align-items: center;">
        <button id="btn-blender-build-all" class="btn-primary-glow" style="flex: 1; padding: 12px 20px; font-size: 14px;">
          🚀 Скомпилировать все 3D GLB модели через Blender
        </button>
      </div>

      <div id="blender-build-console" style="display: none; margin-top: 16px; background: #0b1120; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; color: #38bdf8; max-height: 180px; overflow-y: auto;">
      </div>
    `;

    container.appendChild(wrap);

    // Fetch status
    fetch('http://127.0.0.1:8000/api/worldclaw/blender/status')
      .then(res => res.json())
      .then(data => {
        const txt = wrap.querySelector('#blender-status-text');
        if (txt) {
          txt.textContent = data.installed ? `✅ Онлайн (${data.engine})` : '⚠️ Ожидание установки...';
          txt.style.color = data.installed ? '#4ade80' : '#f59e0b';
        }
      })
      .catch(() => {
        const txt = wrap.querySelector('#blender-status-text');
        if (txt) {
          txt.textContent = 'API Server offline (localhost:8000)';
          txt.style.color = '#ef4444';
        }
      });

    // Handle 1-click build
    const buildBtn = wrap.querySelector('#btn-blender-build-all');
    const consoleBox = wrap.querySelector('#blender-build-console');

    buildBtn.addEventListener('click', () => {
      buildBtn.disabled = true;
      buildBtn.textContent = '⏳ Компиляция 3D-моделей в Blender 4.2...';
      consoleBox.style.display = 'block';
      consoleBox.textContent = '[Blender Headless] Запуск экспорта GLB ассетов и .blend проекта...\n';

      fetch('http://127.0.0.1:8000/api/worldclaw/blender/build-all', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          buildBtn.disabled = false;
          buildBtn.textContent = '✅ Компиляция завершена! (Повторить)';
          consoleBox.textContent += data.stdout || JSON.stringify(data, null, 2);
          soundFx.playWarp();
        })
        .catch(err => {
          buildBtn.disabled = false;
          buildBtn.textContent = '❌ Ошибка компиляции';
          consoleBox.textContent += `[Error] ${err.message}`;
        });
    });
  }

  renderLayoutTab(container) {
    const wrap = document.createElement('div');
    wrap.className = 'layout-tab-wrap';

    wrap.innerHTML = `
      <div class="studio-section-title">Семантическая карта зонирования города Серпухов (Layout Grid)</div>
      <div class="layout-grid-vis">
        <div class="layout-zone-box zone-skd">
          <div class="z-badge">Северный сектор: [0, 0, -50]</div>
          <div class="z-title">🏭 Завод Крупноузловой Сборки [SKD] BYD</div>
          <div class="z-items">• Цех сборки (46×15×26м) • Конвейер с 4 роботами • Автосалон розницы (30%) • Башня 2 млн авто</div>
        </div>
        <div class="layout-zone-box zone-hub">
          <div class="z-badge">Центральный сектор: [0, 0, 0]</div>
          <div class="z-title">⚡ Электрохаб «Витязь» и Дом Такси</div>
          <div class="z-items">• 11 станций 240 кВт • Телемедицинский блок • Фабрика-кухня • Цех производства ЭЗС</div>
        </div>
        <div class="layout-zone-box zone-agro">
          <div class="z-badge">Юго-западный сектор: [-56, 0, 32]</div>
          <div class="z-title">🌱 ТЭЦ и Агрокомплекс «Чистая Страна»</div>
          <div class="z-items">• Угольная/газовая ТЭЦ • Градирня с паром • Теплотрассы • 3 арочные теплицы • Ферма</div>
        </div>
        <div class="layout-zone-box zone-tech">
          <div class="z-badge">Юго-восточный сектор: [54, 0, 32]</div>
          <div class="z-title">🌐 Кибердеревня: Техноцентр и ИИ</div>
          <div class="z-items">• Небоскреб Техноцентра (42м) • Геокупол лабораторий ИИ • Кампус института • Полигон БПЛА</div>
        </div>
      </div>
    `;

    container.appendChild(wrap);
  }

  renderAssetsTab(container) {
    const wrap = document.createElement('div');
    wrap.className = 'assets-tab-wrap';

    const assets = [
      { name: "Электромобиль BYD E6 Taxi", poly: "14.2k tris", mat: "PBR Metallic Carpaint", tex: "1024x1024", desc: "Легковой электрокар для таксопарка, автономный запас хода 500 км." },
      { name: "ЭЗС 240 кВт Liquid-Cooled", poly: "8.6k tris", mat: "Glass + Emission LCD", tex: "512x512", desc: "Ультрабыстрая станция с кабелем охлаждения и экраном телеметрии." },
      { name: "4-Осевой Робот-Сварщик", poly: "18.4k tris", mat: "Industrial Enamel + Sparks", tex: "1024x1024", desc: "Роботизированный манипулятор конвейерной линии SKD сборки." },
      { name: "Арочная Теплица «Чистая Страна»", poly: "12.0k tris", mat: "Transparent Ribbed Glass", tex: "1024x1024", desc: "Тепличный блок с фито-подсветкой и внутренними грядками растений." },
      { name: "Геокупол Лабораторий ИИ", poly: "22.5k tris", mat: "Wireframe Glass + Core", tex: "512x512", desc: "Геодезическая сфера с вращающимся квантовым ядром нейросетей." },
      { name: "Электрогрузовик BYD T5", poly: "16.8k tris", mat: "Gloss Composite", tex: "1024x1024", desc: "Коммерческий среднетоннажный электрокар для межгородской логистики." }
    ];

    let html = `<div class="studio-section-title">Каталог 3D-ассетов Hunyuan3D, сгенерированных для Серпухова</div><div class="assets-catalog-grid">`;
    assets.forEach(a => {
      html += `
        <div class="asset-card">
          <div class="asset-name">${a.name}</div>
          <div class="asset-meta">
            <span>Полигоны: <b>${a.poly}</b></span>
            <span>Материал: <b>${a.mat}</b></span>
            <span>Текстуры: <b>${a.tex}</b></span>
          </div>
          <div class="asset-desc">${a.desc}</div>
        </div>
      `;
    });
    html += `</div>`;
    wrap.innerHTML = html;

    container.appendChild(wrap);
  }

  renderSpecTab(container) {
    const wrap = document.createElement('div');
    wrap.className = 'spec-tab-wrap';

    wrap.innerHTML = `
      <div class="studio-section-title">Скомпилированный файл WorldClaw: public/data/serpukhov_worldclaw.json</div>
      <div class="spec-code-box">
        <pre><code id="spec-json-code">Загрузка спецификации...</code></pre>
      </div>
    `;

    fetch('/data/serpukhov_worldclaw.json')
      .then(res => res.json())
      .then(data => {
        const el = document.getElementById('spec-json-code');
        if (el) el.textContent = JSON.stringify(data, null, 2);
      })
      .catch(err => {
        const el = document.getElementById('spec-json-code');
        if (el) el.textContent = "// Спецификация скомпилирована в engine/serpukhov_world_builder.py";
      });

    container.appendChild(wrap);
  }

  openMasterplanPhotoModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop';

    const modal = document.createElement('div');
    modal.className = 'masterplan-modal';

    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h2');
    title.textContent = '📄 Экосистема «Дом Такси»: Глобальный план развития';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => overlay.remove());

    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body-photo';

    const img = document.createElement('img');
    img.src = '/masterplan.jpg';
    img.alt = 'Глобальный план развития Дом Такси и Кибердеревня';
    img.className = 'masterplan-full-img';

    body.appendChild(img);
    modal.appendChild(body);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  renderEventTimeline() {
    if (!this.eventPanel) return;
    this.eventPanel.replaceChildren();

    const state = this.currentSimulationState;
    if (!state || !state.event) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'empty-sim-notice';
      emptyNotice.textContent = 'Загрузка сценария макета событий...';
      this.eventPanel.appendChild(emptyNotice);
      return;
    }

    const ev = state.event;
    const currentStep = state.step;

    // Header
    const head = document.createElement('div');
    head.className = 'event-header';

    const titleWrap = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = 'event-badge';
    badge.textContent = ev.badge;

    const title = document.createElement('span');
    title.className = 'event-title';
    title.textContent = ev.title;

    titleWrap.appendChild(badge);
    titleWrap.appendChild(title);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'event-ctrl-buttons';

    const playBtn = document.createElement('button');
    playBtn.className = 'btn-icon-action';
    playBtn.textContent = state.isPlaying ? '⏸ Пауза' : '▶ Запустить макет';
    playBtn.addEventListener('click', () => {
      if (state.isPlaying) {
        if (this.onPauseEvent) this.onPauseEvent();
      } else {
        if (this.onPlayEvent) this.onPlayEvent();
      }
    });

    const stopBtn = document.createElement('button');
    stopBtn.className = 'btn-icon-action';
    stopBtn.textContent = '⏹ Сброс';
    stopBtn.addEventListener('click', () => {
      if (this.onStopEvent) this.onStopEvent();
    });

    controls.appendChild(playBtn);
    controls.appendChild(stopBtn);

    head.appendChild(titleWrap);
    head.appendChild(controls);
    this.eventPanel.appendChild(head);

    // Progress Bar
    const progressWrap = document.createElement('div');
    progressWrap.className = 'event-progress-wrap';

    const progressBar = document.createElement('div');
    progressBar.className = 'event-progress-bar';
    progressBar.style.width = `${state.progress || 0}%`;
    progressWrap.appendChild(progressBar);
    this.eventPanel.appendChild(progressWrap);

    // Steps Row
    const stepsRow = document.createElement('div');
    stepsRow.className = 'event-steps-row';

    ev.steps.forEach((st, idx) => {
      const stepItem = document.createElement('div');
      stepItem.className = `step-node ${idx === state.stepIndex ? 'active' : ''} ${idx < state.stepIndex ? 'completed' : ''}`;

      const stepNum = document.createElement('div');
      stepNum.className = 'step-num';
      stepNum.textContent = `0${idx + 1}`;

      const stepName = document.createElement('div');
      stepName.className = 'step-name';
      stepName.textContent = st.stage;

      stepItem.appendChild(stepNum);
      stepItem.appendChild(stepName);

      stepItem.addEventListener('click', () => {
        if (this.onSelectStep) this.onSelectStep(idx);
      });

      stepsRow.appendChild(stepItem);
    });
    this.eventPanel.appendChild(stepsRow);

    // Step Details
    if (currentStep) {
      const detailWrap = document.createElement('div');
      detailWrap.className = 'step-detail-wrap';

      const desc = document.createElement('div');
      desc.className = 'step-desc';
      desc.textContent = currentStep.description;
      detailWrap.appendChild(desc);

      if (currentStep.metrics) {
        const metricsRow = document.createElement('div');
        metricsRow.className = 'step-metrics-row';

        Object.entries(currentStep.metrics).forEach(([k, v]) => {
          const m = document.createElement('div');
          m.className = 'step-metric-item';

          const kEl = document.createElement('span');
          kEl.className = 'm-key';
          kEl.textContent = `${k}: `;

          const vEl = document.createElement('span');
          vEl.className = 'm-val';
          vEl.textContent = v;

          m.appendChild(kEl);
          m.appendChild(vEl);
          metricsRow.appendChild(m);
        });

        detailWrap.appendChild(metricsRow);
      }

      this.eventPanel.appendChild(detailWrap);
    }
  }
}
