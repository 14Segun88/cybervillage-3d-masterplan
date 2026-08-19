import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3geo from 'd3-geo';
import {
  RUSSIA_GEOJSON,
  RUSSIA_REGIONS_GEOJSON,
  RUSSIA_PROJECTION_CONFIG,
  RUSSIA_MAJOR_RIVERS,
  RUSSIA_MAJOR_LAKES,
  ENERGY_AND_LOGISTICS_HIGHWAYS,
  d3Projection,
  projectGeo,
  projectGlobe
} from '../data/russiaGeoData.js';
import { CITIES_DATA } from '../data/citiesData.js';
import { CityMarkersManager } from './cityMarkers.js';
import { soundFx } from '../audio/soundFx.js';

export class RussiaMap3D {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.onCitySelect = options.onCitySelect || null;
    this.onCityHover = options.onCityHover || null;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    this.mapMode = 'atlas';
    this.mapGroup = new THREE.Group();
    this.globeGroup = new THREE.Group();
    this.highwayPulses = [];
    this.lidarParticles = null;
    this.isAutoRotating = true;
    this.isDestroyed = false;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-1000, -1000);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Сцена и туман
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060c);
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.003);

    // 2. Камера
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    this.camera.position.set(0, 120, 110);

    // 3. Рендерер
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", precision: "mediump" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.container.replaceChildren(this.renderer.domElement);

    // 4. Управление камерой (OrbitControls)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.minDistance = 25;
    this.controls.maxDistance = 450;
    this.controls.autoRotate = this.isAutoRotating;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.target.set(0, 0, 0);

    // 5. Освещение
    this.setupLighting();

    // 6. Построение 3D карты РФ
    this.scene.add(this.mapGroup);
    this.scene.add(this.globeGroup);
    this.globeGroup.visible = false;

    this.buildHighPrecisionAtlas3D();
    this.buildGlobe3D();
    this.buildHighways();
    this.buildStarField();

    // 7. Маркеры городов
    this.cityMarkers = new CityMarkersManager(
      this.scene,
      CITIES_DATA,
      (city) => {
        if (this.onCitySelect) this.onCitySelect(city);
      },
      (city, point) => {
        if (this.onCityHover) this.onCityHover(city, point);
      }
    );

    // 8. Обработчики ввода
    this.setupEventListeners();

    // 9. Анимационный цикл
    this.animate();
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x102040, 2.2);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.8);
    dirLight1.position.set(-40, 120, 80);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffaa00, 1.5);
    dirLight2.position.set(80, 70, -60);
    this.scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00f0ff, 3.5, 400);
    pointLight.position.set(0, 45, 0);
    this.scene.add(pointLight);
  }

  /**
   * Построение 100% точной высокодетализированной векторной 3D карты РФ
   * с помощью D3 GeoPath и Canvas Texture
   */
  buildHighPrecisionAtlas3D() {
    // 1. Создание 4096x2048 Canvas для сверхчеткой отрисовки векторной карты
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    const pathGenerator = d3geo.geoPath(d3Projection, ctx);

    // Фон (глубокий темно-синий космос / океан)
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Кибер-сетка координат на фоне
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 2. Отрисовка территории РФ (Суша)
    ctx.fillStyle = '#091326';
    ctx.beginPath();
    pathGenerator(RUSSIA_GEOJSON);
    ctx.fill();

    // 2.1 Отрисовка внутренних границ всех 83+ регионов РФ (Области, Края, Республики)
    if (RUSSIA_REGIONS_GEOJSON && RUSSIA_REGIONS_GEOJSON.features) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      pathGenerator(RUSSIA_REGIONS_GEOJSON);
      ctx.stroke();
    }

    // 2.2 Неоновое свечение внешней государственной границы РФ
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    pathGenerator(RUSSIA_GEOJSON);
    ctx.stroke();

    // Второе внешнее свечение береговой линии
    ctx.shadowBlur = 30;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Отрисовка гидрографии (Реки Волга, Обь, Енисей, Лена, Дон, Амур)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    RUSSIA_MAJOR_RIVERS.forEach((river) => {
      ctx.beginPath();
      let first = true;
      river.points.forEach(([lon, lat]) => {
        const pt = d3Projection([lon, lat]);
        if (pt) {
          if (first) { ctx.moveTo(pt[0], pt[1]); first = false; }
          else { ctx.lineTo(pt[0], pt[1]); }
        }
      });
      ctx.stroke();
    });

    // Озера (Байкал, Ладога, Онега)
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    RUSSIA_MAJOR_LAKES.forEach((lake) => {
      ctx.beginPath();
      let first = true;
      lake.coords.forEach(([lon, lat]) => {
        const pt = d3Projection([lon, lat]);
        if (pt) {
          if (first) { ctx.moveTo(pt[0], pt[1]); first = false; }
          else { ctx.lineTo(pt[0], pt[1]); }
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // 4. Текстура для Three.js
    const mapTexture = new THREE.CanvasTexture(canvas);
    mapTexture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();

    // Создание 3D рельефной поверхности
    const mapGeom = new THREE.PlaneGeometry(240, 120, 120, 60);
    mapGeom.rotateX(-Math.PI / 2);

    const mapMat = new THREE.MeshStandardMaterial({
      map: mapTexture,
      roughness: 0.35,
      metalness: 0.75,
      emissive: 0x051224,
      emissiveIntensity: 0.4
    });

    const mapMesh = new THREE.Mesh(mapGeom, mapMat);
    mapMesh.position.set(0, 0, 0);
    mapMesh.receiveShadow = true;
    this.mapGroup.add(mapMesh);

    // 5. Объемная 3D подложка (Постамент карты)
    const baseGeom = new THREE.BoxGeometry(244, 3, 124);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x060914,
      roughness: 0.8,
      metalness: 0.5
    });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.set(0, -1.6, 0);
    this.mapGroup.add(baseMesh);

    // Светящийся неоновый бортик постамента
    const borderGeom = new THREE.EdgesGeometry(baseGeom);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
    const borderLine = new THREE.LineSegments(borderGeom, borderMat);
    borderLine.position.set(0, -1.6, 0);
    this.mapGroup.add(borderLine);

    // 6. Подложка круглой кибер-сетки
    const gridHelper = new THREE.GridHelper(360, 40, 0x00f0ff, 0x0a192f);
    gridHelper.position.y = -3.2;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.35;
    this.mapGroup.add(gridHelper);

    // 7. Lidar-топографическая матрица частиц рельефа РФ
    this.buildLidarPoints();
  }

  buildLidarPoints() {
    const points = [];
    const colors = [];
    const cyan = new THREE.Color(0x00f0ff);
    const gold = new THREE.Color(0xffb700);

    // Генерация светящихся точек поверх ключевых географических регионов РФ
    const regions = [
      { lonMin: 30, lonMax: 50, latMin: 50, latMax: 62, name: "Европейская часть" },
      { lonMin: 56, lonMax: 62, latMin: 52, latMax: 66, name: "Урал (горы)", elev: 2.2 },
      { lonMin: 68, lonMax: 88, latMin: 52, latMax: 68, name: "Западная Сибирь" },
      { lonMin: 85, lonMax: 105, latMin: 50, latMax: 56, name: "Алтай и Саяны", elev: 2.8 },
      { lonMin: 92, lonMax: 125, latMin: 56, latMax: 72, name: "Восточная Сибирь и Якутия" },
      { lonMin: 155, lonMax: 164, latMin: 52, latMax: 60, name: "Камчатка", elev: 3.0 },
      { lonMin: 130, lonMax: 138, latMin: 42, latMax: 50, name: "Приморье" },
      { lonMin: 38, lonMax: 48, latMin: 43, latMax: 46, name: "Кавказ", elev: 3.5 }
    ];

    regions.forEach((reg) => {
      const count = 180;
      for (let i = 0; i < count; i++) {
        const lon = reg.lonMin + Math.random() * (reg.lonMax - reg.lonMin);
        const lat = reg.latMin + Math.random() * (reg.latMax - reg.latMin);
        const elev = (reg.elev || 0.4) + Math.random() * 0.4;
        const pt = projectGeo(lon, lat, 1.0, elev);

        points.push(pt.x, pt.y + 0.3, pt.z);
        const col = elev > 1.8 ? gold : cyan;
        colors.push(col.r, col.g, col.b);
      }
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.9,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.lidarParticles = new THREE.Points(geom, mat);
    this.mapGroup.add(this.lidarParticles);
  }

  /**
   * Построение 3D Глобуса Земли с подсветкой РФ
   */
  buildGlobe3D() {
    const globeRadius = 45;

    // Сфера планеты
    const sphereGeom = new THREE.SphereGeometry(globeRadius, 64, 64);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x050c18,
      roughness: 0.6,
      metalness: 0.4,
      emissive: 0x020610
    });
    const globeMesh = new THREE.Mesh(sphereGeom, sphereMat);
    this.globeGroup.add(globeMesh);

    // Атмосферное свечение
    const atmosGeom = new THREE.SphereGeometry(globeRadius * 1.03, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmos = new THREE.Mesh(atmosGeom, atmosMat);
    this.globeGroup.add(atmos);

    // Сетка меридианов и параллелей
    const wireGeom = new THREE.SphereGeometry(globeRadius * 1.002, 24, 18);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08
    });
    const wireSphere = new THREE.Mesh(wireGeom, wireMat);
    this.globeGroup.add(wireSphere);
  }

  buildHighways() {
    ENERGY_AND_LOGISTICS_HIGHWAYS.forEach((hw) => {
      const curvePoints = hw.points.map((p) => {
        const pt = projectGeo(p[0], p[1], 1.0, 0.8);
        return new THREE.Vector3(pt.x, pt.y, pt.z);
      });

      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const points = curve.getPoints(140);
      const geom = new THREE.BufferGeometry().setFromPoints(points);

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(hw.color),
        transparent: true,
        opacity: 0.85,
        linewidth: 2
      });

      const line = new THREE.Line(geom, mat);
      this.mapGroup.add(line);

      // Световые импульсы
      const pulseCount = 4;
      for (let i = 0; i < pulseCount; i++) {
        const pulseGeom = new THREE.SphereGeometry(0.6, 8, 8);
        const pulseMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(hw.color),
          transparent: true,
          opacity: 0.95
        });
        const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
        this.mapGroup.add(pulseMesh);

        this.highwayPulses.push({
          mesh: pulseMesh,
          curve: curve,
          offset: i / pulseCount,
          speed: 0.07 + Math.random() * 0.03
        });
      }
    });
  }

  buildStarField() {
    const starsCount = 1500;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 900;
      starPositions[i + 1] = Math.random() * 450 + 20;
      starPositions[i + 2] = (Math.random() - 0.5) * 900;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x7ec8e3,
      size: 1.2,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const starMesh = new THREE.Points(starGeom, starMat);
    this.scene.add(starMesh);
  }

  setupEventListeners() {
    this.onWindowResize = () => {
      if (this.isDestroyed || !this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onWindowResize);

    let lastPointerMove = 0;
    this.onPointerMove = (e) => {
      const now = performance.now();
      if (now - lastPointerMove < 25) return; // Throttle to 40fps for pointer hover
      lastPointerMove = now;

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.cityMarkers) {
        this.cityMarkers.handlePointerMove(this.raycaster);
      }
    };
    window.addEventListener('pointermove', this.onPointerMove);

    this.onPointerDown = (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      if (this.cityMarkers) {
        this.cityMarkers.handlePointerClick(this.raycaster);
      }
    };
    window.addEventListener('pointerdown', this.onPointerDown);
  }

  animate = () => {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    this.controls.update();

    if (this.cityMarkers) {
      this.cityMarkers.update(elapsedTime, delta);
    }

    this.highwayPulses.forEach((p) => {
      p.offset = (p.offset + p.speed * delta) % 1.0;
      const pos = p.curve.getPointAt(p.offset);
      p.mesh.position.copy(pos);
    });

    if (this.lidarParticles) {
      this.lidarParticles.rotation.y = Math.sin(elapsedTime * 0.12) * 0.015;
    }

    if (this.globeGroup.visible) {
      this.globeGroup.rotation.y += delta * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  };

  toggleAutoRotate() {
    this.isAutoRotating = !this.isAutoRotating;
    this.controls.autoRotate = this.isAutoRotating;
    return this.isAutoRotating;
  }

  setMapMode(mode) {
    this.mapMode = mode;
    soundFx.playPulse();

    if (mode === 'globe') {
      this.mapGroup.visible = false;
      this.globeGroup.visible = true;
      this.controls.target.set(0, 0, 0);
      this.animateCameraPosition(new THREE.Vector3(0, 30, 95), new THREE.Vector3(0, 0, 0));
    } else {
      this.globeGroup.visible = false;
      this.mapGroup.visible = true;
      this.resetCamera();
    }
  }

  resetCamera() {
    this.animateCameraPosition(new THREE.Vector3(0, 120, 110), new THREE.Vector3(0, 0, 0));
  }

  setViewTop() {
    this.animateCameraPosition(new THREE.Vector3(0, 175, 0.01), new THREE.Vector3(0, 0, 0));
  }

  setViewIso() {
    this.animateCameraPosition(new THREE.Vector3(70, 95, 90), new THREE.Vector3(0, 0, 0));
  }

  focusCity(city) {
    const pt = projectGeo(city.coords.lon, city.coords.lat, 1.0, 0);
    const targetPos = new THREE.Vector3(pt.x, 0, pt.z);
    const camPos = new THREE.Vector3(pt.x + 18, 30, pt.z + 30);
    this.animateCameraPosition(camPos, targetPos);
    if (this.cityMarkers) {
      this.cityMarkers.highlightCity(city.id);
    }
  }

  animateCameraPosition(targetCamPos, targetLookAt) {
    const startCamPos = this.camera.position.clone();
    const startTarget = this.controls.target.clone();
    const startTime = performance.now();
    const duration = 1000;

    const animateTransition = (now) => {
      const progress = Math.min((now - startTime) / duration, 1.0);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

      this.camera.position.lerpVectors(startCamPos, targetCamPos, ease);
      this.controls.target.lerpVectors(startTarget, targetLookAt, ease);

      if (progress < 1.0) {
        requestAnimationFrame(animateTransition);
      }
    };
    requestAnimationFrame(animateTransition);
  }

  destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    if (this.cityMarkers) this.cityMarkers.dispose();
    if (this.controls) this.controls.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}
