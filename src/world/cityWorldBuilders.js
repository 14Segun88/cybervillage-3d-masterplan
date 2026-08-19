import * as THREE from 'three';
import { modelLoader } from './modelLoader.js';

/**
 * CityWorldBuilders — Модульные генераторы уникальных 3D-миров для всех городов сети:
 * 1. Москва (Центральный Мега-Электрохаб «Витязь», Дом Такси, Робомойка, Телемедицина)
 * 2. Кемерово (Угольная/Газовая ТЭЦ, Градирни, ОРУ 500 кВ, Тепличный агрокомплекс, BESS)
 * 3. Владивосток (Морской порт-хаб, Контейнеровозы, STS-краны, Ж/Д терминал SKD)
 * 4. Казань (Иннополис, Геокупол Smart Grid, ИИ Диспетчерская, Тест-трек беспилотников)
 * 5. Санкт-Петербург (R&D Центр ПО «Дом Такси OS», Финский залив, Сенсоры телемедицины)
 * 6. Екатеринбург (Завод металлообработки и сборки корпусов ЭЗС 160-240 кВт, BYD T5)
 * 7. Новосибирск (Академгородок, Крио-лаборатория АКБ -45°C, Стенды электромоторов)
 * 8. Сочи (Курортный хаб, Солнечные СЭС 2.5 МВт, Пальмовые аллеи, Бирюзовый таксопарк)
 */

export class CityWorldBuilders {

