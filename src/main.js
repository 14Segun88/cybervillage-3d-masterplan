import { RussiaMap3D } from './map/russiaMap3D.js';
import { WorldClawEngine } from './world/worldClawEngine.js';
import { EventSimulator } from './world/eventSimulator.js';
import { HudOverlay } from './ui/hudOverlay.js';
import { CityCardUI } from './ui/cityCard.js';
import { WorldClawPromptUI } from './ui/worldClawPromptUI.js';
import { soundFx } from './audio/soundFx.js';

class App {
  constructor() {
    this.currentMode = 'map'; // 'map' | 'world'
    this.selectedCity = null;

    this.mapViewport = document.getElementById('map-viewport');
    this.worldViewport = document.getElementById('world-viewport');
    this.hudContainer = document.getElementById('hud-container');
    this.cardContainer = document.getElementById('card-container');
    this.worldUiContainer = document.getElementById('world-ui-container');

    this.russiaMap = null;
    this.worldEngine = null;
    this.eventSimulator = null;
    this.hudUI = null;
    this.cityCardUI = null;
    this.worldUI = null;

    this.init();
  }

  init() {
    // 1. Инициализация симулятора событий
    this.eventSimulator = new EventSimulator((state) => {
      if (this.worldUI) {
        this.worldUI.updateSimulationState(state);
      }
    });

    // 2. Инициализация UI карточки города
    this.cityCardUI = new CityCardUI(this.cardContainer, (city) => {
      this.enterCityWorld(city);
    });

    // 3. Инициализация UI 3D мира WorldClaw
    this.worldUI = new WorldClawPromptUI(this.worldUiContainer, {
      onBackToMap: () => this.backToRussiaMap(),
      onCameraMode: (mode) => {
        if (this.worldEngine) this.worldEngine.setCameraMode(mode);
      },
      onTimeOfDay: (preset) => {
        if (this.worldEngine) this.worldEngine.setTimeOfDay(preset);
      },
      onPlayEvent: () => {
        this.eventSimulator.start();
      },
      onPauseEvent: () => {
        this.eventSimulator.pause();
      },
      onStopEvent: () => {
        this.eventSimulator.stop();
      },
      onSelectStep: (idx) => {
        this.eventSimulator.goToStep(idx);
      },
      onRegenerateWorld: (city) => {
        this.enterCityWorld(city);
      }
    });

    // 4. Инициализация Главного HUD Карты РФ
    this.hudUI = new HudOverlay(this.hudContainer, {
      onSelectCity: (city) => {
        this.selectCity(city);
      },
      onToggleAutoRotate: () => {
        return this.russiaMap ? this.russiaMap.toggleAutoRotate() : false;
      },
      onResetCamera: () => {
        if (this.russiaMap) this.russiaMap.resetCamera();
      },
      onViewTop: () => {
        if (this.russiaMap) this.russiaMap.setViewTop();
      },
      onViewIso: () => {
        if (this.russiaMap) this.russiaMap.setViewIso();
      }
    });

    // 5. Инициализация 3D Карты РФ
    this.russiaMap = new RussiaMap3D(this.mapViewport, {
      onCitySelect: (city) => {
        this.selectCity(city);
      },
      onCityHover: (city) => {
        // Можно выводить мини-подсказку
      }
    });

    // Автоматический запуск киберпанк саундтрека при первом взаимодействии пользователя
    const startAudio = () => {
      soundFx.init();
      if (soundFx.enabled) {
        soundFx.startMusic();
      }
    };
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    window.addEventListener('wheel', startAudio, { once: true });
  }

  selectCity(city) {
    this.selectedCity = city;
    if (this.russiaMap) {
      this.russiaMap.focusCity(city);
    }
    if (this.cityCardUI) {
      this.cityCardUI.show(city);
    }
  }

  enterCityWorld(city) {
    this.currentMode = 'world';
    this.selectedCity = city;

    // Скрыть карту и HUD карты
    this.mapViewport.classList.add('hidden');
    this.hudUI.hide();
    this.cityCardUI.hide();

    // Показать вьюпорт 3D мира
    this.worldViewport.classList.remove('hidden');

    // Очистить предыдущий движок мира, если был
    if (this.worldEngine) {
      this.worldEngine.destroy();
      this.worldEngine = null;
    }

    // Создать новый 3D мир по схеме генерального плана
    this.worldEngine = new WorldClawEngine(this.worldViewport, city, {
      onZoneClick: (zone) => {
        if (this.worldUI) {
          this.worldUI.showZoneInfo(zone);
        }
      }
    });

    // Загрузить связанный сценарий событий
    const eventId = city.hunyuanWorld.events ? city.hunyuanWorld.events[0] : 'event_skd_assembly';
    this.eventSimulator.loadEvent(eventId);

    // Отобразить UI мира
    this.worldUI.show(city);
  }

  backToRussiaMap() {
    this.currentMode = 'map';

    // Остановить симуляцию
    this.eventSimulator.stop();

    // Уничтожить сцену 3D мира для освобождения памяти GPU
    if (this.worldEngine) {
      this.worldEngine.destroy();
      this.worldEngine = null;
    }

    // Скрыть UI мира и вьюпорт
    this.worldViewport.classList.add('hidden');
    this.worldUI.hide();

    // Показать карту РФ и HUD
    this.mapViewport.classList.remove('hidden');
    this.hudUI.show();

    if (this.selectedCity) {
      this.cityCardUI.show(this.selectedCity);
    }
  }
}

// Запуск приложения после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
