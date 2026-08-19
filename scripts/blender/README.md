# 🎨 Blender 3D Pipeline для проекта «Кибердеревня»

Пайплайн позволяет генерировать высокодетализированные 3D-модели архитектурных секторов генерального плана, настраивать PBR-материалы, работать визуально через Blender GUI или автоматически компилировать сцены в оптимизированные `.glb` файлы для веб-движка Three.js.

---

## 📁 Структура пайплайна

- `scripts/blender/`
  - `materials.py` — библиотека процедурных PBR-материалов (стекло, неон, солнечные батареи, металл, бетон, плазма).
  - `build_energy_agro.py` — генератор сектора «Энергетика и Сельское хозяйство» (Угольная ТЭЦ, Газовая ТЭЦ, 6 теплиц, ферма, теплотрассы).
  - `build_dom_taxi_hub.py` — генератор центрального терминала «Дом Такси» и хаба «Витязь» (медцентр с 3D-крестом, навес 240 кВт).
  - `build_skd_factory.py` — генератор автозавода SKD BYD (сборочный цех, шедовые фонари, конвейер, роботы, автосалон).
  - `build_tech_center.py` — генератор небоскреба Техноцентра «Кибердеревня» (многоярусная башня, шпиль, неоновые ребра).
  - `export_all_models.py` — мастер-скрипт сборки всех секторов в `.glb` и сохранения мастер-проекта `.blend`.

---

## 🚀 Как использовать

### 1. Автоматическая компиляция всех 3D-моделей (1 команда):
```bash
npm run blender:build
```
или напрямую через Blender:
```bash
./engine/blender_bin/blender -b -P scripts/blender/export_all_models.py
```
Скрипт создаст:
- `public/models/agro_power_complex.glb`
- `public/models/vityaz_taxi_hub.glb`
- `public/models/skd_factory_complex.glb`
- `public/models/tech_skyscraper.glb`
- `public/cybervillage_masterplan.blend`

### 2. Открытие проекта в графическом интерфейсе Blender (GUI):
1. Запустите Blender:
   ```bash
   ./engine/blender_bin/blender public/cybervillage_masterplan.blend
   ```
2. В окне «Outliner» (коллекции справа) вы увидите структурированные сектора:
   - `01_Energy_and_Agro`
   - `02_Dom_Taxi_and_Vityaz_Hub`
   - `03_SKD_BYD_Factory`
   - `04_Tech_Center_Skyscraper`
3. Редактируйте геометрию, текстуры и освещение.
4. Экспортируйте выбранный сектор через меню: `File` → `Export` → `glTF 2.0 (.glb)` в папку `public/models/`.

### 3. Генерация через ИИ и REST API
FastAPI сервер (`engine/api_server.py`) предоставляет эндпоинт `/api/worldclaw/blender/execute-bpy`, позволяющий отправлять Python `bpy` код и получать готовый скомпилированный `.glb` на лету.
