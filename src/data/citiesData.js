/**
 * База данных ключевых городов проекта «Кибердеревня», «Дом Такси» и «Чистый Город».
 * Содержит параметры для привязки к движку 3D-миров Tencent Hunyuan3D-WorldClaw
 * и сценарии моделирования событий.
 */

export const CITIES_DATA = [
  {
    id: "serpukhov",
    name: "Серпухов",
    region: "Московская область",
    coords: { lon: 37.41, lat: 54.91 },
    category: "manufacturing",
    color: "#ffb700", // Золотой неон
    badge: "ФЛАГМАНСКИЙ КЛАСТЕР",
    title: "Завод SKD и Кластер «Кибердеревня»",
    shortDesc: "Крупноузловая сборка электромобилей BYD, производство зарядных станций, кампусы, лаборатории ИИ и двигателей.",
    stats: {
      "Темп сборки": "100 → 1000 авто/мес",
      "Экосистема": "Завод, ТЭЦ, Лаборатории",
      "Продукция": "BYD E6/E7, T5, Станции 240кВт",
      "Сертификация": "ОТТС / СТС / Лизинг"
    },
    hunyuanWorld: {
      worldId: "world_serpukhov_worldclaw",
      worldName: "Серпухов: Цифровой Двойник (Tencent Hunyuan3D-WorldClaw)",
      prompt: "Tencent Hunyuan3D-WorldClaw Serpukhov Masterplan: Dom Taxi Vityaz mega charging hub (11x 240kW liquid-cooled pillars, telemedicine clinic, glass-roof factory kitchen), SKD BYD automotive assembly factory with 4-axis robotic welding arms and motorized conveyor line, coal/gas thermal power plant with rising steam pipes feeding arched greenhouses, and Cyber-Village tech center skyscraper with rotating AI dome.",
      environmentType: "cyber_industrial",
      skyColor: "#060918",
      fogColor: "#060918",
      accentColor: "#ffb700",
      zones: [
        { name: "Электрохаб «Витязь» и Дом Такси (240 кВт)", type: "hub", pos: [0, 0, 0], size: [28, 9, 18], color: "#00f0ff" },
        { name: "Завод Крупноузловой Сборки [SKD] BYD", type: "factory", pos: [0, 0, -50], size: [46, 15, 26], color: "#ffb700" },
        { name: "Роботизированный конвейер и лазерная сварка", type: "conveyor", pos: [12, 0, -32], size: [54, 2, 7], color: "#ffaa00" },
        { name: "Автосалон розничной продажи BYD (30%)", type: "showroom", pos: [44, 0, -32], size: [20, 8, 16], color: "#ff3344" },
        { name: "ТЭЦ и Агрокомплекс «Чистая Страна»", type: "energy", pos: [-56, 0, 32], size: [24, 14, 20], color: "#00ff9d" },
        { name: "Технологический Центр «Кибердеревня»", type: "tech", pos: [54, 0, 32], size: [16, 42, 16], color: "#00f0ff" },
        { name: "Геокупол Лабораторий ИИ и АКБ", type: "lab", pos: [74, 0, 48], size: [20, 10, 20], color: "#00ff9d" }
      ],
      events: ["event_skd_assembly", "event_cyber_village_life", "event_energy_balance"]
    }
  },
  {
    id: "moscow",
    name: "Москва",
    region: "Столичный округ",
    coords: { lon: 37.62, lat: 55.75 },
    category: "flagship_hub",
    color: "#00f0ff", // Неоновый циан
    badge: "ЦЕНТРАЛЬНЫЙ ХАБ",
    title: "Экосистема «Дом Такси» & Электрохаб «Витязь»",
    shortDesc: "Центральный операционный хаб: 11 ультрабыстрых станций (160-240 кВт), стенды телемедицины, мойка и ТО.",
    stats: {
      "Флот в обороте": "600+ электротакси",
      "Электрохаб": "6x160 кВт + 5x240 кВт",
      "Пропускная способность": "400-600 авто/сутки",
      "Инфраструктура": "Телемедицина + Фабрика кухни"
    },
    hunyuanWorld: {
      worldId: "world_moscow_hub",
      worldName: "Москва: Мега-Электрохаб «Витязь» & Дом Такси",
      prompt: "Futuristic ultra-fast electric taxi hub 'Vityaz' in Moscow, glowing neon canopies with high-speed 240kW liquid-cooled charging pillars, continuous stream of sleek BYD electric taxis arriving, automated driver medical inspection station, automated high-pressure car wash, 2-story glass command tower with real-time fleet telematics.",
      environmentType: "urban_hub",
      skyColor: "#081426",
      fogColor: "#040a14",
      accentColor: "#00f0ff",
      zones: [
        { name: "Электрохаб «Витязь» (10 станций 240 кВт)", type: "hub", pos: [0, 0, 0], size: [35, 8, 30], color: "#00f0ff" },
        { name: "Дом Такси: Комплекс предрейсового осмотра", type: "building", pos: [-35, 0, 5], size: [22, 12, 25], color: "#00b4d8" },
        { name: "Центр Телемедицины и отдыха водителей", type: "lab", pos: [-35, 0, -25], size: [18, 10, 18], color: "#00ff9d" },
        { name: "Роботизированный автомоечный комплекс", type: "wash", pos: [35, 0, 15], size: [16, 8, 22], color: "#7b61ff" },
        { name: "Фабрика-кухня и зона питания персонала", type: "kitchen", pos: [35, 0, -18], size: [20, 9, 20], color: "#ffb700" }
      ],
      events: ["event_peak_hour_taxi", "event_telemedicine_check", "event_smart_grid"]
    }
  },
  {
    id: "kemerovo",
    name: "Кемерово",
    region: "Кузбасс, Сибирь",
    coords: { lon: 86.08, lat: 55.35 },
    category: "energy",
    color: "#ff5500", // Огненный неон
    badge: "ЭНЕРГОГЕНЕРАЦИЯ",
    title: "Угольная и Газовая ТЭЦ Энергокомплекса",
    shortDesc: "Прямая генерация электроэнергии в местах добычи угля и газа. Использование тепла для агрокомплексов программы «Чистая страна».",
    stats: {
      "Тип генерации": "Уголь + Газ (ТЭЦ)",
      "Себестоимость": "Минимальные потери доставки",
      "Утилизация тепла": "Тепличные агрокомплексы",
      "Назначение": "Запитка хабов и дата-центров"
    },
    hunyuanWorld: {
      worldId: "world_kemerovo_power",
      worldName: "Кузбасс: Энергогенерационный Кластер & Агрокомплекс",
      prompt: "Massive modern eco-filtered thermal power station near Siberian coal mining basin, enormous glowing cooling towers with steam, high-voltage transformer substation feeding regional grid, adjacent high-tech automated greenhouse farm utilizing surplus low-cost industrial heat for agriculture.",
      environmentType: "power_agro",
      skyColor: "#1a0f08",
      fogColor: "#0f0704",
      accentColor: "#ff5500",
      zones: [
        { name: "Главный энергоблок ТЭЦ с экофильтрацией", type: "power", pos: [-15, 0, -20], size: [35, 32, 28], color: "#ff5500" },
        { name: "Трансформаторная подстанция 500 кВ", type: "substation", pos: [25, 0, -20], size: [25, 8, 22], color: "#ffaa00" },
        { name: "Агрокомплекс «Чистая Страна» (Теплицы на бросовом тепле)", type: "greenhouse", pos: [0, 0, 25], size: [50, 10, 30], color: "#00ff9d" },
        { name: "Система аккумуляции и буферизации мощности", type: "bess", pos: [-40, 0, 10], size: [18, 6, 20], color: "#00f0ff" }
      ],
      events: ["event_energy_balance", "event_agro_cycle"]
    }
  },
  {
    id: "vladivostok",
    name: "Владивосток",
    region: "Приморский край",
    coords: { lon: 131.88, lat: 43.11 },
    category: "logistics",
    color: "#e040fb", // Неоновый фиолетовый
    badge: "МОРСКОЙ ПОРТ-ХАБ",
    title: "Логистический Терминал Поставки SKD",
    shortDesc: "Морской терминал приемки контейнеров с машинокомплектами BYD E6/E7 и T5, перегрузка на ж/д составы в Серпухов.",
    stats: {
      "Грузооборот": "1500+ SKD комплектов/мес",
      "Транспорт": "Морской порт + Ж/Д терминал",
      "Маршрут": "Владивосток → Серпухов",
      "Инфраструктура": "Автоматизированные краны"
    },
    hunyuanWorld: {
      worldId: "world_vladivostok_port",
      worldName: "Владивосток: Морской SKD Логистический Порт",
      prompt: "Deep water seaport terminal in Vladivostok Pacific bay at night, massive robotic gantry cranes moving shipping containers with electric vehicle assembly kits, container freight trains loading BYD components, illuminated docks reflecting in dark ocean waters with cargo vessels.",
      environmentType: "seaport",
      skyColor: "#0d0b24",
      fogColor: "#070614",
      accentColor: "#e040fb",
      zones: [
        { name: "Причальный фронт и мега-краны STS", type: "port", pos: [0, 0, -25], size: [60, 28, 15], color: "#e040fb" },
        { name: "Контейнерный терминал SKD BYD", type: "storage", pos: [-20, 0, 10], size: [35, 10, 35], color: "#7b61ff" },
        { name: "Железнодорожный погрузочный узел", type: "rail", pos: [30, 0, 15], size: [20, 6, 45], color: "#00f0ff" }
      ],
      events: ["event_skd_delivery", "event_port_dispatch"]
    }
  },
  {
    id: "kazan",
    name: "Казань",
    region: "Республика Татарстан",
    coords: { lon: 49.12, lat: 55.79 },
    category: "tech",
    color: "#00ff9d", // Изумрудный неон
    badge: "IT-ИННОПОЛИС",
    title: "Интеллектуальное Управление Сетями (Smart Grid)",
    shortDesc: "Разработка алгоритмов динамического ценообразования зарядки, предиктивной телематики и балансировки нагрузок.",
    stats: {
      "Специализация": "Smart Grid & AI Dispatch",
      "Экономия энергии": "До 28% на тарифах",
      "Серверный кластер": "10 PFlops Neural Cloud",
      "Партнеры": "Иннополис, Револьт"
    },
    hunyuanWorld: {
      worldId: "world_kazan_innopolis",
      worldName: "Казань: Smart Grid AI Command Hub",
      prompt: "Futuristic circular smart tech campus in Kazan Innopolis, glass geodesic domes, holographic data streams of energy distribution, supercomputer server farm, autonomous delivery pods on clean pavements.",
      environmentType: "smart_city",
      skyColor: "#051a14",
      fogColor: "#020d0a",
      accentColor: "#00ff9d",
      zones: [
        { name: "Дата-центр диспетчеризации сети хабов", type: "datacenter", pos: [0, 0, 0], size: [26, 16, 26], color: "#00ff9d" },
        { name: "Лаборатория предиктивного ИИ телематики", type: "lab", pos: [-28, 0, 15], size: [20, 12, 20], color: "#00f0ff" },
        { name: "Демо-полигон беспилотных такси", type: "track", pos: [25, 0, 15], size: [24, 2, 35], color: "#ffb700" }
      ],
      events: ["event_smart_grid", "event_ai_prediction"]
    }
  },
  {
    id: "spb",
    name: "Санкт-Петербург",
    region: "Северо-Западный округ",
    coords: { lon: 30.33, lat: 59.93 },
    category: "tech",
    color: "#7b61ff",
    badge: "ЦИФРОВОЙ R&D",
    title: "Центр Цифровых Двойников и Софта",
    shortDesc: "Разработка облачного софта для «Дом Такси», мобильного приложения для водителей и систем телемедицинского контроля.",
    stats: {
      "Продукт": "Платформа «Дом Такси OS»",
      "Телемедицина": "Интеграция со стендами",
      "Водителей в системе": "10 000+ аккаунтов"
    },
    hunyuanWorld: {
      worldId: "world_spb_software",
      worldName: "Санкт-Петербург: Digital Twin Software Center",
      prompt: "High-tech software research campus on Gulf of Finland coast, sleek glass architecture, illuminated neon server towers, digital twin holographic projection room.",
      environmentType: "tech_hub",
      skyColor: "#0f0e26",
      fogColor: "#070714",
      accentColor: "#7b61ff",
      zones: [
        { name: "Центральный офис разработки ПО", type: "office", pos: [0, 0, 0], size: [30, 22, 22], color: "#7b61ff" },
        { name: "Лаборатория телемедицинских сенсоров", type: "lab", pos: [-25, 0, 10], size: [18, 10, 18], color: "#00ff9d" }
      ],
      events: ["event_telemedicine_check"]
    }
  },
  {
    id: "ekaterinburg",
    name: "Екатеринбург",
    region: "Свердловская область",
    coords: { lon: 60.60, lat: 56.84 },
    category: "manufacturing",
    color: "#38bdf8",
    badge: "УРАЛЬСКИЙ КЛАСТЕР",
    title: "Производство Корпусов и Модулей Станций",
    shortDesc: "Металлообработка, сборка вандалостойких блочных конструкций и корпусов для зарядных станций 160-240 кВт.",
    stats: {
      "Производство": "Блочные модули хабов",
      "Мощность": "До 50 модулей в месяц",
      "Снабжение": "Сеть электрохабов РФ"
    },
    hunyuanWorld: {
      worldId: "world_ekb_industrial",
      worldName: "Екатеринбург: Завод Модульных Конструкций Зарядок",
      prompt: "Heavy industrial high-precision metal stamping and fabrication plant in Urals, laser cutting robots producing heavy duty charging station chassis and modular container substations.",
      environmentType: "industrial",
      skyColor: "#0c1524",
      fogColor: "#060a12",
      accentColor: "#38bdf8",
      zones: [
        { name: "Цех лазерного раскроя и гибки металла", type: "factory", pos: [-15, 0, 0], size: [32, 12, 30], color: "#38bdf8" },
        { name: "Цех сборки блочных подстанций", type: "factory", pos: [22, 0, 0], size: [26, 11, 24], color: "#00f0ff" }
      ],
      events: ["event_skd_assembly"]
    }
  },
  {
    id: "novosibirsk",
    name: "Новосибирск",
    region: "Сибирский округ",
    coords: { lon: 82.93, lat: 55.00 },
    category: "tech",
    color: "#2dd4bf",
    badge: "АКАДЕМГОРОДОК",
    title: "Институт Твердотельных АКБ и Электропривода",
    shortDesc: "Фундаментальные исследования в области морозостойких химических источников тока и энергоэффективных синхронных моторов.",
    stats: {
      "Фокус": "Морозостойкость до -45°C",
      "Ресурс АКБ": "До 1 000 000 км пробега",
      "Инновации": "Натрий-ион и Твердый электролит"
    },
    hunyuanWorld: {
      worldId: "world_nsk_science",
      worldName: "Новосибирск: Академгородок АКБ & Двигателей",
      prompt: "Modern Siberian scientific research campus surrounded by taiga forest in snow, cryo-testing laboratories for cold weather EV batteries and electric powertrains.",
      environmentType: "science",
      skyColor: "#091a1d",
      fogColor: "#040e10",
      accentColor: "#2dd4bf",
      zones: [
        { name: "Криогенная лаборатория испытания АКБ", type: "lab", pos: [-15, 0, 5], size: [25, 14, 25], color: "#2dd4bf" },
        { name: "Стенд динамических испытаний электромоторов", type: "lab", pos: [20, 0, -10], size: [22, 10, 20], color: "#00ff9d" }
      ],
      events: ["event_cyber_village_life"]
    }
  },
  {
    id: "sochi",
    name: "Сочи",
    region: "Краснодарский край",
    coords: { lon: 39.72, lat: 43.60 },
    category: "green_city",
    color: "#f43f5e",
    badge: "ЭКО-КУРОРТ",
    title: "100% Электрический Курортный Таксопарк",
    shortDesc: "Пилотный регион полной декарбонизации пассажирского транспорта с питанием от солнечных парков Черноморского побережья.",
    stats: {
      "Флот": "150 электротакси BYD E6",
      "Эко-эффект": "-4 500 тонн CO2/год",
      "Солнечные навесы": "2.5 МВт пик"
    },
    hunyuanWorld: {
      worldId: "world_sochi_resort",
      worldName: "Сочи: Зеленый Курортный Электропарк",
      prompt: "Coastal resort city with futuristic palm trees, sleek solar-paneled charging canopies overlooking the sea, bright turquoise electric cabs driving along clean scenic seaside highway.",
      environmentType: "resort_eco",
      skyColor: "#1f0d1b",
      fogColor: "#11060e",
      accentColor: "#f43f5e",
      zones: [
        { name: "Курортный электрохаб с солнечным навесом", type: "hub", pos: [0, 0, 0], size: [30, 8, 25], color: "#f43f5e" },
        { name: "Солнечная электростанция 2.5 МВт", type: "solar", pos: [30, 0, -15], size: [28, 4, 30], color: "#ffb700" }
      ],
      events: ["event_peak_hour_taxi"]
    }
  }
];
