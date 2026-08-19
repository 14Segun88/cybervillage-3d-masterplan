import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

/**
 * Загрузчик реальных 3D-моделей (.GLB) с точными пропорциями.
 * 
 * Известные нативные размеры моделей:
 *  - car_ferrari.glb: X=4.52, Y=2.26, Z=1.11 (ориентирован вдоль оси X, нужен поворот 90°)
 *  - truck_commercial.glb: X=4.87, Y=2.79, Z=3.01 (нужен поворот и масштаб)
 *
 * GLTFLoader.loadAsync() доступен в Three.js 0.173+
 */
export class ModelLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    
    // Поддержка сжатых моделей (Draco Compression)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    // Поддержка Meshopt Compression
    this.gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    this.carGltf = null;
    this.truckGltf = null;
    this.robotGltf = null;
    this.coreGltf = null;
    this.agroPowerGltf = null;
    this.vityazHubGltf = null;
    this.skdFactoryGltf = null;
    this.techSkyscraperGltf = null;
    this.dronePortGltf = null;
    this.isLoaded = false;
  }

  // Предзагрузка всех 3D-моделей (.GLB) через Promise.all (с защитой от кэширования браузера)
  preloadModels() {
    if (this.isLoaded) return Promise.resolve();

    const cacheBust = '?v=' + Date.now();
    const load = (url) => new Promise((resolve) => {
      this.gltfLoader.load(
        url + cacheBust,
        (gltf) => {
          console.log(`[ModelLoader] ✅ GLB Model loaded successfully: ${url}`);
          resolve(gltf);
        },
        undefined,
        (err) => { console.warn('[ModelLoader] Optional GLB not yet compiled, using procedural fallback:', url); resolve(null); }
      );
    });

    return Promise.all([
      load('/models/car_ferrari.glb'),
      load('/models/truck_commercial.glb'),
      load('/models/robot_expressive.glb'),
      load('/models/ion_engine_core.glb'),
      load('/models/agro_power_complex.glb'),
      load('/models/vityaz_taxi_hub.glb'),
      load('/models/skd_factory_complex.glb'),
      load('/models/tech_skyscraper.glb'),
      load('/models/drone_port_complex.glb'),
    ]).then(([car, truck, robot, core, agroPower, vityazHub, skdFactory, techSky, dronePort]) => {
      this.carGltf = car;
      this.truckGltf = truck;
      this.robotGltf = robot;
      this.coreGltf = core;
      this.agroPowerGltf = agroPower;
      this.vityazHubGltf = vityazHub;
      this.skdFactoryGltf = skdFactory;
      this.techSkyscraperGltf = techSky;
      this.dronePortGltf = dronePort;
      this.isLoaded = true;
      console.log('[ModelLoader] ✅ GLB & Blender assets ready:', {
        car: !!car, truck: !!truck, robot: !!robot, core: !!core,
        blender_agro: !!agroPower, blender_hub: !!vityazHub, blender_factory: !!skdFactory, blender_tech: !!techSky, blender_drone_port: !!dronePort
      });
    });
  }

  // === 0. BLENDER АРХИТЕКТУРНЫЕ МОДЕЛИ ВЫСОКОЙ ДЕТАЛИЗАЦИИ ===
  createBlenderAgroPowerComplex() {
    if (this.agroPowerGltf) {
      const model = this.agroPowerGltf.scene.clone(true);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return model;
    }
    return null;
  }

  createBlenderVityazTaxiHub() {
    if (this.vityazHubGltf) {
      const model = this.vityazHubGltf.scene.clone(true);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return model;
    }
    return null;
  }

  createBlenderSkdFactory() {
    if (this.skdFactoryGltf) {
      const model = this.skdFactoryGltf.scene.clone(true);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return model;
    }
    return null;
  }

  createBlenderTechSkyscraper() {
    if (this.techSkyscraperGltf) {
      const model = this.techSkyscraperGltf.scene.clone(true);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return model;
    }
    return null;
  }

  createBlenderDronePort() {
    if (this.dronePortGltf) {
      const model = this.dronePortGltf.scene.clone(true);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return model;
    }
    return null;
  }

  // === 1. РЕАЛИСТИЧНЫЙ ЛЕГКОВОЙ АВТОМОБИЛЬ (Ferrari GLB) ===
  // Нативный размер: X=4.52m, Y=2.26m, Z=1.11m — лежит вдоль оси X
  // Нам нужно: ориентировать вдоль Z (ось движения), целевая длина 4.5м
  createBydTaxi(colorType = 'yellow') {
    const carGroup = new THREE.Group();

    if (this.carGltf) {
      const model = this.carGltf.scene.clone(true);

      // Нативный размер 4.52 вдоль Z (предполагаем, что он уже ориентирован верно)
      // Масштаб 1:1 уже правильный (4.52м ≈ реальный автомобиль)
      model.rotation.y = Math.PI; // Поворачиваем на 180°, чтобы фары смотрели вперед по ходу движения
      model.scale.set(1.0, 1.0, 1.0);  // Нативный масштаб — уже в метрах

      // Ставим колёсами на дорогу 
      model.position.set(0, 0, 0);   // Если изначально центрировано

      // Настройка теней и оптика
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;

          const matName = (child.material?.name || '').toLowerCase();
          const meshName = child.name.toLowerCase();

          // Цвет кузова
          if (matName === 'body_color' || meshName === 'body') {
            const col = colorType === 'yellow' ? 0xf59e0b : (colorType === 'red' ? 0xd90429 : 0x0080ff);
            child.material = child.material.clone();
            child.material.color.setHex(col);
            child.material.metalness = 0.9;
            child.material.roughness = 0.13;
          }
        }
      });

      carGroup.add(model);

      // Плафон такси
      const taxiSign = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.18, 0.85),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 1.6 })
      );
      taxiSign.position.set(0, 2.35, 0);
      carGroup.add(taxiSign);

      // Лучи фар (по оси +Z — направление движения)
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
      const beamGeom = new THREE.ConeGeometry(1.2, 9, 8, 1, true);
      beamGeom.rotateX(-Math.PI / 2);
      const beamL = new THREE.Mesh(beamGeom, beamMat);
      beamL.position.set(0.55, 0.95, 6.5);
      const beamR = beamL.clone();
      beamR.position.set(-0.55, 0.95, 6.5);
      carGroup.add(beamL, beamR);

      // Неоновый underglow
      const glowMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 4.0),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 })
      );
      glowMesh.rotateX(-Math.PI / 2);
      glowMesh.position.set(0, 0.04, 0);
      carGroup.add(glowMesh);

      carGroup.userData.wheels = [];
      return carGroup;
    }

    // Резерв: если GLB не загрузился
    return this._fallbackTaxi(colorType);
  }

  // === 2. РЕАЛИСТИЧНЫЙ ГРУЗОВИК (Cesium Milk Truck GLB) ===
  // Нативный размер: X=4.87m, Y=2.79m, Z=3.01m
  // Нам нужно: ориентировать длинной стороной вдоль Z, целевая длина 7.5м
  createBydTruck() {
    const truckGroup = new THREE.Group();

    if (this.truckGltf) {
      const model = this.truckGltf.scene.clone(true);

      // Нативная длина = 4.87 вдоль Z
      // Масштабируем по целевой длине 7.5м: 7.5 / 4.87 ≈ 1.54
      const scale = 7.5 / 4.869;
      model.rotation.y = 0; // Нативный Z совпадает с направлением движения
      model.scale.set(scale, scale, scale);
      model.position.set(0, 0, 0);

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });

      truckGroup.add(model);

      // Лучи фар грузовика
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15, side: THREE.DoubleSide, depthWrite: false });
      const beamGeom = new THREE.ConeGeometry(1.6, 11, 8, 1, true);
      beamGeom.rotateX(-Math.PI / 2);
      const beamL = new THREE.Mesh(beamGeom, beamMat);
      beamL.position.set(0.9, 1.4, 9.5);
      const beamR = beamL.clone();
      beamR.position.set(-0.9, 1.4, 9.5);
      truckGroup.add(beamL, beamR);

      truckGroup.userData.wheels = [];
      return truckGroup;
    }

    return this._fallbackTruck();
  }

  // === 3. РОБОТ ===
  createRoboticArm() {
    const robotGroup = new THREE.Group();

    if (this.robotGltf) {
      const model = this.robotGltf.scene.clone(true);
      model.scale.set(1.5, 1.5, 1.5);
      model.position.set(0, 0, 0);
      model.traverse(c => { if (c.isMesh) { c.castShadow = true; } });
      robotGroup.add(model);

      const sparkLight = new THREE.PointLight(0x00ffff, 3.5, 12);
      sparkLight.position.set(0, 4.5, 0);
      robotGroup.add(sparkLight);

      return { group: robotGroup, light: sparkLight };
    }

    return this._fallbackRobot();
  }

  // === 4. КВАНТОВОЕ ЯДРО ИИ ===
  createQuantumAiCore() {
    const coreGroup = new THREE.Group();

    if (this.coreGltf) {
      const model = this.coreGltf.scene.clone(true);
      model.scale.set(0.045, 0.045, 0.045);
      coreGroup.add(model);
      return coreGroup;
    }

    const aiCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(4.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 3.0, wireframe: true })
    );
    coreGroup.add(aiCore);
    return coreGroup;
  }

  // === 5. ЗАРЯДНАЯ СТАНЦИЯ 240 кВт ===
  createChargingPillar240kW() {
    const pillar = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 3.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 })
    );
    body.position.y = 1.6;
    body.castShadow = true;
    pillar.add(body);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.4 })
    );
    screen.position.set(0, 2.1, 0.61);
    pillar.add(screen);

    const cable = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.09, 8, 16, Math.PI * 1.1),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 })
    );
    cable.position.set(0.72, 1.2, 0);
    cable.rotateY(Math.PI / 2);
    pillar.add(cable);

    return pillar;
  }

  // === 6. ТЕПЛИЦА С ВНУТРЕННЕЙ ГИДРОПОНИКОЙ И АРОЧНЫМ КАРКАСОМ ===
  createGreenhouseModule(length = 24, width = 12) {
    const gh = new THREE.Group();
    
    // Бетонное основание со сливом
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.6, width), 
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, metalness: 0.2 })
    );
    baseMesh.position.set(0, 0.3, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    gh.add(baseMesh);

    // Стеклянная полуцилиндрическая арка
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x6ee7b7,
      emissive: 0x10b981,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.8,
      side: THREE.DoubleSide
    });

    const archGeom = new THREE.CylinderGeometry(width / 2, width / 2, length - 0.4, 24, 1, false, 0, Math.PI);
    const arch = new THREE.Mesh(archGeom, glassMat);
    arch.rotateZ(Math.PI / 2);
    arch.position.y = 0.6;
    gh.add(arch);

    // Алюминиевые дуги каркаса (Ribs)
    const ribMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.2 });
    const ribCount = Math.floor(length / 4);
    for (let r = 0; r <= ribCount; r++) {
      const rx = (r / ribCount) * (length - 0.8) - (length - 0.8) / 2;
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(width / 2 + 0.05, 0.12, 8, 24, Math.PI),
        ribMat
      );
      rib.rotateZ(Math.PI / 2);
      rib.position.set(rx, 0.6, 0);
      gh.add(rib);
    }

    // Внутренние стеллажи с гидропоникой
    const planterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const cropMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x16a34a,
      emissiveIntensity: 0.4,
      roughness: 0.9
    });

    [-width / 4, width / 4].forEach((z) => {
      const planter = new THREE.Mesh(new THREE.BoxGeometry(length - 2, 0.5, width / 3), planterMat);
      planter.position.set(0, 0.6, z);
      gh.add(planter);

      const crops = new THREE.Mesh(new THREE.BoxGeometry(length - 2.4, 0.4, width / 3 - 0.4), cropMat);
      crops.position.set(0, 0.9, z);
      gh.add(crops);
    });

    return gh;
  }

  // === 7. ЖЕЛТЫЙ РОБОТ-МАНИПУЛЯТОР НА ЭСТАКАДЕ (Как на инфографике) ===
  createYellowConveyorGantry(span = 14) {
    const gantry = new THREE.Group();
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.25 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    // П-образная портальная рама
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 0.8), yellowMat);
    legL.position.set(-span / 2, 3.75, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 0.8), yellowMat);
    legR.position.set(span / 2, 3.75, 0);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(span + 1.2, 0.9, 1.2), yellowMat);
    beam.position.set(0, 7.5, 0);
    gantry.add(legL, legR, beam);

    // Каретка манипулятора
    const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.6), darkMat);
    carriage.position.set(0, 7.0, 0);
    gantry.add(carriage);

    // Штанга и сварочная головка
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.8), darkMat);
    arm.position.set(0, 5.0, 0);
    gantry.add(arm);

    const tool = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 8), yellowMat);
    tool.rotateX(Math.PI);
    tool.position.set(0, 3.0, 0);
    gantry.add(tool);

    // Синий лазерный луч сварки
    const sparkLight = new THREE.PointLight(0x00f0ff, 4.0, 10);
    sparkLight.position.set(0, 2.6, 0);
    gantry.add(sparkLight);

    return { group: gantry, light: sparkLight };
  }

  // === 8. ЛЕГО-БАШНЯ МАСШТАБИРОВАНИЯ (2 000 000 АВТО) ===
  createLegoScalingTower() {
    const group = new THREE.Group();
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      metalness: 0.6,
      roughness: 0.3
    });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    // Ступенчатые блоки инфографики:
    // 0-6 мес (100) -> 6-12 мес (250) -> 12-18 мес (500) -> 16-24 мес (1000) -> Башня 2 000 000
    const steps = [
      { x: -14, h: 3.5, label: "0-6 мес (100)", w: 4 },
      { x: -8, h: 7.0, label: "6-12 мес (250)", w: 4 },
      { x: -2, h: 12.0, label: "12-18 мес (500)", w: 4 },
      { x: 5, h: 18.0, label: "16-24 мес (1000)", w: 4.5 },
      { x: 14, h: 26.0, label: "2 000 000 (Цель)", w: 6 }
    ];

    steps.forEach((s) => {
      const block = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.w), redMat);
      block.position.set(s.x, s.h / 2, 0);
      block.castShadow = true;
      group.add(block);

      // Круглые штырьки Lego на верхушке каждого блока
      const studR = 0.35;
      const studH = 0.25;
      for (let sx = -s.w / 4; sx <= s.w / 4; sx += s.w / 2) {
        for (let sz = -s.w / 4; sz <= s.w / 4; sz += s.w / 2) {
          const stud = new THREE.Mesh(new THREE.CylinderGeometry(studR, studR, studH, 12), redMat);
          stud.position.set(s.x + sx, s.h + studH / 2, sz);
          group.add(stud);
        }
      }
    });

    // Светящаяся табличка "2 000 000 Цель за 5 лет"
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10, 2.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0xd90429, emissiveIntensity: 1.8 })
    );
    sign.position.set(14, 28.5, 0);
    group.add(sign);

    return group;
  }


  // === 9. АНИМИРОВАННЫЙ 3D ЧЕЛОВЕК / РАБОТНИК КЛАСТЕРА ===
  createHumanCharacter(role = 'engineer') {
    const human = new THREE.Group();

    // Цветовая палитра униформы в зависимости от роли
    let jacketColor = 0x0284c7; // default: синяя форма
    let helmetColor = 0xfacc15; // желтая каска
    let pantsColor = 0x1e293b;  // темные брюки

    if (role === 'agronomist') {
      jacketColor = 0x16a34a; // зеленая форма агронома
      helmetColor = 0x4ade80;
    } else if (role === 'scientist') {
      jacketColor = 0xf8fafc; // белый халат ученого
      helmetColor = 0x38bdf8;
    } else if (role === 'worker') {
      jacketColor = 0xf97316; // оранжевый жилет монтажника
      helmetColor = 0xffffff;
    }

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
    const helmetMat = new THREE.MeshStandardMaterial({ color: helmetColor, metalness: 0.3, roughness: 0.4 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

    // Тело / Куртка
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.45), jacketMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    human.add(torso);

    // Голова
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.4), skinMat);
    head.position.y = 1.95;
    head.castShadow = true;
    human.add(head);

    // Защитная каска / прическа
    const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.22, 12), helmetMat);
    helmet.position.y = 2.15;
    human.add(helmet);

    // Руки (Плечи + предплечья)
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.2), jacketMat);
    armL.position.set(-0.45, 1.35, 0);
    human.add(armL);

    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.75, 0.2), jacketMat);
    armR.position.set(0.45, 1.35, 0);
    human.add(armR);

    // Ноги
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.28), pantsMat);
    legL.position.set(-0.2, 0.5, 0);
    legL.castShadow = true;
    human.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.85, 0.28), pantsMat);
    legR.position.set(0.2, 0.5, 0);
    legR.castShadow = true;
    human.add(legR);

    // Обувь
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.4), shoeMat);
    shoeL.position.set(-0.2, 0.08, 0.06);
    human.add(shoeL);

    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.4), shoeMat);
    shoeR.position.set(0.2, 0.08, 0.06);
    human.add(shoeR);

    human.scale.set(0.9, 0.9, 0.9);
    human.userData.limbs = { armL, armR, legL, legR };
    return human;
  }

  // === 10. АВТОНОМНЫЙ АГРО-РОВЕР / ЭЛЕКТРОТРАКТОР ДЛЯ ТЕПЛИЦ ===
  createAgroRover() {
    const rover = new THREE.Group();
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, metalness: 0.7, roughness: 0.2 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    // Корпус ровера
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 3.8), greenMat);
    body.position.y = 0.9;
    body.castShadow = true;
    rover.add(body);

    // Сенсорный лидарный купол
    const lidar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.8 })
    );
    lidar.position.set(0, 1.7, 0.6);
    rover.add(lidar);

    // 4 больших резиновых колеса
    [[-1.3, -1.1], [1.3, -1.1], [-1.3, 1.1], [1.3, 1.1]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 16), wheelMat);
      wheel.rotateZ(Math.PI / 2);
      wheel.position.set(wx, 0.65, wz);
      wheel.castShadow = true;
      rover.add(wheel);
    });

    // Грузовой кузов с ящиками свежей зелени
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const vegMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x16a34a, emissiveIntensity: 0.4 });
    for (let cx = -0.6; cx <= 0.6; cx += 0.6) {
      for (let cz = -1.2; cz <= -0.2; cz += 0.5) {
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.4), crateMat);
        box.position.set(cx, 1.6, cz);
        rover.add(box);

        const veg = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.15, 0.34), vegMat);
        veg.position.set(cx, 1.85, cz);
        rover.add(veg);
      }
    }

    return rover;
  }

  // === 11. GIGAFACTORY АККУМУЛЯТОРОВ И МИКРОЭЛЕКТРОНИКИ В КИБЕРДЕРЕВНЕ ===
  createBatteryGigafactory() {
    const giga = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.3, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.85,
      roughness: 0.1
    });

    // Главный производственный корпус (Чистая комната)
    const body = new THREE.Mesh(new THREE.BoxGeometry(42, 12, 26), whiteMat);
    body.position.y = 6;
    body.castShadow = true;
    giga.add(body);

    // Панорамные смотровые окна чистой зоны
    const cleanRoomWin = new THREE.Mesh(new THREE.PlaneGeometry(36, 4.5), glassMat);
    cleanRoomWin.position.set(0, 7.0, 13.1);
    giga.add(cleanRoomWin);

    // Солнечная батарейная крыша
    const solarRoof = new THREE.Mesh(
      new THREE.BoxGeometry(43, 0.8, 27),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 })
    );
    solarRoof.position.set(0, 12.4, 0);
    giga.add(solarRoof);

    // Неоновая вывеска
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(24, 2.2, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, emissive: 0x00f0ff, emissiveIntensity: 2.2 })
    );
    sign.position.set(0, 10.5, 13.2);
    giga.add(sign);

    return giga;
  }

  // === 12. ДАТА-ЦЕНТР ИИ И СЕРВЕРНАЯ ФЕРМА ===
  createDataCenterBuilding() {
    const dc = new THREE.Group();
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.3 });
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.5 });

    const dcBody = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 18), darkMat);
    dcBody.position.y = 4.5;
    dcBody.castShadow = true;
    dc.add(dcBody);

    // Световые серверные жалюзи
    for (let i = 0; i < 5; i++) {
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(20, 0.3, 0.2), ledMat);
      ledBar.position.set(0, 2.0 + i * 1.3, 9.1);
      dc.add(ledBar);
    }

    // 4 вентилятора охлаждения на крыше
    for (let f = 0; f < 4; f++) {
      const fanHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.8, 1.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
      );
      fanHousing.position.set(-6 + (f % 2) * 12, 10.0, -4 + Math.floor(f / 2) * 8);
      dc.add(fanHousing);
    }

    return dc;
  }

  // === 13. УГОЛЬНЫЙ КОНВЕЙЕР И ТРАНСФОРМАТОРНАЯ ПОДСТАНЦИЯ ДЛЯ ТЭЦ ===
  createCoalConveyorFeeder() {
    const feeder = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, wireframe: false });

    // Наклонная эстакада подачи угля
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 32), steelMat);
    ramp.rotateX(Math.PI / 7);
    ramp.position.set(0, 7.5, -10);
    feeder.add(ramp);

    // Опорные стальные колонны
    for (let c = 0; c < 3; c++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4 + c * 4, 8), steelMat);
      col.position.set(0, (4 + c * 4) / 2, -22 + c * 10);
      feeder.add(col);
    }

    return feeder;
  }

  // === Резервные процедурные модели (никогда не видны если GLB работает) ===
  _fallbackTaxi(colorType) {
    const g = new THREE.Group();
    const col = colorType === 'yellow' ? 0xf59e0b : (colorType === 'red' ? 0xd90429 : 0x0080ff);
    const bodyMat = new THREE.MeshStandardMaterial({ color: col, metalness: 0.88, roughness: 0.15 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x071124, transparent: true, opacity: 0.88, metalness: 0.9, roughness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
    const ledHeadMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const ledTailMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });

    // 1. Нижнее шасси
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 4.6), darkMat);
    chassis.position.y = 0.35;
    g.add(chassis);

    // 2. Аэродинамический кузов
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.55, 4.4), bodyMat);
    body.position.y = 0.72;
    body.castShadow = true;
    g.add(body);

    // Наклонный капот
    const hood = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.3, 1.4), bodyMat);
    hood.position.set(0, 0.68, 1.5);
    hood.rotation.x = 0.15;
    g.add(hood);

    // 3. Кабина с панорамным остеклением
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.75, 2.5), glassMat);
    cabin.position.set(0, 1.25, -0.15);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.08, 2.2), bodyMat);
    roof.position.set(0, 1.65, -0.15);
    g.add(cabin, roof);

    // 4. Светотехника: передние фары и задняя LED монобровь
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.08), ledHeadMat);
    headL.position.set(0.7, 0.72, 2.22);
    const headR = headL.clone();
    headR.position.x = -0.7;
    const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.08), ledTailMat);
    tailBar.position.set(0, 0.78, -2.22);
    g.add(headL, headR, tailBar);

    // 5. Боковые зеркала
    const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.28), bodyMat);
    mirrorL.position.set(1.08, 1.15, 0.8);
    const mirrorR = mirrorL.clone();
    mirrorR.position.x = -1.08;
    g.add(mirrorL, mirrorR);

    // 6. 4 реалистичных колеса с дисками
    const wheelGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16);
    wheelGeom.rotateZ(Math.PI / 2);
    const rimGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.33, 12);
    rimGeom.rotateZ(Math.PI / 2);

    const wheels = [];
    [
      [0.98, 0.42, 1.4],
      [-0.98, 0.42, 1.4],
      [0.98, 0.42, -1.4],
      [-0.98, 0.42, -1.4]
    ].forEach(([wx, wy, wz]) => {
      const tire = new THREE.Mesh(wheelGeom, darkMat);
      const rim = new THREE.Mesh(rimGeom, rimMat);
      tire.add(rim);
      tire.position.set(wx, wy, wz);
      g.add(tire);
      wheels.push(tire);
    });

    g.userData.wheels = wheels;
    return g;
  }

  _fallbackTruck() {
    const g = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.5), new THREE.MeshStandardMaterial({ color: 0x0080ff, metalness: 0.9 }));
    cab.position.set(0, 2.0, 2.8); cab.castShadow = true;
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.6, 6.4), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    box.position.set(0, 2.55, -1.8); box.castShadow = true;
    g.add(cab, box);
    g.userData.wheels = [];
    return g;
  }

  _fallbackRobot() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 2, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
    base.position.y = 1;
    g.add(base);
    const light = new THREE.PointLight(0x00ffff, 3.5, 12);
    light.position.set(0, 4.5, 0);
    g.add(light);
    return { group: g, light };
  }

  // === 8. РЕАЛИСТИЧНЫЙ 3D КВАДРОКОПТЕР (ДРОН-ПАТРУЛЬНЫЙ) ===
  createQuadcopterDrone() {
    const drone = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.2, roughness: 0.3 });
    const propMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, transparent: true, opacity: 0.75, roughness: 0.1 });
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    // Центральный корпус
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8), whiteMat);
    fuselage.castShadow = true;
    drone.add(fuselage);

    const topCap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
    topCap.position.y = 0.15;
    drone.add(topCap);

    // Камера / сенсор снизу
    const gimbal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bodyMat);
    gimbal.position.y = -0.2;
    drone.add(gimbal);

    // Светодиодный маяк снизу
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), ledMat);
    beacon.position.y = -0.32;
    drone.add(beacon);

    // 4 луча и моторы с пропеллерами
    const rotors = [];
    const angles = [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
    const armDist = 1.1;

    angles.forEach((ang, idx) => {
      const armX = Math.cos(ang) * (armDist * 0.5);
      const armZ = Math.sin(ang) * (armDist * 0.5);
      const motorX = Math.cos(ang) * armDist;
      const motorZ = Math.sin(ang) * armDist;

      // Луч
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, armDist), bodyMat);
      arm.position.set(armX, 0, armZ);
      arm.rotation.y = -ang + Math.PI / 2;
      drone.add(arm);

      // Мотор
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 12), bodyMat);
      motor.position.set(motorX, 0.08, motorZ);
      drone.add(motor);

      // Пропеллер
      const prop = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.08), propMat);
      prop.position.set(motorX, 0.2, motorZ);
      drone.add(prop);
      rotors.push(prop);
    });

    // Навигационный свет
    const droneLight = new THREE.PointLight(0x00f0ff, 2.5, 12);
    droneLight.position.set(0, -0.4, 0);
    drone.add(droneLight);

    drone.scale.set(1.4, 1.4, 1.4);
    drone.userData.rotors = rotors;
    drone.userData.light = droneLight;
    return drone;
  }
}

export const modelLoader = new ModelLoader();

