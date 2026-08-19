import * as THREE from 'three';
import { projectGeo } from '../data/russiaGeoData.js';
import { soundFx } from '../audio/soundFx.js';

export class CityMarkersManager {
  constructor(scene, citiesData, onCityClick, onCityHover) {
    this.scene = scene;
    this.citiesData = citiesData;
    this.onCityClick = onCityClick;
    this.onCityHover = onCityHover;

    this.markersGroup = new THREE.Group();
    this.markersGroup.name = "cityMarkers";
    this.scene.add(this.markersGroup);

    this.markers = [];
    this.raycastTargets = [];
    this.hoveredMarker = null;

    this.initMarkers();
  }

  initMarkers() {
    this.citiesData.forEach((city) => {
      const pos = projectGeo(city.coords.lon, city.coords.lat, 1.0, 0.4);
      const color = new THREE.Color(city.color);

      const cityGroup = new THREE.Group();
      cityGroup.position.set(pos.x, pos.y, pos.z);
      cityGroup.userData = { city };

      // 1. Вертикальный луч света (Light Beacon)
      const beaconHeight = city.id === 'serpukhov' || city.id === 'moscow' ? 12 : 8;
      const beaconGeom = new THREE.CylinderGeometry(0.12, 0.45, beaconHeight, 16, 1, true);
      beaconGeom.translate(0, beaconHeight / 2, 0);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
      cityGroup.add(beaconMesh);

      // 2. Вращающийся голографический ромб/кристалл на вершине луча
      const coreGeom = new THREE.OctahedronGeometry(city.id === 'serpukhov' ? 1.3 : 0.9, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 1.2,
        roughness: 0.2,
        metalness: 0.8
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      coreMesh.position.y = beaconHeight;
      cityGroup.add(coreMesh);

      // 3. Концентрические пульсирующие кольца на земле
      const ringGeom = new THREE.RingGeometry(0.8, 1.2, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.y = 0.05;
      cityGroup.add(ringMesh);

      // Второе внешнее кольцо
      const outerRingGeom = new THREE.RingGeometry(1.6, 1.8, 32);
      outerRingGeom.rotateX(-Math.PI / 2);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const outerRingMesh = new THREE.Mesh(outerRingGeom, outerRingMat);
      outerRingMesh.position.y = 0.04;
      cityGroup.add(outerRingMesh);

      // Точный цилиндрический хитбокс у основания маркера (без наложения на соседние города при наклонном взгляде)
      const hitGeom = new THREE.CylinderGeometry(2.2, 2.2, 4.5, 16);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.position.y = 2.25;
      hitMesh.userData = { city, cityGroup, worldPos: new THREE.Vector3(pos.x, pos.y, pos.z) };
      cityGroup.add(hitMesh);
      this.raycastTargets.push(hitMesh);

      // 4. Текстовый бейдж с названием города над маяком
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(10, 15, 30, 0.85)';
      ctx.roundRect(4, 4, 248, 56, 12);
      ctx.fill();
      ctx.strokeStyle = city.color;
      ctx.lineWidth = 3;
      ctx.roundRect(4, 4, 248, 56, 12);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(city.name, 128, 32);

      const labelTex = new THREE.CanvasTexture(canvas);
      const labelMat = new THREE.SpriteMaterial({ map: labelTex, depthTest: false });
      const labelSprite = new THREE.Sprite(labelMat);
      labelSprite.position.y = beaconHeight + 2.8;
      labelSprite.scale.set(7.5, 1.88, 1);
      labelSprite.userData = { city, cityGroup };
      cityGroup.add(labelSprite);
      this.raycastTargets.push(labelSprite);

      this.markersGroup.add(cityGroup);

      this.markers.push({
        city,
        group: cityGroup,
        beacon: beaconMesh,
        core: coreMesh,
        ring: ringMesh,
        outerRing: outerRingMesh,
        label: labelSprite,
        initialBeaconHeight: beaconHeight,
        pulsePhase: Math.random() * Math.PI * 2
      });
    });
  }

  update(time, delta) {
    this.markers.forEach((m) => {
      // Вращение кристалла
      m.core.rotation.y += delta * 1.5;
      m.core.rotation.x = Math.sin(time * 2 + m.pulsePhase) * 0.2;

      // Пульсация колец
      const pulse = (Math.sin(time * 3 + m.pulsePhase) + 1) * 0.5;
      const scale = 1.0 + pulse * 0.4;
      m.ring.scale.set(scale, scale, scale);
      m.ring.material.opacity = 0.9 - pulse * 0.5;

      const outerScale = 1.0 + ((Math.sin(time * 2 + m.pulsePhase + 1) + 1) * 0.5) * 0.6;
      m.outerRing.scale.set(outerScale, outerScale, outerScale);

      // Свечение маяка
      m.beacon.material.opacity = 0.5 + pulse * 0.35;
    });
  }

  _getBestIntersectCity(intersects, raycaster) {
    if (!intersects || intersects.length === 0) return null;

    // Сортируем попадания по точному расстоянию от луча до центра маркера города
    let bestCity = null;
    let minDistanceToRay = Infinity;

    for (const hit of intersects) {
      const city = hit.object.userData?.city;
      if (!city) continue;
      const markerPos = hit.object.userData?.cityGroup?.position;
      if (markerPos) {
        const dist = raycaster.ray.distanceToPoint(markerPos);
        if (dist < minDistanceToRay) {
          minDistanceToRay = dist;
          bestCity = city;
        }
      } else {
        if (!bestCity) bestCity = city;
      }
    }
    return bestCity || intersects[0].object.userData?.city;
  }

  handlePointerMove(raycaster) {
    const intersects = raycaster.intersectObjects(this.raycastTargets);
    if (intersects.length > 0) {
      const city = this._getBestIntersectCity(intersects, raycaster);
      if (city && this.hoveredMarker !== city) {
        this.hoveredMarker = city;
        document.body.style.cursor = 'pointer';
        soundFx.playHover();
        if (this.onCityHover) {
          this.onCityHover(city, intersects[0].point);
        }
      }
    } else {
      if (this.hoveredMarker !== null) {
        this.hoveredMarker = null;
        document.body.style.cursor = 'default';
        if (this.onCityHover) {
          this.onCityHover(null, null);
        }
      }
    }
  }

  handlePointerClick(raycaster) {
    const intersects = raycaster.intersectObjects(this.raycastTargets);
    if (intersects.length > 0) {
      const city = this._getBestIntersectCity(intersects, raycaster);
      if (city) {
        soundFx.playClick();
        if (this.onCityClick) {
          this.onCityClick(city);
        }
        return true;
      }
    }
    return false;
  }

  highlightCity(cityId) {
    this.markers.forEach((m) => {
      if (m.city.id === cityId) {
        m.core.scale.set(1.5, 1.5, 1.5);
        m.beacon.material.opacity = 1.0;
      } else {
        m.core.scale.set(1.0, 1.0, 1.0);
      }
    });
  }

  dispose() {
    this.markersGroup.clear();
    this.scene.remove(this.markersGroup);
  }
}