  // =========================================================================
  // 1. МОСКВА: ЦЕНТРАЛЬНЫЙ МЕГА-ЭЛЕКТРОХАБ «ВИТЯЗЬ» И «ДОМ ТАКСИ»
  // =========================================================================
  static buildMoscow(engine) {
    const slateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.05 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.1 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.25, metalness: 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.3, transparent: true, opacity: 0.85 });

    // 1.1 Террейн и дорожная площадь
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.55 }));
    ground.rotateX(-Math.PI / 2);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(180, 140), slateMat);
    plaza.rotateX(-Math.PI / 2);
    plaza.position.set(0, 0.08, 0);
    plaza.receiveShadow = true;
    engine.worldGroup.add(plaza);

    // 1.2 Главный 2-этажный комплекс «Дом Такси»
    const hubBuilding = new THREE.Group();
    const floor1 = new THREE.Mesh(new THREE.BoxGeometry(46, 5.5, 26), stoneMat);
    floor1.position.y = 2.75;
    floor1.castShadow = true;
    const floor2 = new THREE.Mesh(new THREE.BoxGeometry(42, 5.0, 24), stoneMat);
    floor2.position.y = 8.0;
    floor2.castShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(44, 1.2, 25), blueMat);
    roof.position.y = 11.1;

    // Витражные окна
    for (let w = -4; w <= 4; w++) {
      const win1 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.2, 0.2), glassMat);
      win1.position.set(w * 4.6, 2.75, 13.1);
      const win2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.8, 0.2), glassMat);
      win2.position.set(w * 4.2, 8.0, 12.1);
      hubBuilding.add(win1, win2);
    }
    hubBuilding.add(floor1, floor2, roof);
    hubBuilding.position.set(0, 0, -25);
    hubBuilding.userData = {
      name: "Центральный комплекс «Дом Такси» Москва",
      desc: "Центр управления флотом 600+ электротакси, предрейсовый контроль, круглосуточная диспетчерская."
    };
    engine.worldGroup.add(hubBuilding);
    engine.interactiveObjects.push(floor1);

    // 1.3 Мега-навес с 11 ультрабыстрыми ЭЗС 240 кВт
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(78, 1.0, 20), blueMat);
    canopy.position.set(0, 8.5, 25);
    canopy.castShadow = true;
    engine.worldGroup.add(canopy);

    for (let i = 0; i < 11; i++) {
      const cx = (i - 5) * 6.8;
      const pillar = modelLoader.createChargingPillar240kW();
      pillar.position.set(cx, 0, 25);
      pillar.userData = {
        name: `ЭЗС «Витязь» Liquid-Cooled #${i + 1} (240 кВт)`,
        desc: "Ультрабыстрая зарядка BYD E6 за 25 мин. Пропускная способность хаба: 600 авто в сутки."
      };
      engine.worldGroup.add(pillar);
      engine.interactiveObjects.push(pillar);

      // Заряжающиеся электротакси
      if (i % 2 === 0) {
        const taxi = modelLoader.createBydTaxi(i % 4 === 0 ? 'yellow' : 'blue');
        taxi.position.set(cx, 0, 28);
        taxi.rotation.y = Math.PI;
        engine.worldGroup.add(taxi);

        const beamLight = new THREE.PointLight(0x00f0ff, 2.0, 10);
        beamLight.position.set(cx, 3.5, 26);
        engine.worldGroup.add(beamLight);

        engine.chargingTaxis.push({
          group: taxi,
          beam: beamLight,
          stallX: cx,
          stallZ: 28,
          timer: (i / 2) * 2.5,
          cycleDuration: 12.0
        });
      }
    }

    // 1.4 Роботизированная 2-постовая автомойка
    const washBuilding = new THREE.Mesh(new THREE.BoxGeometry(26, 7.5, 18), stoneMat);
    washBuilding.position.set(55, 3.75, 5);
    washBuilding.userData = {
      name: "Роботизированный моечный комплекс высокого давления",
      desc: "Экспресс-мойка электромобиля за 4 минуты перед выходом на линию."
    };
    engine.worldGroup.add(washBuilding);
    engine.interactiveObjects.push(washBuilding);

    // 1.5 Центр Телемедицинского контроля водителей
    const telemed = new THREE.Mesh(new THREE.BoxGeometry(22, 7.0, 18), stoneMat);
    telemed.position.set(-55, 3.5, 5);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.0, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    cross.position.set(-55, 4.5, 14.1);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.2, 0.4), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    crossH.position.set(-55, 4.5, 14.1);
    engine.worldGroup.add(cross, crossH);
    telemed.userData = {
      name: "Центр Телемедицины и отдыха водителей",
      desc: "Автоматизированные терминалы проверки давления, пульса, алкотестер, выдача электронных путевых листов."
    };
    engine.worldGroup.add(telemed);
    engine.interactiveObjects.push(telemed);
  }

  // =========================================================================
  // 2. КЕМЕРОВО: ЭНЕРГОКОМПЛЕКС ТЭЦ, ГРАДИРНИ И АГРОКОМПЛЕКС «ЧИСТАЯ СТРАНА»
  // =========================================================================
  static buildKemerovo(engine) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6, metalness: 0.2 });
    const redMat = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.35 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.55 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    // 2.1 Главный машинный зал ТЭЦ
    const tppHall = new THREE.Mesh(new THREE.BoxGeometry(64, 18, 36), stoneMat);
    tppHall.position.set(-30, 9, -20);
    tppHall.castShadow = true;
    tppHall.userData = {
      name: "Угольно-Газовый Энергоблок ТЭЦ (Кузбасс)",
      desc: "Прямая генерация электроэнергии в угольном бассейне. Себестоимость 1 кВт*ч минимальна."
    };
    engine.worldGroup.add(tppHall);
    engine.interactiveObjects.push(tppHall);

    // 2 Дымовые трубы высотой 42м
    [-42, -18].forEach((tx) => {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 3.2, 42, 16), stoneMat);
      stack.position.set(tx, 21, -38);
      engine.worldGroup.add(stack);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 4, 16), redMat);
      ring.position.set(tx, 36, -38);
      engine.worldGroup.add(ring);
    });

    // 2.2 Две градирни охлаждения с поднимающимся паром
    [-65, 5].forEach((gx) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(8, 12, 28, 24), stoneMat);
      tower.position.set(gx, 14, -20);
      engine.worldGroup.add(tower);
      const glow = new THREE.PointLight(0x00f0ff, 1.8, 30);
      glow.position.set(gx, 28, -20);
      engine.worldGroup.add(glow);
    });

    // 2.3 Открытое распределительное устройство (ОРУ 500 кВ)
    const subGroup = new THREE.Group();
    subGroup.position.set(50, 0, -20);
    for (let row = -2; row <= 2; row++) {
      for (let col = -1; col <= 1; col++) {
        const trans = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 4), steelMat);
        trans.position.set(col * 9, 2.5, row * 9);
        const iso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 8), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
        iso.position.set(col * 9, 6.5, row * 9);
        subGroup.add(trans, iso);
      }
    }
    subGroup.userData = {
      name: "Трансформаторная подстанция ОРУ 500 кВ",
      desc: "Выдача базовой мощности в Единую энергосистему и запитка зарядных хабов Сибири."
    };
    engine.worldGroup.add(subGroup);
    engine.interactiveObjects.push(subGroup);

    // 2.4 Тепличный агрокомплекс «Чистая Страна» (8 стеклянных модулей на сбросном тепле)
    const agroGroup = new THREE.Group();
    agroGroup.position.set(0, 0, 35);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const gh = modelLoader.createGreenhouseModule(18, 14);
        gh.position.set(-30 + c * 20, 0, -10 + r * 20);
        agroGroup.add(gh);
      }
    }
    agroGroup.userData = {
      name: "Тепличный Агрокомплекс «Чистая Страна»",
      desc: "Утилизация сбросного тепла ТЭЦ: круглогодичное выращивание свежей зелени, томатов и огурцов."
    };
    engine.worldGroup.add(agroGroup);
    engine.interactiveObjects.push(agroGroup);

    // Агроровер
    const rover = modelLoader.createAgroRover();
    rover.position.set(0, 0, 58);
    engine.worldGroup.add(rover);
  }

  // =========================================================================
  // 3. ВЛАДИВОСТОК: МОРСКОЙ SKD ЛОГИСТИЧЕСКИЙ ПОРТ-ХАБ
  // =========================================================================
  static buildVladivostok(engine) {
    const dockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.05 });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.25, metalness: 0.1 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });

    // 3.1 Океан / Японское море
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.1, metalness: 0.85 })
    );
    ocean.rotateX(-Math.PI / 2);
    ocean.position.y = -0.1;
    engine.worldGroup.add(ocean);

    // Бетонный причальный пирс
    const dock = new THREE.Mesh(new THREE.BoxGeometry(220, 3.5, 120), dockMat);
    dock.position.set(0, 1.75, 40);
    dock.receiveShadow = true;
    engine.worldGroup.add(dock);

    // 3.2 Контейнеровоз у причала
    const ship = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(110, 10, 24), new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.3 }));
    hull.position.set(0, 4, -30);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 22), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 }));
    bridge.position.set(40, 14, -30);
    ship.add(hull, bridge);
    ship.userData = {
      name: "Океанский Контейнеровоз «Восточный Экспресс»",
      desc: "Доставка машинокомплектов BYD E6, E7, T5 и тяговых батарей морем из Азии."
    };
    engine.worldGroup.add(ship);
    engine.interactiveObjects.push(hull);

    // 3.3 Три Мега-крана STS (Ship-to-Shore)
    [-35, 0, 35].forEach((cx) => {
      const crane = new THREE.Group();
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(2, 28, 2), yellowMat);
      p1.position.set(-6, 14, 0);
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(2, 28, 2), yellowMat);
      p2.position.set(6, 14, 0);
      const boom = new THREE.Mesh(new THREE.BoxGeometry(16, 2.5, 46), yellowMat);
      boom.position.set(0, 26, -10);
      crane.add(p1, p2, boom);
      crane.position.set(cx, 3.5, -5);
      engine.worldGroup.add(crane);
    });

    // 3.4 Штабели контейнеров SKD BYD (Синие, Красные, Желтые)
    const containerColors = [0x0284c7, 0xd90429, 0xfacc15, 0x16a34a];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const h = Math.floor(Math.random() * 3) + 1;
        for (let lvl = 0; lvl < h; lvl++) {
          const colHex = containerColors[(row + col + lvl) % containerColors.length];
          const cBox = new THREE.Mesh(new THREE.BoxGeometry(12, 3.0, 5.0), new THREE.MeshStandardMaterial({ color: colHex, roughness: 0.3 }));
          cBox.position.set(-45 + col * 15, 5.0 + lvl * 3.1, 25 + row * 8);
          cBox.castShadow = true;
          engine.worldGroup.add(cBox);
        }
      }
    }

    // 3.5 Ж/Д эстакада и грузовой состав в Серпухов
    const trainTrack = new THREE.Mesh(new THREE.BoxGeometry(180, 0.8, 10), steelMat);
    trainTrack.position.set(0, 3.9, 75);
    engine.worldGroup.add(trainTrack);

    const locomotive = new THREE.Mesh(new THREE.BoxGeometry(24, 6.5, 6.5), new THREE.MeshStandardMaterial({ color: 0x0284c7 }));
    locomotive.position.set(20, 7.5, 75);
    locomotive.userData = {
      name: "Ж/Д Состав Владивосток → Серпухов",
      desc: "Скоростная транссибирская доставка 1500+ SKD комплектов в месяц на сборочный завод."
    };
    engine.worldGroup.add(locomotive);
    engine.interactiveObjects.push(locomotive);
  }

  // =========================================================================
  // 4. КАЗАНЬ: ИННОПОЛИС, SMART GRID & ИИ-ДИСПЕТЧЕРИЗАЦИЯ
  // =========================================================================
  static buildKazan(engine) {
    const campusMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5, metalness: 0.2 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.85, roughness: 0.15 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.55 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    // Круглая площадь кампуса Иннополис
    const plaza = new THREE.Mesh(new THREE.CylinderGeometry(65, 65, 0.4, 48), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 }));
    plaza.position.set(0, 0.2, 0);
    engine.worldGroup.add(plaza);

    // 4.1 Центральный геодезический купол Smart Grid
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.5, wireframe: true })
    );
    dome.position.set(0, 0.4, 0);
    dome.userData = {
      name: "Центральный Дата-Центр Smart Grid и ИИ (Казань)",
      desc: "10 PFlops Neural Cloud: алгоритмы динамических тарифов, предиктивная балансировка электросетей хабов."
    };
    engine.worldGroup.add(dome);
    engine.interactiveObjects.push(dome);

    const aiCore = modelLoader.createQuantumAiCore();
    aiCore.position.set(0, 8, 0);
    engine.worldGroup.add(aiCore);
    engine.drones.push({ group: aiCore, isCore: true });

    // 4.2 Кольцевые учебные корпуса и лаборатории
    [-38, 38].forEach((bx, idx) => {
      const building = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 12, 6), campusMat);
      building.position.set(bx, 6, -15);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1.2, 6), blueMat);
      ring.position.set(bx, 12.5, -15);
      engine.worldGroup.add(building, ring);
      building.userData = {
        name: idx === 0 ? "Институт Предиктивной Телематики" : "Лаборатория Автопилота и Сенсоров",
        desc: "Разработка нейросетевых моделей автономного вождения для электротакси BYD."
      };
      engine.interactiveObjects.push(building);
    });

    // 4.3 Демо-полигон беспилотных электротакси
    const track = new THREE.Mesh(new THREE.RingGeometry(38, 52, 48), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    track.rotateX(-Math.PI / 2);
    track.position.set(0, 0.45, 0);
    engine.worldGroup.add(track);

    for (let c = 0; c < 3; c++) {
      const taxi = modelLoader.createBydTaxi('yellow');
      const angle = (c / 3) * Math.PI * 2;
      taxi.position.set(Math.cos(angle) * 45, 0.5, Math.sin(angle) * 45);
      taxi.rotation.y = angle + Math.PI / 2;
      engine.worldGroup.add(taxi);
    }
  }

  // =========================================================================
  // 5. САНКТ-ПЕТЕРБУРГ: ЦЕНТР ЦИФРОВЫХ ДВОЙНИКОВ И СОФТА «ДОМ ТАКСИ OS»
  // =========================================================================
  static buildSpb(engine) {
    const slateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.55 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.1 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.55 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    // Воды Финского залива
    const bay = new THREE.Mesh(new THREE.PlaneGeometry(350, 1200), new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.15, metalness: 0.85 }));
    bay.rotateX(-Math.PI / 2);
    bay.position.set(-180, 0.05, 0);
    engine.worldGroup.add(bay);

    // Главный R&D Небоскреб «Дом Такси OS»
    const rAndDTower = new THREE.Group();
    const pod = new THREE.Mesh(new THREE.BoxGeometry(32, 7, 32), slateMat);
    pod.position.y = 3.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(26, 32, 26), glassMat);
    body.position.y = 23;
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.5 }));
    spire.position.y = 47;
    rAndDTower.add(pod, body, spire);
    rAndDTower.position.set(30, 0, -10);
    rAndDTower.userData = {
      name: "Штаб-квартира ПО «Дом Такси OS» (Санкт-Петербург)",
      desc: "Облачная платформа диспетчеризации, мобильные приложения для 10 000+ водителей, телемедицинские протоколы."
    };
    engine.worldGroup.add(rAndDTower);
    engine.interactiveObjects.push(body);

    // Лаборатория сенсоров телемедицины
    const lab = new THREE.Mesh(new THREE.BoxGeometry(26, 8, 22), stoneMat);
    lab.position.set(30, 4, 30);
    lab.userData = {
      name: "Лаборатория Аппаратных Сенсоров Телемедицины",
      desc: "Разработка бесконтактных диагностических модулей и экспресс-сканеров состояния водителя."
    };
    engine.worldGroup.add(lab);
    engine.interactiveObjects.push(lab);
  }

  // =========================================================================
  // 6. ЕКАТЕРИНБУРГ: ЗАВОД КОРПУСОВ И МОДУЛЕЙ ЗАРЯДНЫХ СТАНЦИЙ
  // =========================================================================
  static buildEkaterinburg(engine) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.45, metalness: 0.3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.85, roughness: 0.25 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.55 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    // Главный цех лазерного раскроя и металлообработки
    const plant1 = new THREE.Mesh(new THREE.BoxGeometry(65, 16, 34), blueMat);
    plant1.position.set(-25, 8, -15);
    plant1.userData = {
      name: "Завод Вандалостойких Корпусов ЭЗС 240 кВт",
      desc: "Высокоточная лазерная резка, гибка бронированной стали и роботизированная порошковая окраска."
    };
    engine.worldGroup.add(plant1);
    engine.interactiveObjects.push(plant1);

    // Цех сборки блочных трансформаторных подстанций
    const plant2 = new THREE.Mesh(new THREE.BoxGeometry(50, 13, 28), stoneMat);
    plant2.position.set(40, 6.5, -15);
    plant2.userData = {
      name: "Цех Модульных Подстанций Хабов",
      desc: "Сборка контейнерных комплектных трансформаторных подстанций (КТП) для быстрой установки в городах."
    };
    engine.worldGroup.add(plant2);
    engine.interactiveObjects.push(plant2);

    // Площадка готовых ЭЗС и электрогрузовики BYD T5
    for (let c = 0; c < 8; c++) {
      const pillar = modelLoader.createChargingPillar240kW();
      pillar.position.set(-30 + c * 8, 0, 20);
      engine.worldGroup.add(pillar);
    }
    const truck = modelLoader.createBydTruck();
    truck.position.set(25, 0, 25);
    engine.worldGroup.add(truck);
  }

  // =========================================================================
  // 7. НОВОСИБИРСК: АКАДЕМГОРОДОК, КРИО-ЛАБОРАТОРИЯ АКБ И ЭЛЕКТРОПРИВОДА
  // =========================================================================
  static buildNovosibirsk(engine) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x2dd4bf, metalness: 0.8, roughness: 0.2 });

    // Снежный покров Сибири
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    // Хвойные сибирские ели вокруг института
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.7 });
    for (let i = 0; i < 40; i++) {
      const tx = (Math.random() - 0.5) * 220;
      const tz = (Math.random() - 0.5) * 220;
      if (Math.abs(tx) < 45 && Math.abs(tz) < 45) continue;
      const pine = new THREE.Mesh(new THREE.ConeGeometry(3.5, 12, 8), pineMat);
      pine.position.set(tx, 6, tz);
      engine.worldGroup.add(pine);
    }

    // Главный корпус Института Химических Источников Тока
    const institute = new THREE.Mesh(new THREE.BoxGeometry(48, 14, 28), stoneMat);
    institute.position.set(0, 7, -15);
    institute.userData = {
      name: "Институт Твердотельных АКБ и Электропривода (Новосибирск)",
      desc: "Фундаментальные исследования морозостойких натрий-ионных и твердотельных аккумуляторов (ресурс 1 000 000 км)."
    };
    engine.worldGroup.add(institute);
    engine.interactiveObjects.push(institute);

    // Криогенный испытательный комплекс -45°C
    const cryoDome = new THREE.Mesh(new THREE.SphereGeometry(13, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), cyanMat);
    cryoDome.position.set(-35, 0, 22);
    cryoDome.userData = {
      name: "Криогенная камера испытаний АКБ при -45°C",
      desc: "Экстремальное климатическое тестирование батарейных блоков BYD Blade Battery для зимней эксплуатации в РФ."
    };
    engine.worldGroup.add(cryoDome);
    engine.interactiveObjects.push(cryoDome);

    // Стенд ресурсных испытаний электромоторов
    const dynoLab = new THREE.Mesh(new THREE.BoxGeometry(24, 9, 20), stoneMat);
    dynoLab.position.set(35, 4.5, 22);
    dynoLab.userData = {
      name: "Стенд динамических испытаний электромоторов",
      desc: "Нагрузочные тесты синхронных двигателей с постоянными магнитами под пиковой мощностью."
    };
    engine.worldGroup.add(dynoLab);
    engine.interactiveObjects.push(dynoLab);
  }

  // =========================================================================
  // 8. СОЧИ: ЗЕЛЕНЫЙ КУРОРТНЫЙ ЭЛЕКТРОХАБ И СОЛНЕЧНЫЙ ПАРК 2.5 МВт
  // =========================================================================
  static buildSochi(engine) {
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.95, roughness: 0.05 });

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 }));
    ground.rotateX(-Math.PI / 2);
    ground.receiveShadow = true;
    engine.worldGroup.add(ground);

    // Черное море
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(1200, 400), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.85 }));
    sea.rotateX(-Math.PI / 2);
    sea.position.set(0, 0.05, 160);
    engine.worldGroup.add(sea);

    // Курортный хаб «Дом Такси»
    const resortHub = new THREE.Mesh(new THREE.BoxGeometry(42, 8, 22), stoneMat);
    resortHub.position.set(0, 4, -25);
    resortHub.userData = {
      name: "Курортный Электрохаб «Дом Такси» Сочи",
      desc: "100% электрический таксопарк (150 электротакси BYD E6), нулевые выбросы CO2 на побережье."
    };
    engine.worldGroup.add(resortHub);
    engine.interactiveObjects.push(resortHub);

    // Навес из солнечных панелей
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(60, 0.8, 18), solarMat);
    canopy.position.set(0, 8.5, 5);
    engine.worldGroup.add(canopy);

    for (let i = 0; i < 8; i++) {
      const cx = (i - 3.5) * 6.8;
      const pillar = modelLoader.createChargingPillar240kW();
      pillar.position.set(cx, 0, 5);
      engine.worldGroup.add(pillar);

      if (i % 2 === 0) {
        const taxi = modelLoader.createBydTaxi('turquoise');
        taxi.position.set(cx, 0, 9);
        taxi.rotation.y = Math.PI;
        engine.worldGroup.add(taxi);

        const beamLight = new THREE.PointLight(0x00f0ff, 2.0, 10);
        beamLight.position.set(cx, 3.5, 7);
        engine.worldGroup.add(beamLight);

        engine.chargingTaxis.push({
          group: taxi,
          beam: beamLight,
          stallX: cx,
          stallZ: 9,
          timer: (i / 2) * 2.5,
          cycleDuration: 12.0
        });
      }
    }

    // Солнечная электростанция (СЭС 2.5 МВт)
    const solarFarm = new THREE.Group();
    solarFarm.position.set(65, 0, -15);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 5), solarMat);
        panel.rotateX(-Math.PI / 6);
        panel.position.set(c * 9 - 13, 2.5, r * 8 - 12);
        solarFarm.add(panel);
      }
    }
    solarFarm.userData = {
      name: "Солнечная электростанция СЭС 2.5 МВт",
      desc: "Чистая солнечная генерация энергии для зарядки электротакси курортной зоны."
    };
    engine.worldGroup.add(solarFarm);
    engine.interactiveObjects.push(solarFarm);
  }
}
