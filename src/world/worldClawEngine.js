import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { modelLoader } from './modelLoader.js';
import { textureGen } from './materials.js';
import { CityWorldBuilders } from './cityWorldBuilders.js';
import { soundFx } from '../audio/soundFx.js';

/**
 * WorldClawEngine — Модульный KitBash 3D-движок цифрового двойника
 * Точное воспроизведение генерального плана «Экосистема Дом Такси и Кибердеревня» (masterplan.jpg)
 * с живой анимацией людей, производства, ТЭЦ, теплиц и зарядного цикла электротакси.
 */
export class WorldClawEngine {
  constructor(container, cityData, options = {}) {
    this.container = container;
    this.cityData = cityData;
    this.options = options;
    this.onZoneClick = options.onZoneClick || null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    this.worldGroup = new THREE.Group();
    this.vehicles = [];
    this.chargingTaxis = [];
    this.testTrackCars = [];
    this.drones = [];
    this.conveyorCars = [];
    this.steamParticles = [];
    this.roboticArms = [];
    this.animatedHumans = [];
    this.interactiveObjects = [];
    this.blinkingBeacons = [];
    this.furnaceLights = [];
    this.weldingSparks = [];
    this.greenhouseMists = [];
    this.tppTurbineRotors = [];
    this.quantumRings = [];
    this.cncPresses = [];
    this.laserScanners = [];
    this.agvRobots = [];
    this.isDestroyed = false;

    // Режимы камеры
    this.cameraMode = 'masterplan';
    this.droneAngle = 0;
    this.timeOfDay = 'cyber_night'; // По умолчанию для всех городов: Киберпанк Ночь

    // First Person Controller
    this.fps = {
      isLocked: false,
      pitch: 0,
      yaw: 0,
      velocity: new THREE.Vector3(),
      position: new THREE.Vector3(0, 1.7, 50),
      speed: 16,
      sprintMultiplier: 1.9,
      isGrounded: true,
      verticalVelocity: 0,
      gravity: -28,
      jumpForce: 11,
      headBobTimer: 0,
      footstepTimer: 0
    };

    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false
    };

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Сцена: Глубокая атмосферная ночь по умолчанию (для всех городов)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x020611);
    this.scene.fog = new THREE.FogExp2(0x020611, 0.0012);

    // 2. Камера: Изометрическая перспектива (FOV 28° с диагональным углом)
    this.camera = new THREE.PerspectiveCamera(28, width / height, 0.5, 3500);
    this.camera.position.set(165, 140, 165);

    // 3. Рендерер с оптимизированным PBR для сверхплавной работы 60-120 FPS
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      precision: "mediump"
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25)); // Идеальная четкость и высокий FPS
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.85; // Мягкая натуральная экспозиция (как в Blender)
    this.container.replaceChildren(this.renderer.domElement);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 20;
    this.controls.maxDistance = 550;
    this.controls.target.set(0, 5, -10);

    // 5. Освещение и купол неба
    this.buildAtmosphere();
    this.setupLighting();

    // 5.1. PBR HDR Окружение
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose(); // Освобождаем GPU-память

    this.usePostProcessing = false; // Прямой аппаратный рендеринг дает 60+ FPS без микрофризов

    // 6. Сборка 3D Мира в зависимости от выбранного города
    this.scene.add(this.worldGroup);
    const cityId = this.cityData?.id || 'serpukhov';

    if (cityId === 'moscow') {
      CityWorldBuilders.buildMoscow(this);
      this.spawnRoadTraffic();
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'kemerovo') {
      CityWorldBuilders.buildKemerovo(this);
      this.createSteamParticleSystem();
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'vladivostok') {
      CityWorldBuilders.buildVladivostok(this);
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'kazan') {
      CityWorldBuilders.buildKazan(this);
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'spb') {
      CityWorldBuilders.buildSpb(this);
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'ekaterinburg') {
      CityWorldBuilders.buildEkaterinburg(this);
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'novosibirsk') {
      CityWorldBuilders.buildNovosibirsk(this);
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else if (cityId === 'sochi') {
      CityWorldBuilders.buildSochi(this);
      this.spawnRoadTraffic();
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
    } else {
      // Серпухов: Флагманский генеральный план
      this.buildGroundAndRoads();
      this.buildArchitecturalDomTaxiHub();
      this.buildArchitecturalSkdFactory();
      this.buildArchitecturalAgroPowerComplex();
      this.buildArchitecturalTechCenterSkyscraper();
      this.buildArchitecturalUniversityCampus();
      this.buildParkEnvironment();

      // 7. Спавн активных систем: Трафик, Зарядка, Производство, Люди, Роботы, Дым
      this.spawnRoadTraffic();
      this.spawnChargingCycleTaxis();
      this.spawnTestTrackCars();
      this.spawnHumanWorkers();
      this.spawnPatrolDrones();
      this.createSteamParticleSystem();
      this.spawnProductionSimulations();
    }

    this.buildFacilityNameBadges();

    // 8. Слушатели событий
    this.setupEventListeners();

    // 9. Запуск цикла анимации
    this.animate();

    // 10. Фоновый апгрейд GLB-моделей
    modelLoader.preloadModels().then(() => {
      try {
        this._upgradeAllModelsToGlb();
      } catch (e) {
        console.warn('[WorldEngine] GLB upgrade notice:', e);
      }
    }).catch((err) => {
      console.warn('[WorldEngine] GLB load fallback active:', err);
    });
  }

  _upgradeAllModelsToGlb() {
    const cityId = this.cityData?.id || 'serpukhov';
    if (cityId !== 'serpukhov') return; // Only upgrade full Blender masterplan models for Serpukhov!

    this.vehicles.forEach((v, idx) => {
      const isTruck = idx === 2 || idx === 6;
      const cType = idx % 2 === 0 ? 'yellow' : 'blue';
      const parent = v.group?.parent;
      if (!parent) return;

      const pos = v.group.position.clone();
      const rot = v.group.rotation.clone();
      parent.remove(v.group);

      const newVehicle = isTruck ? modelLoader.createBydTruck() : modelLoader.createBydTaxi(cType);
      newVehicle.position.copy(pos);
      newVehicle.rotation.copy(rot);
      parent.add(newVehicle);
      v.group = newVehicle;
    });

    this.conveyorCars.forEach((car, idx) => {
      const parent = car?.parent;
      if (!parent) return;

      const pos = car.position.clone();
      const rot = car.rotation.clone();
      parent.remove(car);

      const newCar = modelLoader.createBydTaxi(idx % 2 === 0 ? 'red' : 'blue');
      newCar.position.copy(pos);
      newCar.rotation.copy(rot);
      parent.add(newCar);
      this.conveyorCars[idx] = newCar;
    });

    // 3. Blender Архитектурные комплексы Высокой детализации (с проходимыми интерьерами)
    if (modelLoader.agroPowerGltf && this.agroGroup) {
      const parent = this.agroGroup.parent;
      if (parent) {
        parent.remove(this.agroGroup);
        const blenderAgro = modelLoader.createBlenderAgroPowerComplex();
        blenderAgro.position.set(-190, 0, 0); // Точные координаты из Blender Masterplan
        parent.add(blenderAgro);
        this.agroGroup = blenderAgro;
      }
    }

    if (modelLoader.vityazHubGltf && this.hubGroup) {
      const parent = this.hubGroup.parent;
      if (parent) {
        parent.remove(this.hubGroup);
        const blenderHub = modelLoader.createBlenderVityazTaxiHub();
        blenderHub.position.set(0, 0, 0);
        blenderHub.rotation.y = Math.PI; // Развернут лицом к зрителю и центральной дороге!
        parent.add(blenderHub);
        this.hubGroup = blenderHub;
      }
    }

    if (modelLoader.skdFactoryGltf && this.factoryGroup) {
      const parent = this.factoryGroup.parent;
      if (parent) {
        parent.remove(this.factoryGroup);
        const blenderFactory = modelLoader.createBlenderSkdFactory();
        blenderFactory.position.set(0, 0, -115);
        blenderFactory.rotation.y = Math.PI; // Развернут передом к зрителю и центральной дороге!
        parent.add(blenderFactory);
        this.factoryGroup = blenderFactory;
      }
    }

    if (modelLoader.techSkyscraperGltf && this.techGroup) {
      const parent = this.techGroup.parent;
      if (parent) {
        parent.remove(this.techGroup);
        const blenderTech = modelLoader.createBlenderTechSkyscraper();
        blenderTech.position.set(130, 0, 20); // Восточный технологический кластер
        parent.add(blenderTech);
        this.techGroup = blenderTech;
      }
    }

    if (modelLoader.dronePortGltf) {
      if (this.dronePortGroup && this.dronePortGroup.parent) {
        this.dronePortGroup.parent.remove(this.dronePortGroup);
      }
      const blenderDronePort = modelLoader.createBlenderDronePort();
      blenderDronePort.position.set(130, 0, -50); // Вплотную к Башне Кибердеревни (Техноцентру)
      this.worldGroup.add(blenderDronePort);
      this.dronePortGroup = blenderDronePort;
    }

    console.log('[WorldEngine] ✅ KitBash & Blender 3D assets upgraded to full GLB fidelity!');
  }

  buildAtmosphere() {
    // Глубокий ночной купол неба
    const skyGeom = new THREE.SphereGeometry(1200, 32, 24);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x020611, side: THREE.BackSide });
    this.sky = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.sky);
  }

  setupLighting() {
    // 1. Ночной мягкий рассеянный свет (киберпанк синий)
    this.ambientLight = new THREE.AmbientLight(0x0a192f, 0.35);
    this.scene.add(this.ambientLight);

    // 2. Кибернетический лунный направленный свет со сбалансированными мягкими тенями
    this.sunLight = new THREE.DirectionalLight(0x00f0ff, 0.75);
    this.sunLight.position.set(130, 180, 130);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.radius = 1.5;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 550;
    this.sunLight.shadow.camera.left = -220;
    this.sunLight.shadow.camera.right = 220;
    this.sunLight.shadow.camera.top = 220;
    this.sunLight.shadow.camera.bottom = -220;
    this.sunLight.shadow.bias = -0.0002;
    this.scene.add(this.sunLight);

    // 3. Заполняющий фиолетовый неон горизонта (Fill Light)
    const fillLight = new THREE.DirectionalLight(0xa855f7, 0.45);
    fillLight.position.set(-120, 100, -110);
    this.scene.add(fillLight);

    // 4. Яркая неоновая подсветка центрального хаба и зарядных комплексов
    this.hubLight = new THREE.PointLight(0x00f0ff, 3.2, 120);
    this.hubLight.position.set(0, 18, 15);
    this.scene.add(this.hubLight);
  }

  /**
   * ТЕРРЕЙН, ПЛОЩАДИ И ЧИСТАЯ ДОРОЖНАЯ СЕТЬ В LEGO-СТИЛИСТИКЕ
   */
  buildGroundAndRoads() {
    // 1. Чистая гладкая зеленая пластина Lego Baseplate (1400 x 1400)
    const groundGeom = new THREE.PlaneGeometry(1400, 1400);
    groundGeom.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x2e7d32, // Чистый гладкий зеленый Lego-пластик (без шума и лагов)
      roughness: 0.55,
      metalness: 0.02
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.worldGroup.add(ground);

    // 2. Мощеные площади для секторов из гладких Lego-плит
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.05
    });

    // Центральная площадь «Дом Такси»
    const plazaCenter = new THREE.Mesh(new THREE.PlaneGeometry(95, 75), plazaMat);
    plazaCenter.rotateX(-Math.PI / 2);
    plazaCenter.position.set(0, 0.08, 15);
    plazaCenter.receiveShadow = true;
    this.worldGroup.add(plazaCenter);

    // Площадь Завода SKD BYD (Север)
    const plazaNorth = new THREE.Mesh(new THREE.PlaneGeometry(130, 65), plazaMat);
    plazaNorth.rotateX(-Math.PI / 2);
    plazaNorth.position.set(12, 0.08, -60);
    plazaNorth.receiveShadow = true;
    this.worldGroup.add(plazaNorth);

    // Площадь Кибердеревни и Gigafactory (Восток)
    const plazaTech = new THREE.Mesh(new THREE.PlaneGeometry(100, 110), plazaMat);
    plazaTech.rotateX(-Math.PI / 2);
    plazaTech.position.set(80, 0.08, 25);
    plazaTech.receiveShadow = true;
    this.worldGroup.add(plazaTech);

    // Площадь ТЭЦ и Агрокомплекса (Запад)
    const plazaAgro = new THREE.Mesh(new THREE.PlaneGeometry(110, 100), plazaMat);
    plazaAgro.rotateX(-Math.PI / 2);
    plazaAgro.position.set(-65, 0.08, -15);
    plazaAgro.receiveShadow = true;
    this.worldGroup.add(plazaAgro);

    // 3. ДОРОЖНАЯ СЕТЬ (Гладкий темный Lego ABS-асфальт)
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.05
    });

    // 3.1 Главная скоростная магистраль
    const mainRoadGeom = new THREE.PlaneGeometry(22, 380);
    mainRoadGeom.rotateX(-Math.PI / 2);
    mainRoadGeom.rotateY(Math.PI / 6);
    const mainRoad = new THREE.Mesh(mainRoadGeom, roadMat);
    mainRoad.position.set(40, 0.12, 70);
    mainRoad.receiveShadow = true;
    this.worldGroup.add(mainRoad);

    // Разметка магистрали (двойная сплошная желтая)
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const stripeGeom = new THREE.PlaneGeometry(0.35, 380);
    stripeGeom.rotateX(-Math.PI / 2);
    stripeGeom.rotateY(Math.PI / 6);

    const stripeL = new THREE.Mesh(stripeGeom, stripeMat);
    stripeL.position.set(39.7, 0.15, 70);
    const stripeR = new THREE.Mesh(stripeGeom, stripeMat);
    stripeR.position.set(40.3, 0.15, 70);
    this.worldGroup.add(stripeL, stripeR);

    // 3.2 Заводской прямой проезд: Завод SKD (север) -> Дом Такси
    const factoryRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 170), roadMat);
    factoryRoad.rotateX(-Math.PI / 2);
    factoryRoad.position.set(0, 0.12, -25);
    factoryRoad.receiveShadow = true;
    this.worldGroup.add(factoryRoad);

    // 3.3 Выделенная подъездная петля к Зарядному фронту «Дом Такси»
    const chargeLoop = new THREE.Mesh(new THREE.PlaneGeometry(54, 18), roadMat);
    chargeLoop.rotateX(-Math.PI / 2);
    chargeLoop.position.set(0, 0.13, 26);
    chargeLoop.receiveShadow = true;
    this.worldGroup.add(chargeLoop);

    // 3.4 Проезд к Автосалону розничной продажи
    const showroomRoad = new THREE.Mesh(new THREE.PlaneGeometry(36, 14), roadMat);
    showroomRoad.rotateX(-Math.PI / 2);
    showroomRoad.position.set(38, 0.12, -32);
    showroomRoad.receiveShadow = true;
    this.worldGroup.add(showroomRoad);

    // 3.5 Дорога Кибердеревни к полигону
    const techRoad = new THREE.Mesh(new THREE.PlaneGeometry(14, 80), roadMat);
    techRoad.rotateX(-Math.PI / 2);
    techRoad.position.set(65, 0.12, 20);
    techRoad.receiveShadow = true;
    this.worldGroup.add(techRoad);
  }

  /**
   * СЕКТОР 1: ИНФРАСТРУКТУРА «ДОМ ТАКСИ» И ЭЛЕКТРОХАБ «ВИТЯЗЬ»
   */
  buildArchitecturalDomTaxiHub() {
    const hubGroup = new THREE.Group();
    hubGroup.position.set(0, 0, 0);
    hubGroup.rotation.y = Math.PI; // Развернут лицом к зрителю и главной дороге

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.15, roughness: 0.6 });
    const slateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.25 });
    const blueRoofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1,
      metalness: 0.9
    });

    // 1. Главный 2-этажный корпус «Дом Такси»
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(34, 4.8, 20), whiteMat);
    floor1.position.set(0, 2.4, 0);
    floor1.castShadow = true;
    hubGroup.add(floor1);

    const cornice = new THREE.Mesh(new THREE.BoxGeometry(35, 0.6, 21), slateMat);
    cornice.position.set(0, 5.1, 0);
    hubGroup.add(cornice);

    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(34, 4.8, 20), whiteMat);
    floor2.position.set(0, 7.8, 0);
    floor2.castShadow = true;
    hubGroup.add(floor2);

    // Витражные окна
    for (let f = 0; f < 2; f++) {
      const y = f === 0 ? 2.4 : 7.8;
      for (let w = 0; w < 7; w++) {
        const wx = (w - 3) * 4.5;
        const win = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 0.2), glassMat);
        win.position.set(wx, y, 10.1);
        hubGroup.add(win);
      }
    }

    // Синяя покатая крыша
    const roof = new THREE.Mesh(new THREE.BoxGeometry(36, 1.8, 22), blueRoofMat);
    roof.position.set(0, 11.0, 0);
    hubGroup.add(roof);

    // Вывеска «ЭЛЕКТРОХАБ «ВИТЯЗЬ»»
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(22, 3.0, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, emissive: 0x00f0ff, emissiveIntensity: 2.2 })
    );
    signBoard.position.set(0, 13.0, 10.4);
    hubGroup.add(signBoard);

    // 2. Левое крыло: Блок Телемедицинского Контроля
    const telemed = new THREE.Mesh(new THREE.BoxGeometry(16, 8.0, 18), whiteMat);
    telemed.position.set(-23, 4.0, 2);
    telemed.castShadow = true;
    telemed.userData = {
      name: "Центр Телемедицинского Контроля",
      desc: "Автоматизированные экспресс-терминалы предрейсового медосмотра водителей, электронные путевые листы, ТО и мойка."
    };
    hubGroup.add(telemed);
    this.interactiveObjects.push(telemed);

    // Объемный светящийся Красный Крест
    const crossMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 3.5 });
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.4, 4.5, 0.5), crossMat);
    crossV.position.set(-23, 5.5, 11.4);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.4, 0.5), crossMat);
    crossH.position.set(-23, 5.5, 11.4);
    hubGroup.add(crossV, crossH);

    // 3. Красно-белая дымовая труба высотой 34м
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.4, 34, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 })
    );
    chimney.position.set(-30, 17, -14);
    hubGroup.add(chimney);

    [10, 16, 22, 28].forEach((yPos) => {
      const redBand = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 1.9, 3.2, 24),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      redBand.position.set(-30, yPos, -14);
      hubGroup.add(redBand);
    });

    const beacon = new THREE.PointLight(0xef4444, 2.5, 35);
    beacon.position.set(-30, 34.5, -14);
    hubGroup.add(beacon);
    this.blinkingBeacons.push(beacon);

    // 4. Зарядный фронт: Навес с 6 ультрабыстрыми станциями 240 кВт
    const canopyRoof = new THREE.Mesh(new THREE.BoxGeometry(42, 0.8, 16), blueRoofMat);
    canopyRoof.position.set(0, 7.5, 23);
    canopyRoof.castShadow = true;
    hubGroup.add(canopyRoof);

    for (let c = 0; c < 6; c++) {
      const colX = (c - 2.5) * 6.6;

      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.5, 0.5), slateMat);
      pole.position.set(colX, 3.75, 23);
      hubGroup.add(pole);

      const pillar = modelLoader.createChargingPillar240kW();
      pillar.position.set(colX, 0, 27);
      hubGroup.add(pillar);

      pillar.userData = {
        name: `ЭЗС «Витязь» #${c + 1} (240 кВт Liquid-Cooled)`,
        desc: "Ультрабыстрая зарядка BYD E6 за 25-30 минут. Пропускная способность хаба: до 580 авто в сутки."
      };
      this.interactiveObjects.push(pillar);
    }

    // 5. Фабрика-Кухня с арочной стеклянной крышей (горячее питание)
    const kitchenGroup = new THREE.Group();
    kitchenGroup.position.set(-24, 0, 42);

    const kitchenBody = new THREE.Mesh(new THREE.BoxGeometry(22, 5.5, 16), whiteMat);
    kitchenBody.position.y = 2.75;
    kitchenGroup.add(kitchenBody);

    const kitchenRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(6.0, 6.0, 22, 24, 1, false, 0, Math.PI),
      glassMat
    );
    kitchenRoof.rotateZ(Math.PI / 2);
    kitchenRoof.position.set(0, 5.5, 0);
    kitchenGroup.add(kitchenRoof);

    kitchenGroup.userData = {
      name: "Фабрика-Кухня",
      desc: "Собственное сырье из теплиц, горячее питание для водителей такси и населения."
    };
    hubGroup.add(kitchenGroup);
    this.interactiveObjects.push(kitchenBody);

    // 6. Цех сборки собственных зарядных станций (справа)
    const chargerPlant = new THREE.Mesh(new THREE.BoxGeometry(22, 8.5, 18), whiteMat);
    chargerPlant.position.set(30, 4.25, 14);
    chargerPlant.castShadow = true;
    chargerPlant.userData = {
      name: "Собственное производство зарядных станций",
      desc: "После 20 станций: переход на сборку собственных ЭЗС 240 кВт для получения государственных субсидий."
    };
    hubGroup.add(chargerPlant);
    this.interactiveObjects.push(chargerPlant);

    this.hubGroup = hubGroup;
    this.worldGroup.add(hubGroup);
  }

  /**
   * СЕКТОР 2: ЗАВОД КРУПНОУЗЛОВОЙ СБОРКИ [SKD] BYD
   */
  buildArchitecturalSkdFactory() {
    const factoryGroup = new THREE.Group();
    factoryGroup.position.set(0, 0, -115);
    factoryGroup.rotation.y = Math.PI; // Развернут лицом к дороге и центру

    const bluePanelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.25 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.35 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });

    // Главный цех завода
    const factoryBody = new THREE.Mesh(new THREE.BoxGeometry(60, 18, 32), bluePanelMat);
    factoryBody.position.y = 9.0;
    factoryBody.castShadow = true;
    factoryBody.userData = {
      name: "Завод Крупноузловой Сборки [SKD] BYD",
      desc: "Серийная сборка электромобилей BYD E6/E7, кроссоверов Han/Xia и грузовиков T5. Темп: 100 → 1000 авто/мес."
    };
    factoryGroup.add(factoryBody);
    this.interactiveObjects.push(factoryBody);

    // Белые колонны и окантовка
    for (let c = 0; c < 5; c++) {
      const colX = (c - 2) * 14.5;
      const colF = new THREE.Mesh(new THREE.BoxGeometry(1.2, 18.2, 1.2), whiteMat);
      colF.position.set(colX, 9.1, 16.1);
      factoryGroup.add(colF);
    }

    // 3 пилообразных световых фонаря крыши
    for (let r = 0; r < 3; r++) {
      const skylight = new THREE.Mesh(
        new THREE.CylinderGeometry(5.5, 5.5, 58, 3),
        new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 })
      );
      skylight.rotateZ(Math.PI / 2);
      skylight.position.set(0, 20.8, (r - 1) * 9.5);
      factoryGroup.add(skylight);
    }

    // 2 красно-белые дымовые трубы на крыше завода
    [-15, 15].forEach((tx) => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 16, 16), whiteMat);
      stack.position.set(tx, 26, -10);
      factoryGroup.add(stack);

      const redBand = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 3.5, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      redBand.position.set(tx, 29, -10);
      factoryGroup.add(redBand);
    });

    // ЖЕЛТАЯ МОТОРИЗОВАННАЯ КОНВЕЙЕРНАЯ ЭСТАКАДА С РОБОТАМИ
    const conveyorTrack = new THREE.Mesh(new THREE.BoxGeometry(68, 2.2, 9.0), steelMat);
    conveyorTrack.position.set(16, 1.1, 26);
    factoryGroup.add(conveyorTrack);

    for (let rob = 0; rob < 4; rob++) {
      const rx = (rob - 1.5) * 16 + 16;
      const gantryData = modelLoader.createYellowConveyorGantry(12);
      gantryData.group.position.set(rx, 0, 26);
      factoryGroup.add(gantryData.group);
      this.roboticArms.push({ group: gantryData.group, light: gantryData.light, phase: rob * Math.PI * 0.5 });
    }

    [-16, 0, 16, 32].forEach((xPos, idx) => {
      const car = modelLoader.createBydTaxi(idx % 2 === 0 ? 'red' : 'blue');
      car.position.set(xPos, 2.2, 26);
      factoryGroup.add(car);
      this.conveyorCars.push(car);
    });

    // ЛЕГО-БАШНЯ МАСШТАБИРОВАНИЯ (2 000 000 АВТО ЗА 5 ЛЕТ)
    const legoTower = modelLoader.createLegoScalingTower();
    legoTower.position.set(58, 0, -10);
    legoTower.userData = {
      name: "План масштабирования: 2 000 000 авто за 5 лет",
      desc: "Этапы выпуска: 0-6 мес (100) → 6-12 мес (250) → 12-18 мес (500) → 16-24 мес (1000 авто/мес)."
    };
    factoryGroup.add(legoTower);
    this.interactiveObjects.push(legoTower);

    // АВТОСАЛОН РОЗНИЧНОЙ ПРОДАЖИ (30%)
    const showroomGroup = new THREE.Group();
    showroomGroup.position.set(54, 0, 26);

    const showroomBody = new THREE.Mesh(
      new THREE.BoxGeometry(24, 9, 20),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 })
    );
    showroomBody.position.y = 4.5;
    showroomGroup.add(showroomBody);

    showroomGroup.userData = {
      name: "Автосалон Розничной Продажи (30%)",
      desc: "Реализация легковых авто BYD Han/Xia и электрогрузовиков T5 частным и корпоративным покупателям."
    };
    factoryGroup.add(showroomGroup);
    this.interactiveObjects.push(showroomBody);

    this.factoryGroup = factoryGroup;
    this.worldGroup.add(factoryGroup);
  }

  /**
   * СЕКТОР 3: ЭНЕРГЕТИКА И АГРОКОМПЛЕКС «ЧИСТАЯ СТРАНА»
   */
  buildArchitecturalAgroPowerComplex() {
    const agroGroup = new THREE.Group();
    agroGroup.position.set(-185, 0, 45); // Отодвинут от Витязя на 185 метров для максимального простора

    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.2, roughness: 0.8 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.1, roughness: 0.8 });
    const redRoofMat = new THREE.MeshStandardMaterial({ color: 0xd90429, metalness: 0.2, roughness: 0.8 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.25 });

    // 1. УГОЛЬНАЯ ТЭЦ С УГОЛЬНОЙ ЭСТАКАДОЙ И ОГНЕМ ТОПКИ
    const coalGroup = new THREE.Group();
    coalGroup.position.set(-25, 0, -20);

    const coalBody = new THREE.Mesh(new THREE.BoxGeometry(26, 13, 18), concreteMat);
    coalBody.position.y = 6.5;
    coalGroup.add(coalBody);

    // Огонь топки котла ТЭЦ
    const furnaceGlow = new THREE.PointLight(0xff5500, 3.5, 25);
    furnaceGlow.position.set(0, 3, 9.5);
    coalGroup.add(furnaceGlow);
    this.furnaceLights.push(furnaceGlow);

    // Угольный конвейер подачи
    const coalConveyor = modelLoader.createCoalConveyorFeeder();
    coalConveyor.position.set(-15, 0, 0);
    coalGroup.add(coalConveyor);

    // 2 дымовые трубы
    for (let i = 0; i < 2; i++) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.2, 26, 16), whiteMat);
      stack.position.set(-6 + i * 8, 25, -4);
      coalGroup.add(stack);
    }

    coalBody.userData = {
      name: "Угольная ТЭЦ (в местах добычи)",
      desc: "Прямая автономная генерация энергии с минимальной себестоимостью доставки."
    };
    this.interactiveObjects.push(coalBody);
    agroGroup.add(coalGroup);

    // 2. ГАЗОВЫЕ ТЭЦ
    const gasGroup = new THREE.Group();
    gasGroup.position.set(25, 0, -45);

    const gasBody = new THREE.Mesh(new THREE.BoxGeometry(16, 11, 20), whiteMat);
    gasBody.position.set(-6, 5.5, 0);
    gasGroup.add(gasBody);

    const gasRoof = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 21, 3), redRoofMat);
    gasRoof.rotateX(Math.PI / 2);
    gasRoof.position.set(-6, 15, 0);
    gasGroup.add(gasRoof);

    const gasStack = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.6, 24, 16), whiteMat);
    gasStack.position.set(6, 12, -6);
    gasGroup.add(gasStack);

    const plasmaCore = new THREE.Mesh(
      new THREE.TorusGeometry(1.8, 0.4, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 3.5 })
    );
    plasmaCore.rotateX(Math.PI / 2);
    plasmaCore.position.set(6, 24.5, -6);
    gasGroup.add(plasmaCore);

    gasBody.userData = {
      name: "Газовые ТЭЦ (вблизи городов)",
      desc: "Экологически чистая генерация энергии с утилизацией сбросного тепла."
    };
    this.interactiveObjects.push(gasBody);
    agroGroup.add(gasGroup);

    // 3. СИНЯЯ СЕТЬ ТЕПЛОТРАСС СБРОСНОГО ТЕПЛА
    const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 75), pipeMat);
    pipe1.rotateZ(Math.PI / 2);
    pipe1.position.set(10, 1.6, -6);
    agroGroup.add(pipe1);

    const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 65), pipeMat);
    pipe2.rotateX(Math.PI / 2);
    pipe2.position.set(35, 1.6, 25);
    agroGroup.add(pipe2);

    // 4. 6 СТЕКЛЯННЫХ ТЕПЛИЦ «ЧИСТАЯ СТРАНА»
    const greenhouseGroup = new THREE.Group();
    greenhouseGroup.position.set(5, 0, 20);

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const gh = modelLoader.createGreenhouseModule(16, 12);
        gh.position.set(-18 + col * 18, 0, -10 + row * 22);
        greenhouseGroup.add(gh);

        gh.userData = {
          name: `Тепличный блок #${row * 3 + col + 1} «Чистая Страна»`,
          desc: "Круглогодичное выращивание зелени и овощей на дешевом сбросном тепле ТЭЦ."
        };
        this.interactiveObjects.push(gh);
      }
    }
    agroGroup.add(greenhouseGroup);

    // 5. АВТОНОМНЫЙ АГРО-РОВЕР (ЭЛЕКТРОТРАКТОР)
    const agroRover = modelLoader.createAgroRover();
    agroRover.position.set(-5, 0, 42);
    agroGroup.add(agroRover);

    // 6. ФЕРМА И ПРУД РЫБОВОДСТВА
    const farmGroup = new THREE.Group();
    farmGroup.position.set(48, 0, 30);

    const barn = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 20), whiteMat);
    barn.position.set(-6, 3.5, 0);
    farmGroup.add(barn);

    const barnRoof = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 21, 3), redRoofMat);
    barnRoof.rotateX(Math.PI / 2);
    barnRoof.position.set(-6, 10, 0);
    farmGroup.add(barnRoof);

    const pond = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 10, 0.4, 24),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 })
    );
    pond.position.set(12, 0.2, 6);
    farmGroup.add(pond);

    farmGroup.userData = {
      name: "Агрокомплекс: Животноводство и Рыбоводство",
      desc: "Собственное сырье, птицеводство и рыбоводство в синергии с энергогенерацией."
    };
    this.interactiveObjects.push(barn);
    agroGroup.add(farmGroup);

    this.agroGroup = agroGroup;
    this.worldGroup.add(agroGroup);
  }

  /**
   * СЕКТОР 4: КЛАСТЕР «КИБЕРДЕРЕВНЯ» — ПРОИЗВОДСТВО, GIGAFACTORY, ДАТА-ЦЕНТР И ЛАБОРАТОРИИ
   */
  buildArchitecturalTechCenterSkyscraper() {
    const techGroup = new THREE.Group();
    techGroup.position.set(115, 0, 45);

    const glassTowerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    // 1. Небоскреб Технологического центра
    const podium = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 26), frameMat);
    podium.position.y = 4.0;
    techGroup.add(podium);

    for (let f = 0; f < 10; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 22), frameMat);
      slab.position.y = 8.0 + f * 4.8;
      techGroup.add(slab);

      const glassSection = new THREE.Mesh(new THREE.BoxGeometry(21.2, 4.2, 21.2), glassTowerMat);
      glassSection.position.y = 10.1 + f * 4.8;
      glassSection.castShadow = true;
      techGroup.add(glassSection);
    }

    const spire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 1.4, 22, 16),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.0 })
    );
    spire.position.set(0, 67, 0);
    techGroup.add(spire);

    podium.userData = {
      name: "Кибердеревня: Технологический Центр",
      desc: "Штаб-квартира инноваций: Лаборатории ИИ, Институт, Больница, Спорткомплекс, Центр управления флотом электромобилей."
    };
    this.interactiveObjects.push(podium);

    // 2. GIGAFACTORY АККУМУЛЯТОРОВ И МИКРОЭЛЕКТРОНИКИ
    const gigafactory = modelLoader.createBatteryGigafactory();
    gigafactory.position.set(-25, 0, -42);
    gigafactory.userData = {
      name: "GigaFactory Твердотельных АКБ и Чипов",
      desc: "Автоматизированное роботизированное производство тяговых батарей и бортовой микроэлектроники автопилота."
    };
    techGroup.add(gigafactory);
    this.interactiveObjects.push(gigafactory);

    // 3. КВАНТОВЫЙ ДАТА-ЦЕНТР ИИ
    const dataCenter = modelLoader.createDataCenterBuilding();
    dataCenter.position.set(22, 0, -42);
    dataCenter.userData = {
      name: "Квантовый Дата-Центр и Серверная Нейросетей",
      desc: "Обработка телематики парка 600+ электротакси и обучение моделей автономного вождения."
    };
    techGroup.add(dataCenter);
    this.interactiveObjects.push(dataCenter);

    // 4. Светящийся Геодезический купол Лабораторий ИИ и АКБ
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(13, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.75,
        wireframe: true
      })
    );
    dome.position.set(28, 0, 24);
    dome.userData = {
      name: "Геокупол Лабораторий ИИ и АКБ",
      desc: "Освоение технологий твердотельных аккумуляторов, электродвигателей и нейросетей автопилота."
    };
    techGroup.add(dome);
    this.interactiveObjects.push(dome);

    const aiCore = modelLoader.createQuantumAiCore();
    aiCore.position.set(28, 6.5, 24);
    techGroup.add(aiCore);
    this.drones.push({ group: aiCore, isCore: true });

    // 5. Испытательный полигон роботов и дронов
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(11, 11, 0.5, 32),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.7 })
    );
    pad.position.set(26, 0.25, -12);
    pad.userData = {
      name: "Испытательная база (Роботы; Дроны)",
      desc: "Полигон автономных логистических роверов, коммунальной электротехники и БПЛА."
    };
    techGroup.add(pad);
    this.interactiveObjects.push(pad);

    this.techGroup = techGroup;
    this.worldGroup.add(techGroup);
  }

  /**
   * СЕКТОР 5: УНИВЕРСИТЕТСКИЙ КАМПУС И БОЛЬНИЦА
   */
  buildArchitecturalUniversityCampus() {
    const campusGroup = new THREE.Group();
    campusGroup.position.set(-85, 0, 75);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.3, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1
    });

    const blockA = new THREE.Mesh(new THREE.BoxGeometry(18, 8.5, 14), whiteMat);
    blockA.position.set(-10, 4.25, 0);
    campusGroup.add(blockA);

    const blockB = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 14), whiteMat);
    blockB.position.set(10, 6.0, 0);
    campusGroup.add(blockB);

    const skyBridge = new THREE.Mesh(new THREE.BoxGeometry(8, 3.5, 4), glassMat);
    skyBridge.position.set(0, 5.5, 0);
    campusGroup.add(skyBridge);

    campusGroup.userData = {
      name: "Институт и Больничный Комплекс",
      desc: "Подготовка молодых инженеров электроники и полный комплекс медицины для резидентов кластера."
    };
    this.interactiveObjects.push(blockA);
    this.worldGroup.add(campusGroup);
  }

  buildParkEnvironment() {
    const lampCoords = [
      [-14, 0, 30], [14, 0, 30], [-30, 0, 30], [30, 0, 30],
      [14, 0, -24], [-14, 0, -24], [40, 0, 0], [-40, 0, 0]
    ];

    lampCoords.forEach(([x, y, z]) => {
      const lamp = new THREE.Group();
      lamp.position.set(x, y, z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 7.5, 8), new THREE.MeshStandardMaterial({ color: 0x64748b }));
      pole.position.y = 3.75;
      lamp.add(pole);

      const head = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.0), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.2 }));
      head.position.y = 7.5;
      lamp.add(head);

      const pLight = new THREE.PointLight(0x00f0ff, 1.6, 28);
      pLight.position.y = 7.0;
      lamp.add(pLight);

      this.worldGroup.add(lamp);
    });

    const treeCoords = [
      [-36, 0, 46], [-44, 0, 42], [-40, 0, 52],
      [42, 0, 48], [50, 0, 52], [36, 0, 54],
      [-10, 0, 50], [10, 0, 50]
    ];

    treeCoords.forEach(([x, y, z]) => {
      const tree = new THREE.Group();
      tree.position.set(x, y, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 4.5, 8), new THREE.MeshStandardMaterial({ color: 0x78350f }));
      trunk.position.y = 2.25;
      tree.add(trunk);

      const crown = new THREE.Mesh(new THREE.ConeGeometry(2.8, 6.5, 8), new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 }));
      crown.position.y = 6.0;
      tree.add(crown);

      this.worldGroup.add(tree);
    });
  }

  /**
   * ЖИВОЙ ТРАФИК: 4-полосная скоростная магистраль
   */
  spawnRoadTraffic() {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const isTruck = i === 2 || i === 6;
      let vehicle;

      if (isTruck) {
        vehicle = modelLoader.createBydTruck();
      } else {
        const cType = i % 2 === 0 ? 'yellow' : 'blue';
        vehicle = modelLoader.createBydTaxi(cType);
      }

      this.worldGroup.add(vehicle);

      this.vehicles.push({
        group: vehicle,
        progress: (i / count) * 260 - 130,
        speed: 20 + Math.random() * 4,
        dir: i % 2 === 0 ? 1 : -1
      });
    }
  }

  /**
   * ЖИВОЙ ЦИКЛ ЗАРЯДКИ ЭЛЕКТРОТАКСИ: МАШИНЫ ЗАЕЗЖАЮТ НА ЭЗС, ЗАРЯЖАЮТСЯ И УЕЗЖАЮТ!
   */
  spawnChargingCycleTaxis() {
    const stallCount = 6;
    for (let stall = 0; stall < stallCount; stall++) {
      const colX = (stall - 2.5) * 6.6;
      const taxi = modelLoader.createBydTaxi(stall % 2 === 0 ? 'yellow' : 'blue');
      taxi.position.set(colX, 0, 27);
      taxi.rotation.y = 0;
      this.worldGroup.add(taxi);

      // Световой луч зарядки
      const chargeBeam = new THREE.PointLight(0x00f0ff, 2.5, 8);
      chargeBeam.position.set(colX, 1.8, 27);
      this.worldGroup.add(chargeBeam);

      this.chargingTaxis.push({
        group: taxi,
        stallX: colX,
        stallZ: 27,
        beam: chargeBeam,
        state: 'charging', // 'charging' | 'departing' | 'approaching'
        timer: stall * 2.2,
        cycleDuration: 12.0
      });
    }
  }

  /**
   * ТЕСТОВЫЙ ПОЛИГОН КИБЕРДЕРЕВНИ: АВТОНОМНЫЕ ПРОТОТИПЫ
   */
  spawnTestTrackCars() {
    const testCar = modelLoader.createBydTaxi('red');
    testCar.position.set(110, 0, 8);
    this.worldGroup.add(testCar);

    this.testTrackCars.push({
      group: testCar,
      angle: 0,
      radiusX: 18,
      radiusZ: 14,
      centerX: 110,
      centerZ: 8,
      speed: 1.4
    });
  }

  /**
   * ЖИВЫЕ АНИМИРОВАННЫЕ ЛЮДИ (ИНЖЕНЕРЫ, АГРОНОМЫ, УЧЕНЫЕ)
   */
  spawnHumanWorkers() {
    const workerConfigs = [
      // 1. Агрономы в теплицах
      { role: 'agronomist', x: -105, z: -15, pathRadius: 6, speed: 0.8 },
      { role: 'agronomist', x: -90, z: -5, pathRadius: 7, speed: 0.9 },
      { role: 'agronomist', x: -120, z: -25, pathRadius: 5, speed: 0.7 },

      // 2. Инженеры на ТЭЦ
      { role: 'worker', x: -130, z: -55, pathRadius: 8, speed: 1.0 },
      { role: 'worker', x: -80, z: -75, pathRadius: 6, speed: 0.85 },

      // 3. Водители и техники на Электрохабе «Витязь»
      { role: 'engineer', x: 0, z: 20, pathRadius: 10, speed: 1.1 },
      { role: 'engineer', x: -20, z: 12, pathRadius: 6, speed: 0.9 },
      { role: 'worker', x: 25, z: 18, pathRadius: 7, speed: 1.0 },

      // 4. Ученые и инженеры в Кибердеревне и Gigafactory
      { role: 'scientist', x: 60, z: -20, pathRadius: 9, speed: 0.95 },
      { role: 'scientist', x: 110, z: 45, pathRadius: 7, speed: 0.8 },
      { role: 'engineer', x: 85, z: 0, pathRadius: 12, speed: 1.2 },
      { role: 'scientist', x: -85, z: 75, pathRadius: 8, speed: 0.85 }
    ];

    workerConfigs.forEach((cfg) => {
      const human = modelLoader.createHumanCharacter(cfg.role);
      human.position.set(cfg.x, 0, cfg.z);
      this.worldGroup.add(human);

      this.animatedHumans.push({
        group: human,
        baseX: cfg.x,
        baseZ: cfg.z,
        radius: cfg.pathRadius,
        speed: cfg.speed,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  spawnPatrolDrones() {
    for (let d = 0; d < 4; d++) {
      const drone = modelLoader.createQuadcopterDrone();
      this.worldGroup.add(drone);
      this.drones.push({
        group: drone,
        rotors: drone.userData.rotors || [],
        radius: 45 + d * 25,
        speed: 0.35 + d * 0.12,
        altitude: 22 + d * 6,
        phase: d * (Math.PI / 2)
      });
    }
  }

  createSteamParticleSystem() {
    const smokeCount = 48;
    this.smokePuffs = [];

    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    const cityId = this.cityData?.id || 'serpukhov';
    let emitters = [];

    if (cityId === 'kemerovo') {
      emitters = [
        { x: -42, y: 42.0, z: -38 }, // Дымовая труба 1
        { x: -18, y: 42.0, z: -38 }, // Дымовая труба 2
        { x: -65, y: 28.0, z: -20 }, // Градирня 1 (пар)
        { x: 5,   y: 28.0, z: -20 }  // Градирня 2 (пар)
      ];
    } else {
      emitters = [
        { x: -243, y: 31.0, z: -1 }, // Coal TPP Chimney 1
        { x: -229, y: 31.0, z: -1 }, // Coal TPP Chimney 2
        { x: -152, y: 28.0, z: -5 }, // Gas TPP Chimney 1
        { x: -137, y: 24.0, z: -1 }  // Gas TPP Chimney 2
      ];
    }

    emitters.forEach((emit) => {
      const puffsPerEmitter = Math.floor(smokeCount / emitters.length);
      for (let i = 0; i < puffsPerEmitter; i++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(1.4, 8, 8), smokeMat.clone());
        const initialYOffset = (i / puffsPerEmitter) * 22;
        puff.position.set(
          emit.x,
          emit.y + initialYOffset,
          emit.z
        );
        this.worldGroup.add(puff);
        this.smokePuffs.push({
          mesh: puff,
          baseX: emit.x,
          baseY: emit.y,
          baseZ: emit.z,
          offsetY: initialYOffset,
          speed: 3.2 + Math.random() * 0.6,
          maxHeight: 25
        });
      }
    });
  }

  spawnProductionSimulations() {
    // 1. СВАРКА И ИСКРЫ НА ЗАВОДЕ SKD BYD (роботы со снопами искр)
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const sparkGeom = new THREE.SphereGeometry(0.12, 4, 4);

    const robotWeldingLocations = [
      { x: -16, y: 4.2, z: -115 + 28 },
      { x: 0,   y: 4.2, z: -115 + 28 },
      { x: 16,  y: 4.2, z: -115 + 28 },
      { x: 32,  y: 4.2, z: -115 + 28 },
      { x: -18, y: 3.5, z: -115 - 6 },
      { x: 0,   y: 3.5, z: -115 - 6 },
      { x: 18,  y: 3.5, z: -115 - 6 }
    ];

    robotWeldingLocations.forEach((loc) => {
      const flashLight = new THREE.PointLight(0x00f0ff, 0, 14);
      flashLight.position.set(loc.x, loc.y, loc.z);
      this.worldGroup.add(flashLight);

      const particles = [];
      for (let p = 0; p < 14; p++) {
        const spark = new THREE.Mesh(sparkGeom, sparkMat.clone());
        spark.position.set(loc.x, loc.y, loc.z);
        this.worldGroup.add(spark);
        particles.push({
          mesh: spark,
          base: { x: loc.x, y: loc.y, z: loc.z },
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * 5 + 1,
          vz: (Math.random() - 0.5) * 6,
          life: Math.random(),
          maxLife: 0.4 + Math.random() * 0.4
        });
      }

      this.weldingSparks.push({
        light: flashLight,
        particles,
        timer: Math.random() * 2,
        isWelding: false
      });
    });

    // 2. СИМУЛЯЦИЯ АВТОПОЛИВА И ТУМАНА В ТЕПЛИЦАХ
    const mistMat = new THREE.MeshBasicMaterial({ color: 0xa7f3d0, transparent: true, opacity: 0.25 });
    const mistGeom = new THREE.SphereGeometry(1.4, 6, 6);

    for (let row = 0; row < 2; row++) {
      const rZ = row === 0 ? 45 - 5 : 45 - 30;
      for (let col = 0; col < 4; col++) {
        const rX = -185 - 42.0 + col * 17.0;
        for (let m = 0; m < 2; m++) {
          const puff = new THREE.Mesh(mistGeom, mistMat.clone());
          puff.position.set(rX + (m - 0.5) * 3.5, 2.2, rZ);
          this.worldGroup.add(puff);
          this.greenhouseMists.push({
            mesh: puff,
            baseX: rX + (m - 0.5) * 3.5,
            baseY: 2.2,
            baseZ: rZ,
            phase: col + m + row * 2,
            speed: 0.8 + Math.random() * 0.4
          });
        }
      }
    }

    // 3. ВРАЩЕНИЕ ТУРБИН ТЭЦ
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 1.5, metalness: 0.9 });
    const turbineLocations = [
      { x: -185 - 40, y: 2.5, z: 45 - 25 },
      { x: -185 + 25, y: 3.0, z: 45 - 30 }
    ];
    turbineLocations.forEach(loc => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.2, 8, 24), rotorMat);
      ring.position.set(loc.x, loc.y, loc.z);
      ring.rotation.y = Math.PI / 2;
      this.worldGroup.add(ring);
      this.tppTurbineRotors.push(ring);
    });

    // 4. КВАНТОВЫЕ ОРБИТАЛЬНЫЕ КОЛЬЦА ИИ В ТЕХНОЦЕНТРЕ
    const qMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    for (let qr = 0; qr < 3; qr++) {
      const qRing = new THREE.Mesh(new THREE.TorusGeometry(3.0 + qr * 1.2, 0.08, 6, 32), qMat);
      qRing.position.set(115, 4.0, 45);
      qRing.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      this.worldGroup.add(qRing);
      this.quantumRings.push({ mesh: qRing, speedX: 1.2 + qr * 0.5, speedY: 0.8 + qr * 0.4 });
    }

    // 5. ДИНАМИЧЕСКИЕ ПРЕСС-ШТАМПЫ С ЧПУ (LEGO-СТИЛИСТИКА)
    const dieMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
    [
      { x: 18, z: -115 - 18, phase: 0 },
      { x: 8,  z: -115 - 18, phase: Math.PI }
    ].forEach(p => {
      const dieMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 2.6), dieMat);
      dieMesh.position.set(p.x, 3.2, p.z);
      this.worldGroup.add(dieMesh);
      this.cncPresses.push({ mesh: dieMesh, baseX: p.x, baseY: 3.2, baseZ: p.z, phase: p.phase });
    });

    // 6. ЛАЗЕРНАЯ ИНСПЕКЦИЯ ГЕОМЕТРИИ (QC СКАНИРОВАНИЕ)
    const scanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.1), scanMat);
    scanPlane.position.set(24, 2.4, -115 - 6);
    scanPlane.rotation.x = Math.PI / 2;
    this.worldGroup.add(scanPlane);
    this.laserScanners.push({ mesh: scanPlane, baseX: 24, baseY: 2.4, baseZ: -115 - 6 });

    // 7. АВТОНОМНЫЕ AGV-РОБОТЫ С LEGO-ГРУЗОМ
    const agvMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.5, roughness: 0.4 });
    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 });
    [
      { startX: -14, endX: 14, z: -115 - 12, speed: 4.5 },
      { startX: 18,  endX: -8, z: -115 - 10, speed: 3.8 }
    ].forEach((agvData) => {
      const agvGroup = new THREE.Group();
      const ch = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 1.4), agvMat);
      ch.position.y = 0.35;
      const cg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.1), cargoMat);
      cg.position.set(-0.2, 0.8, 0);
      const bcn = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      bcn.position.set(0.8, 0.65, 0.5);
      agvGroup.add(ch, cg, bcn);
      agvGroup.position.set(agvData.startX, 0.5, agvData.z);
      this.worldGroup.add(agvGroup);
      this.agvRobots.push({ group: agvGroup, ...agvData, currentX: agvData.startX, dir: 1 });
    });
  }

  buildFacilityNameBadges() {
    const cityId = this.cityData?.id || 'serpukhov';
    let badges = [];

    if (cityId === 'moscow') {
      badges = [
        { title: "Центральный комплекс «Дом Такси»", sub: "Диспетчеризация 600+ такси • Предрейсовый контроль", icon: "🏢", x: 0, y: 22, z: -25, color: "#00f0ff" },
        { title: "Мега-Электрохаб «Витязь» (11 станций)", sub: "11x 240 кВт Liquid-Cooled • До 600 авто/сутки", icon: "⚡", x: 0, y: 20, z: 25, color: "#0284c7" },
        { title: "Роботизированная автомойка", sub: "Экспресс-мойка за 4 минуты", icon: "🚿", x: 55, y: 18, z: 5, color: "#a855f7" },
        { title: "Центр Телемедицины водителей", sub: "Электронные путевые листы и медосмотр", icon: "🏥", x: -55, y: 18, z: 5, color: "#ef4444" }
      ];
    } else if (cityId === 'kemerovo') {
      badges = [
        { title: "Угольно-Газовый Энергоблок ТЭЦ", sub: "Автономная генерация электроэнергии (Кузбасс)", icon: "⚡", x: -30, y: 36, z: -20, color: "#f59e0b" },
        { title: "Градирни и система утилизации пара", sub: "Охлаждение контура и экофильтрация", icon: "💨", x: -65, y: 36, z: -20, color: "#00f0ff" },
        { title: "ОРУ 500 кВ (Трансформаторы)", sub: "Выдача мощности в единую сеть хабов", icon: "🔌", x: 50, y: 22, z: -20, color: "#0ea5e9" },
        { title: "Тепличный агрокомплекс «Чистая Страна»", sub: "8 модулей теплиц на сбросном тепле ТЭЦ", icon: "🌱", x: 0, y: 20, z: 35, color: "#22c55e" }
      ];
    } else if (cityId === 'vladivostok') {
      badges = [
        { title: "Морской SKD Порт «Владивосток»", sub: "Приемка контейнеровозов BYD из Азии", icon: "⚓", x: 0, y: 24, z: -30, color: "#e040fb" },
        { title: "Мега-краны STS (Ship-to-Shore)", sub: "Роботизированная перегрузка машинокомплектов", icon: "🏗️", x: 0, y: 36, z: -5, color: "#facc15" },
        { title: "Контейнерный терминал SKD BYD", sub: "1500+ комплектов авто в месяц", icon: "📦", x: 0, y: 20, z: 35, color: "#0284c7" },
        { title: "Ж/Д эстакада Владивосток → Серпухов", sub: "Транссибирская экспресс-доставка", icon: "🚆", x: 20, y: 20, z: 75, color: "#00f0ff" }
      ];
    } else if (cityId === 'kazan') {
      badges = [
        { title: "Дата-Центр Smart Grid и ИИ (Казань)", sub: "10 PFlops Neural Cloud • Динамические тарифы", icon: "🧠", x: 0, y: 26, z: 0, color: "#00ff9d" },
        { title: "Кампус «Иннополис»", sub: "Институт предиктивной телематики и автопилота", icon: "🌐", x: -38, y: 22, z: -15, color: "#00f0ff" },
        { title: "Демо-полигон беспилотных такси", sub: "Кольцевой трек испытаний автопилота", icon: "🏎️", x: 38, y: 22, z: -15, color: "#facc15" }
      ];
    } else if (cityId === 'spb') {
      badges = [
        { title: "Штаб-квартира «Дом Такси OS» (СПб)", sub: "Облачная платформа диспетчеризации 10 000+ авто", icon: "💻", x: 30, y: 55, z: -10, color: "#7b61ff" },
        { title: "Лаборатория сенсоров телемедицины", sub: "Бесконтактные диагностические модули", icon: "🔬", x: 30, y: 20, z: 30, color: "#00ff9d" }
      ];
    } else if (cityId === 'ekaterinburg') {
      badges = [
        { title: "Завод корпусов ЭЗС 240 кВт", sub: "Лазерная резка и бронированная сталь", icon: "🏭", x: -25, y: 26, z: -15, color: "#38bdf8" },
        { title: "Цех блочных подстанций (КТП)", sub: "Комплектные контейнерные трансформаторы", icon: "⚡", x: 40, y: 22, z: -15, color: "#0284c7" },
        { title: "Парк электрогрузовиков BYD T5", sub: "Логистическое снабжение хабов Урала", icon: "🚛", x: 0, y: 18, z: 20, color: "#facc15" }
      ];
    } else if (cityId === 'novosibirsk') {
      badges = [
        { title: "Институт Твердотельных АКБ (Новосибирск)", sub: "Академгородок • Ресурс 1 000 000 км", icon: "🔬", x: 0, y: 25, z: -15, color: "#2dd4bf" },
        { title: "Криогенная камера испытаний (-45°C)", sub: "Экстремальные зимние тесты Blade Battery", icon: "❄️", x: -35, y: 22, z: 22, color: "#00f0ff" },
        { title: "Стенд динамических испытаний моторов", sub: "Нагрузочные тесты синхронных приводов", icon: "⚙️", x: 35, y: 20, z: 22, color: "#f59e0b" }
      ];
    } else if (cityId === 'sochi') {
      badges = [
        { title: "Курортный Электрохаб «Дом Такси» Сочи", sub: "100% электрический флот • 150 электротакси", icon: "🌴", x: 0, y: 18, z: -25, color: "#f43f5e" },
        { title: "Солнечная электростанция (СЭС 2.5 МВт)", sub: "Чистая солнечная генерация энергии", icon: "☀️", x: 65, y: 16, z: -15, color: "#facc15" }
      ];
    } else {
      badges = [
        { title: "Завод сборки [SKD] BYD", sub: "Серийный выпуск 1000 авто/мес • Проходимый цех", icon: "🏭", x: 0, y: 25, z: -115, color: "#0284c7" },
        { title: "Цель: 2 000 000 авто за 5 лет", sub: "План масштабирования", icon: "🎯", x: 68, y: 35, z: -125, color: "#ef4444" },
        { title: "Электрохаб «Витязь» и Дом Такси", sub: "6 станций 240 кВт • Диспетчерская • Мойка", icon: "⚡", x: 0, y: 20, z: -12, color: "#00f0ff" },
        { title: "Медицинский центр (Телемедицина)", sub: "Предрейсовый осмотр", icon: "🏥", x: 28, y: 16, z: -6, color: "#ef4444" },
        { title: "Угольная ТЭЦ (2×150 МВт)", sub: "Автономная генерация • Турбинный зал", icon: "⚡", x: -240, y: 28, z: 20, color: "#f59e0b" },
        { title: "Газовая ТЭЦ (Газотурбинная)", sub: "3-скатный зал • Котлы HRSG • ГРП", icon: "🔥", x: -150, y: 28, z: 15, color: "#0ea5e9" },
        { title: "Тепличный агрокомплекс (2 ряда / 8 теплиц)", sub: "4 теплицы (овощи) + 4 теплицы (зелень/ягоды)", icon: "🌱", x: -200, y: 16, z: 62.5, color: "#22c55e" },
        { title: "Фабрика-кухня, Сад и Животноводство", sub: "Собственное сырье, фруктовый сад", icon: "🥩", x: -135, y: 20, z: 65, color: "#f97316" },
        { title: "Техноцентр «Кибердеревня»", sub: "Штаб-квартира инноваций • Атриум ИИ", icon: "🌐", x: 115, y: 55, z: 45, color: "#00f0ff" },
        { title: "Лаборатории ИИ и Квантовое ядро", sub: "Автономный флот такси", icon: "🧠", x: 95, y: 18, z: 65, color: "#a855f7" }
      ];
    }

    badges.forEach(b => {
      const sprite = this.createFloatingLabel(b.title, b.sub, b.color, b.icon);
      sprite.position.set(b.x, b.y, b.z);
      this.worldGroup.add(sprite);
    });
  }

  createFloatingLabel(title, subtitle = '', color = '#0284c7', icon = '📍') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // 1. Контрастный темный фон плашки
    ctx.fillStyle = '#060a16';
    ctx.beginPath();
    ctx.roundRect(10, 10, 1004, 236, 28);
    ctx.fill();

    // 2. Неоновая обводка
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.stroke();

    // 3. Акцентная плашка категории слева
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(10, 10, 32, 236, [28, 0, 0, 28]);
    ctx.fill();

    // 4. Иконка
    ctx.font = '68px sans-serif';
    ctx.fillText(icon, 65, 150);

    // 5. Заголовок
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(title, 160, 105);

    // 6. Подзаголовок
    if (subtitle) {
      ctx.fillStyle = '#93c5fd';
      ctx.font = '30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(subtitle, 160, 175);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(38, 9.5, 1);
    return sprite;
  }

  setupEventListeners() {
    this.onPointerDown = (e) => {
      if (this.cameraMode === 'firstPerson' && !this.fps.isLocked) {
        this.container.requestPointerLock?.();
        return;
      }

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveObjects, true);

      if (intersects.length > 0) {
        let root = intersects[0].object;
        while (root && !root.userData?.name && root.parent) {
          root = root.parent;
        }
        if (root && root.userData?.name && this.onZoneClick) {
          this.onZoneClick(root.userData);
        }
      }
    };

    this.onMouseMove = (e) => {
      if (this.cameraMode === 'firstPerson' && this.fps.isLocked) {
        const sens = 0.0022;
        this.fps.yaw -= e.movementX * sens;
        this.fps.pitch -= e.movementY * sens;
        this.fps.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.fps.pitch));
      }
    };

    this.onPointerLockChange = () => {
      this.fps.isLocked = document.pointerLockElement === this.container || document.pointerLockElement === this.renderer.domElement;
    };

    this.onKeyDown = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;
      if (e.code === 'Space' && this.fps.isGrounded) {
        this.fps.verticalVelocity = this.fps.jumpForce;
        this.fps.isGrounded = false;
        soundFx.playHover();
      }
    };

    this.onKeyUp = (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
    };

    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    soundFx.playPulse();

    const fpsHint = document.getElementById('fps-controls-hint');

    if (mode === 'masterplan' || mode === 'orbit') {
      this.controls.enabled = true;
      if (document.exitPointerLock) document.exitPointerLock();
      this.camera.position.set(165, 140, 165);
      this.controls.target.set(0, 5, -10);
      if (fpsHint) fpsHint.classList.add('hidden');
    } else if (mode === 'hub') {
      this.controls.enabled = true;
      if (document.exitPointerLock) document.exitPointerLock();
      this.camera.position.set(45, 30, 60);
      this.controls.target.set(0, 8, 5);
      if (fpsHint) fpsHint.classList.add('hidden');
    } else if (mode === 'skd') {
      this.controls.enabled = true;
      if (document.exitPointerLock) document.exitPointerLock();
      this.camera.position.set(45, 45, -70);
      this.controls.target.set(0, 12, -115);
      if (fpsHint) fpsHint.classList.add('hidden');
    } else if (mode === 'agro') {
      this.controls.enabled = true;
      if (document.exitPointerLock) document.exitPointerLock();
      this.camera.position.set(-75, 45, 95);
      this.controls.target.set(-115, 12, 45);
      if (fpsHint) fpsHint.classList.add('hidden');
    } else if (mode === 'tech') {
      this.controls.enabled = true;
      if (document.exitPointerLock) document.exitPointerLock();
      this.camera.position.set(155, 60, 95);
      this.controls.target.set(115, 25, 45);
      if (fpsHint) fpsHint.classList.add('hidden');
    } else if (mode === 'drone') {
      this.controls.enabled = false;
      if (document.exitPointerLock) document.exitPointerLock();
      if (fpsHint) fpsHint.classList.add('hidden');
    } else if (mode === 'firstPerson') {
      this.controls.enabled = false;
      this.fps.position.set(0, 1.7, 50);
      this.fps.yaw = Math.PI;
      this.fps.pitch = 0;
      this.camera.position.copy(this.fps.position);

      try {
        this.container.requestPointerLock?.();
      } catch (e) {}

      if (fpsHint) {
        fpsHint.classList.remove('hidden');
      } else {
        this.createFpsControlsHint();
      }
    }
  }

  createFpsControlsHint() {
    const hint = document.createElement('div');
    hint.id = 'fps-controls-hint';
    hint.className = 'fps-hud-hint';
    hint.innerHTML = `
      <div class="fps-crosshair">+</div>
      <div class="fps-instructions">
        <span>🎮 <b>РЕЖИМ ПРОГУЛКИ ОТ ПЕРВОГО ЛИЦА</b></span>
        <span>Кликните по экрану для захвата мыши • <b>WASD</b> — перемещение • <b>Shift</b> — ускорение • <b>Пробел</b> — прыжок • <b>ESC</b> — освободить мышь</span>
      </div>
    `;
    document.body.appendChild(hint);
  }

  setTimeOfDay(preset) {
    this.timeOfDay = preset;
    soundFx.playPulse();

    if (preset === 'cyber_night') {
      this.scene.background.setHex(0x020611); // Глубокая темная ночь
      this.scene.fog.color.setHex(0x020611);
      if (this.sky && this.sky.material) {
        this.sky.material.color.setHex(0x020611);
      }
      this.ambientLight.color.setHex(0x0a192f);
      this.ambientLight.intensity = 0.35; // Настоящая глубокая темнота
      this.sunLight.color.setHex(0x00f0ff);
      this.sunLight.intensity = 0.65;
      if (this.hubLight) {
        this.hubLight.intensity = 3.2;
        this.hubLight.color.setHex(0x00f0ff);
      }
    } else if (preset === 'sunset') {
      this.scene.background.setHex(0x1a0a06);
      this.scene.fog.color.setHex(0x1a0a06);
      if (this.sky && this.sky.material) {
        this.sky.material.color.setHex(0x28120c);
      }
      this.ambientLight.color.setHex(0xff7733);
      this.ambientLight.intensity = 0.45;
      this.sunLight.color.setHex(0xffaa00);
      this.sunLight.intensity = 1.1;
      if (this.hubLight) {
        this.hubLight.intensity = 1.0;
        this.hubLight.color.setHex(0xffaa00);
      }
    } else if (preset === 'day') {
      this.scene.background.setHex(0xf1f5f9);
      this.scene.fog.color.setHex(0xf1f5f9);
      if (this.sky && this.sky.material) {
        this.sky.material.color.setHex(0xf8fafc);
      }
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 0.45;
      this.sunLight.color.setHex(0xfff8ee);
      this.sunLight.intensity = 1.25;
      if (this.hubLight) {
        this.hubLight.intensity = 0.6;
        this.hubLight.color.setHex(0x38bdf8);
      }
    } else if (preset === 'dawn') {
      this.scene.background.setHex(0x0f081d);
      this.scene.fog.color.setHex(0x0f081d);
      if (this.sky && this.sky.material) {
        this.sky.material.color.setHex(0x1a0d2e);
      }
      this.ambientLight.color.setHex(0xa855f7);
      this.ambientLight.intensity = 0.4;
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.95;
      if (this.hubLight) {
        this.hubLight.intensity = 1.2;
        this.hubLight.color.setHex(0xa855f7);
      }
    }
  }

  animate = () => {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    // 1. Анимация роботов-сварщиков на конвейере
    this.roboticArms.forEach((arm) => {
      if (!arm || !arm.group) return;
      const swing = Math.sin(elapsedTime * 3.5 + (arm.phase || 0)) * 0.35;
      if (arm.group.children && arm.group.children[2]) {
        arm.group.children[2].rotation.z = swing;
      }
      if (arm.light) {
        arm.light.intensity = 2.0 + Math.sin(elapsedTime * 14 + (arm.phase || 0)) * 2.0;
      }
    });

    // 2. Движение электромобилей по скоростной трассе
    this.vehicles.forEach((v) => {
      if (!v || !v.group) return;
      v.progress = (v.progress || 0) + (v.speed || 10) * (v.dir || 1) * delta;
      if (v.progress > 140) v.progress = -140;
      if (v.progress < -140) v.progress = 140;

      const angle = Math.PI / 6;
      v.group.position.x = 40 + v.progress * Math.sin(angle) + (v.dir > 0 ? 5.5 : -5.5);
      v.group.position.z = 70 + v.progress * Math.cos(angle);
      v.group.rotation.y = v.dir > 0 ? angle : angle + Math.PI;
    });

    // 3. ЖИВОЙ ЦИКЛ ТАКСИСТОВ И ДОМА ТАКСИ:
    // Подъезд такси -> Таксист выходит -> Идет в здание -> Отдохнувший таксист выходит -> Садится в такси -> Уезжает на линию
    this.chargingTaxis.forEach((ct, idx) => {
      if (!ct || !ct.group) return;
      ct.timer = (ct.timer || 0) + delta;
      const duration = ct.cycleDuration || 14.0;
      const cycle = (ct.timer + idx * 4.5) % duration;
      const stallX = ct.stallX ?? ct.group.position.x;
      const stallZ = ct.stallZ ?? ct.group.position.z;

      if (cycle < 6.0) {
        // Фаза 1: Такси на ультрабыстрой зарядке «Витязь», водитель отдыхает в здании
        ct.group.position.set(stallX, 0, stallZ);
        ct.group.rotation.y = 0;
        if (ct.beam) ct.beam.intensity = 2.5 + Math.sin(elapsedTime * 6) * 1.5;
        if (ct.driverMesh) ct.driverMesh.visible = false;
      } else if (cycle < 8.0) {
        // Фаза 2: Отдохнувший таксист выходит из терминала и идет к заряженной машине
        const t = (cycle - 6.0) / 2.0;
        if (ct.driverMesh) {
          ct.driverMesh.visible = true;
          ct.driverMesh.position.set(stallX - 4 + t * 4, 0, stallZ - 8 + t * 6);
          ct.driverMesh.rotation.y = Math.PI / 4;
          // Шаги человечка
          if (ct.driverMesh.userData?.limbs) {
            const { armL, armR, legL, legR } = ct.driverMesh.userData.limbs;
            const w = Math.sin(elapsedTime * 12);
            if (legL) legL.rotation.x = w * 0.6;
            if (legR) legR.rotation.x = -w * 0.6;
            if (armL) armL.rotation.x = -w * 0.5;
            if (armR) armR.rotation.x = w * 0.5;
          }
        }
      } else if (cycle < 11.0) {
        // Фаза 3: Таксист сел в машину и выезжает на шоссе
        const t = (cycle - 8.0) / 3.0;
        if (ct.driverMesh) ct.driverMesh.visible = false;
        ct.group.position.z = stallZ + t * 45;
        ct.group.position.x = stallX + t * 25;
        ct.group.rotation.y = t * 0.5;
        if (ct.beam) ct.beam.intensity = 0.2;
      } else {
        // Фаза 4: Прибывает новое такси, останавливается, водитель выходит и идет в терминал
        const t = (cycle - 11.0) / 3.0;
        ct.group.position.z = stallZ + 45 - t * 45;
        ct.group.position.x = stallX - 25 + t * 25;
        ct.group.rotation.y = 0;
        if (ct.beam) ct.beam.intensity = 0.4 + t * 2.0;

        if (t > 0.6 && ct.driverMesh) {
          ct.driverMesh.visible = true;
          const dt = (t - 0.6) / 0.4;
          ct.driverMesh.position.set(stallX + 1 - dt * 5, 0, stallZ + 2 - dt * 8);
          ct.driverMesh.rotation.y = -Math.PI * 0.75;
          if (ct.driverMesh.userData?.limbs) {
            const { armL, armR, legL, legR } = ct.driverMesh.userData.limbs;
            const w = Math.sin(elapsedTime * 12);
            if (legL) legL.rotation.x = w * 0.6;
            if (legR) legR.rotation.x = -w * 0.6;
            if (armL) armL.rotation.x = -w * 0.5;
            if (armR) armR.rotation.x = w * 0.5;
          }
        }
      }
    });

    // 4. Тестовый трек автопилота в Кибердеревне
    this.testTrackCars.forEach((tc) => {
      tc.angle += tc.speed * delta;
      tc.group.position.x = tc.centerX + Math.cos(tc.angle) * tc.radiusX;
      tc.group.position.z = tc.centerZ + Math.sin(tc.angle) * tc.radiusZ;
      tc.group.rotation.y = -tc.angle + Math.PI / 2;
    });

    // 5. АНИМАЦИЯ ЛЮДЕЙ (ходьба, покачивание рук и ног)
    this.animatedHumans.forEach((h) => {
      h.angle += h.speed * 0.3 * delta;
      h.group.position.x = h.baseX + Math.cos(h.angle) * h.radius;
      h.group.position.z = h.baseZ + Math.sin(h.angle) * h.radius;
      h.group.rotation.y = -h.angle + Math.PI / 2;

      // Покачивание конечностей при ходьбе
      const walkCycle = Math.sin(elapsedTime * h.speed * 6 + h.phase);
      if (h.group.userData?.limbs) {
        const { armL, armR, legL, legR } = h.group.userData.limbs;
        if (legL) legL.rotation.x = walkCycle * 0.5;
        if (legR) legR.rotation.x = -walkCycle * 0.5;
        if (armL) armL.rotation.x = -walkCycle * 0.4;
        if (armR) armR.rotation.x = walkCycle * 0.4;
      }
    });

    // 6. Движение кузовов на конвейере завода SKD и Погрузка в Фуры-Автовозы
    this.conveyorCars.forEach((car) => {
      car.position.x += 6 * delta;
      if (car.position.x > 45) car.position.x = -20;
    });

    // 7. ЗАПУСК И ПОЛЕТЫ ДРОНОВ С ДРОНОПОРТА (Vertical Launch & Cargo Patrol)
    this.drones.forEach((d, idx) => {
      if (d.isCore) {
        d.group.rotation.y += 0.8 * delta;
        d.group.rotation.x += 0.4 * delta;
      } else {
        d.timer = (d.timer || 0) + delta;
        const dPeriod = 16.0;
        const dCycle = (d.timer + idx * 4.0) % dPeriod;

        if (dCycle < 3.0) {
          // Взлет вертикально с пусковой площадки Дронопорта
          const t = dCycle / 3.0;
          d.group.position.x = d.baseX || -90 + (idx % 2) * 20;
          d.group.position.z = d.baseZ || -90 + Math.floor(idx / 2) * 20;
          d.group.position.y = 1.2 + t * (d.altitude || 20);
          d.group.rotation.y += 1.2 * delta;
        } else if (dCycle < 13.0) {
          // Патрулирование и доставка груза по круговой траектории
          const ang = elapsedTime * (d.speed || 0.6) + (d.phase || idx);
          d.group.position.x = (d.centerX || 0) + Math.cos(ang) * (d.radius || 75);
          d.group.position.z = (d.centerZ || -40) + Math.sin(ang) * (d.radius || 75);
          d.group.position.y = (d.altitude || 20) + Math.sin(elapsedTime * 2.5 + idx) * 2.0;
          d.group.rotation.y = -ang + Math.PI / 2;
        } else {
          // Заход на посадку на площадку дронопорта
          const t = (dCycle - 13.0) / 3.0;
          d.group.position.x = d.baseX || -90 + (idx % 2) * 20;
          d.group.position.z = d.baseZ || -90 + Math.floor(idx / 2) * 20;
          d.group.position.y = (d.altitude || 20) * (1.0 - t) + 1.2;
          d.group.rotation.y += 0.5 * delta;
        }

        // Вращение 4 роторов
        if (d.rotors) {
          d.rotors.forEach(r => r.rotation.y += 50 * delta);
        }
      }
    });

    // 8. Динамический анимированный дым из труб ТЭЦ (ровно из жерла труб)
    if (this.smokePuffs) {
      this.smokePuffs.forEach((p) => {
        p.offsetY += p.speed * delta;
        if (p.offsetY > p.maxHeight) {
          p.offsetY = 0;
        }
        const prog = p.offsetY / p.maxHeight;
        p.mesh.position.y = p.baseY + p.offsetY;
        p.mesh.position.x = p.baseX + Math.sin(prog * Math.PI) * 0.3; // Прямой вертикальный подъем
        p.mesh.position.z = p.baseZ + Math.cos(prog * Math.PI) * 0.2;
        const scale = 0.8 + prog * 2.8; // Расширение клубов дыма
        p.mesh.scale.set(scale, scale, scale);
        p.mesh.material.opacity = (1.0 - prog) * 0.55; // Плавное растворение в воздухе
      });
    }

    // 9. Мерцание огня топки ТЭЦ
    this.furnaceLights.forEach((fl) => {
      fl.intensity = 2.5 + Math.sin(elapsedTime * 10 + Math.random()) * 1.5;
    });

    // 10. Сигнальные маяки
    this.blinkingBeacons.forEach((b) => {
      b.intensity = Math.sin(elapsedTime * 4) > 0 ? 3.0 : 0.2;
    });

    // 11. СИМУЛЯЦИЯ ПРОИЗВОДСТВА: Сварка роботами, искры, туман в теплицах, вращение турбин
    this.weldingSparks.forEach((ws) => {
      ws.timer -= delta;
      if (ws.timer <= 0) {
        ws.isWelding = !ws.isWelding;
        ws.timer = ws.isWelding ? (0.6 + Math.random() * 0.8) : (1.4 + Math.random() * 1.6);
      }
      ws.light.intensity = ws.isWelding ? (3.5 + Math.random() * 4.5) : 0;
      ws.particles.forEach((p) => {
        if (ws.isWelding) {
          p.mesh.visible = true;
          p.life += delta;
          if (p.life > p.maxLife) {
            p.life = 0;
            p.mesh.position.set(p.base.x, p.base.y, p.base.z);
            p.vx = (Math.random() - 0.5) * 6;
            p.vy = Math.random() * 4 + 1.2;
            p.vz = (Math.random() - 0.5) * 6;
          }
          p.vy -= 14 * delta; // Гравитация искр
          p.mesh.position.x += p.vx * delta;
          p.mesh.position.y += p.vy * delta;
          p.mesh.position.z += p.vz * delta;
          p.mesh.material.opacity = 1 - (p.life / p.maxLife);
        } else {
          p.mesh.visible = false;
        }
      });
    });

    this.greenhouseMists.forEach((gm) => {
      const mistProg = (elapsedTime * gm.speed + gm.phase) % Math.PI;
      gm.mesh.position.y = gm.baseY + Math.sin(mistProg) * 0.6;
      const s = 1.0 + Math.sin(mistProg) * 0.5;
      gm.mesh.scale.set(s, s, s);
      gm.mesh.material.opacity = 0.12 + Math.sin(mistProg) * 0.18;
    });

    this.tppTurbineRotors.forEach((rotor) => {
      rotor.rotation.z += 16 * delta;
    });

    this.quantumRings.forEach((qr) => {
      qr.mesh.rotation.x += qr.speedX * delta;
      qr.mesh.rotation.y += qr.speedY * delta;
    });

    // 12. АНИМАЦИЯ СТАНКОВ С ЧПУ, ЛАЗЕРНЫХ СКАНЕРОВ И AGV-РОБОТОВ
    this.cncPresses.forEach((cp) => {
      const stroke = Math.abs(Math.sin(elapsedTime * 3.0 + cp.phase));
      cp.mesh.position.y = cp.baseY - stroke * 1.4;
    });

    this.laserScanners.forEach((ls) => {
      const sweep = Math.sin(elapsedTime * 3.5) * 2.2;
      ls.mesh.position.z = ls.baseZ + sweep;
    });

    this.agvRobots.forEach((agv) => {
      agv.currentX += agv.dir * agv.speed * delta;
      const minX = Math.min(agv.startX, agv.endX);
      const maxX = Math.max(agv.startX, agv.endX);
      if (agv.currentX >= maxX) {
        agv.dir = -1;
        agv.group.rotation.y = Math.PI;
      } else if (agv.currentX <= minX) {
        agv.dir = 1;
        agv.group.rotation.y = 0;
      }
      agv.group.position.x = agv.currentX;
    });

    // 13. ПРОСТРАНСТВЕННЫЙ 3D АУДИОДВИЖОК ЗДАНИЙ
    const listenerPos = (this.cameraMode === 'firstPerson') ? this.fps.position : this.camera.position;
    soundFx.updateSpatialListener(listenerPos);

    // 13. Камера
    if (this.cameraMode === 'drone') {
      this.droneAngle += 0.15 * delta;
      const r = 160;
      this.camera.position.x = Math.cos(this.droneAngle) * r;
      this.camera.position.z = Math.sin(this.droneAngle) * r;
      this.camera.position.y = 85;
      this.camera.lookAt(0, 10, 0);
    } else if (this.cameraMode === 'firstPerson' && this.fps.isLocked) {
      this.updateFpsController(delta);
    } else if (this.controls.enabled) {
      this.controls.update();
    }

    if (this.usePostProcessing && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };

  updateFpsController(delta) {
    const moveDir = new THREE.Vector3();
    const forward = new THREE.Vector3(-Math.sin(this.fps.yaw), 0, -Math.cos(this.fps.yaw));
    const right = new THREE.Vector3(Math.cos(this.fps.yaw), 0, -Math.sin(this.fps.yaw));

    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    if (moveDir.lengthSq() > 0) moveDir.normalize();

    const curSpeed = this.keys.sprint ? this.fps.speed * this.fps.sprintMultiplier : this.fps.speed;
    this.fps.position.x += moveDir.x * curSpeed * delta;
    this.fps.position.z += moveDir.z * curSpeed * delta;

    if (!this.fps.isGrounded) {
      this.fps.verticalVelocity += this.fps.gravity * delta;
      this.fps.position.y += this.fps.verticalVelocity * delta;
      if (this.fps.position.y <= 1.7) {
        this.fps.position.y = 1.7;
        this.fps.verticalVelocity = 0;
        this.fps.isGrounded = true;
      }
    }

    if (moveDir.lengthSq() > 0 && this.fps.isGrounded) {
      this.fps.headBobTimer += delta * (this.keys.sprint ? 14 : 9);
      const bobOffset = Math.sin(this.fps.headBobTimer) * 0.08;
      this.camera.position.set(this.fps.position.x, this.fps.position.y + bobOffset, this.fps.position.z);
    } else {
      this.camera.position.copy(this.fps.position);
    }

    const euler = new THREE.Euler(this.fps.pitch, this.fps.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  destroy() {
    this.isDestroyed = true;
    window.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    const fpsHint = document.getElementById('fps-controls-hint');
    if (fpsHint) fpsHint.remove();

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
