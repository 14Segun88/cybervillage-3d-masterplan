"""
Blender Generator: SKD BYD Assembly Plant ("Производственный комплекс SKD сборки электромобилей BYD")
Walkable interior for FPS First-Person mode:
- Spacious 70x40m industrial hangar with open roll-up doors, polished concrete floor, saw-tooth daylight roof.
- Internal robotic assembly line with robotic welding arms and cars.
- External conveyor gantry and red Lego scaling milestone towers.
"""
import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from materials import get_materials_dict
from lego_utils import (
    create_box, create_cylinder, create_lego_brick_tower, create_detailed_byd_car,
    create_cnc_stamping_machine, create_blade_battery_bench, create_laser_inspection_tunnel,
    create_agv_transport_robot, create_lego_pine_tree, create_lego_street_light,
    create_lego_stud_roof, create_lego_car_hauler_truck, create_lego_minifigure
)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_skd_factory_sector():
    mats = get_materials_dict()
    
    root = bpy.data.objects.new("SKD_Factory_Sector_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Base Platform
    create_box("Factory_Grass_Base", (10, 0, 0.2), (140, 84, 0.4), mats["lego_green"], root)
    create_box("Factory_Asphalt_Plaza", (10, 0, 0.45), (132, 76, 0.3), mats["asphalt_gray"], root)
    create_box("Factory_Curbs", (10, 0, 0.65), (133, 77, 0.2), mats["road_curb"], root)

    # =========================================================================
    # 2. ПРОСТОРНЫЙ ГЛАВНЫЙ СБОРОЧНЫЙ ЦЕХ С ПРОХОДИМЫМ ИНТЕРЬЕРОМ
    # =========================================================================
    # 2.1 Внутренний пол цеха
    create_box("Factory_Floor_Concrete", (0, -6, 0.5), (68, 38, 0.2), mats["road_curb"], root)

    # 2.2 Стены сборочного цеха (Полые, с открытыми воротами)
    # Задняя стена (Y = -25)
    create_box("Factory_Wall_Back", (0, -25, 8.5), (68, 0.8, 16), mats["factory_blue"], root)
    # Левая стена (X = -34)
    create_box("Factory_Wall_Left", (-34, -6, 8.5), (0.8, 38, 16), mats["factory_blue"], root)
    # Правая стена (X = +34)
    create_box("Factory_Wall_Right", (34, -6, 8.5), (0.8, 38, 16), mats["factory_blue"], root)
    # Передний фасад (Y = +13) с открытыми воротами
    create_box("Factory_Wall_Front_L", (-23, 13, 8.5), (22, 0.8, 16), mats["factory_blue"], root)
    create_box("Factory_Wall_Front_R", (23, 13, 8.5), (22, 0.8, 16), mats["factory_blue"], root)
    create_box("Factory_Wall_Front_Header", (0, 13, 13.5), (24, 0.8, 6), mats["factory_blue"], root)
    create_box("Factory_Sign_Board", (0, 13.6, 14.5), (26, 0.4, 2.8), mats["sign_blue"], root)

    # Белые фасадные колонны
    for c in range(5):
        cx = (c - 2) * 16.0
        create_box(f"Factory_Pillar_{c}", (cx, 13.6, 8.5), (1.4, 1.4, 16), mats["white_wall"], root)

    # 2.3 3 Пилообразных световых фонаря на крыше
    for r in range(3):
        y_off = -18 + r * 12.0
        create_box(f"Skylight_Slant_{r}", (0, y_off, 18.0), (66, 6.5, 0.4), mats["white_wall"], root)
        create_box(f"Skylight_Glass_{r}", (0, y_off + 3.2, 18.0), (64, 0.4, 4.8), mats["glass_window"], root)

    # 2 Дымовые трубы на крыше
    for tx in [-18, 18]:
        create_cylinder(f"Factory_Chimney_{tx}", (tx, -14, 23), radius=1.8, depth=14, material=mats["white_wall"], parent=root)
        create_cylinder(f"Factory_Chimney_RedBand_{tx}", (tx, -14, 26), radius=1.85, depth=3.5, material=mats["lego_red_brick"], parent=root)

    # =========================================================================
    # 3. ВНУТРЕННЯЯ СТАНОЧНАЯ ЛИНИЯ И РОБОТЫ (LEGO СТИЛИСТИКА)
    # =========================================================================
    create_box("Internal_Conveyor_Track", (0, -6, 0.9), (54, 5.5, 0.8), mats["dark_slate_roof"], root)
    
    # 3.1 Тяжелые гидравлические штамповочные станки с ЧПУ (справа в цеху)
    create_cnc_stamping_machine("CNC_Press_1", (18, -18, 0.5), mats, root)
    create_cnc_stamping_machine("CNC_Press_2", (8, -18, 0.5), mats, root)

    # 3.2 Стенд сборки батарей Blade Battery и электропривода
    create_blade_battery_bench("Battery_Assembly_1", (-2, -18, 0.5), mats, root)

    # 3.3 Лазерный туннель контроля геометрии кузова (Quality Control)
    create_laser_inspection_tunnel("Laser_QC_Tunnel", (24, -6, 0.5), mats, root)

    # 3.4 Автономные логистические AGV-роботы
    create_agv_transport_robot("AGV_Robot_1", (4, -12, 0.5), mats, root)
    create_agv_transport_robot("AGV_Robot_2", (-14, -12, 0.5), mats, root)

    # 3.5 Сварочные роботы KUKA/ABB
    for ir in range(3):
        rx = (ir - 1) * 18.0
        create_box(f"Internal_Robot_Base_L_{ir}", (rx, -2.5, 2.0), (1.6, 1.6, 2.2), mats["gantry_yellow"], root)
        create_box(f"Internal_Robot_Arm_L_{ir}", (rx, -3.8, 3.8), (0.8, 2.4, 2.4), mats["gantry_yellow"], root)
        create_cylinder(f"Internal_Welder_L_{ir}", (rx, -4.6, 2.4), radius=0.3, depth=1.4, material=mats["sign_blue"], parent=root)

        create_box(f"Internal_Robot_Base_R_{ir}", (rx, -9.5, 2.0), (1.6, 1.6, 2.2), mats["gantry_yellow"], root)
        create_box(f"Internal_Robot_Arm_R_{ir}", (rx, -8.2, 3.8), (0.8, 2.4, 2.4), mats["gantry_yellow"], root)
        create_cylinder(f"Internal_Welder_R_{ir}", (rx, -7.4, 2.4), radius=0.3, depth=1.4, material=mats["sign_blue"], parent=root)

        # Кузова авто на внутренней линии
        car_stage_col = mats["lego_red_brick"] if ir == 0 else (mats["white_wall"] if ir == 1 else mats["factory_blue"])
        create_detailed_byd_car(f"Internal_BYD_{ir}", (rx, -6, 0.9), rotation_z=0, color_mat=car_stage_col, mats=mats, parent=root)

    # Шоурум готовой продукции (внутри цеха слева)
    create_box("Showroom_Floor", (-22, -16, 0.65), (18, 14, 0.3), mats["white_wall"], root)
    create_detailed_byd_car("Showroom_BYD_Seal", (-22, -16, 0.8), rotation_z=math.pi/4, color_mat=mats["factory_blue"], mats=mats, parent=root)

    # =========================================================================
    # 4. ВНЕШНЯЯ КОНВЕЙЕРНАЯ ЭСТАКАДА И ПОРТАЛЫ
    # =========================================================================
    create_box("Conveyor_Steel_Base", (16, 28, 1.1), (74, 9.0, 2.2), mats["dark_slate_roof"], root)
    
    for rob in range(4):
        rx = (rob - 1.5) * 17 + 16
        create_box(f"Gantry_Leg_L_{rob}", (rx, 23.5, 5.0), (1.3, 1.3, 10), mats["gantry_yellow"], root)
        create_box(f"Gantry_Leg_R_{rob}", (rx, 32.5, 5.0), (1.3, 1.3, 10), mats["gantry_yellow"], root)
        create_box(f"Gantry_Beam_{rob}", (rx, 28.0, 10.2), (1.3, 10.2, 1.3), mats["gantry_yellow"], root)

        create_box(f"Robot_Base_{rob}", (rx, 28.0, 8.6), (1.5, 1.5, 1.8), mats["steel_dark"], root)
        create_box(f"Robot_Arm_Upper_{rob}", (rx, 27.2, 6.4), (0.7, 2.4, 3.0), mats["gantry_yellow"], root)
        create_cylinder(f"Robot_Tool_{rob}", (rx, 26.5, 4.4), radius=0.35, depth=1.4, material=mats["sign_blue"], parent=root)

    # Автомобили на внешней эстакаде (Реалистичные BYD)
    for idx, cx in enumerate([-16, 0, 16, 32]):
        c_mat = mats["factory_blue"] if idx % 2 == 0 else mats["lego_red_brick"]
        create_detailed_byd_car(f"Conveyor_BYD_{idx}", (cx, 28, 2.2), rotation_z=0, color_mat=c_mat, mats=mats, parent=root)

    # =========================================================================
    # 5. ЛОГИСТИЧЕСКИЙ ТЕРМИНАЛ: ПОГРУЗКА ГОТОВЫХ АВТОМОБИЛЕЙ НА АВТОВОЗЫ
    # =========================================================================
    # Погрузочная рампа для заезда электрокаров на автовоз
    create_box("Hauler_Loading_Pad", (20, 42, 0.45), (42, 14, 0.3), mats["asphalt_gray"], root)
    create_box("Hauler_Ramp_Slope", (6, 42, 0.9), (6.0, 4.2, 1.2), mats["dark_slate_roof"], root)
    create_box("Hauler_Ramp_Safety_Rail_L", (6, 44.2, 1.8), (6.0, 0.3, 0.8), mats["gantry_yellow"], root)
    create_box("Hauler_Ramp_Safety_Rail_R", (6, 39.8, 1.8), (6.0, 0.3, 0.8), mats["gantry_yellow"], root)

    # 1-я Фура-автовоз на погрузке у рампы (загружена 3 готовыми BYD)
    create_lego_car_hauler_truck("Hauler_Truck_Loading", (22, 42, 0.4), rotation_z=0, mats=mats, parent=root, loaded_cars=3)

    # 2-я Фура-автовоз уезжает с завода с партией машин (на выездной полосе)
    create_box("Factory_Exit_Road", (-30, 42, 0.45), (45, 14, 0.3), mats["asphalt_gray"], root)
    create_lego_car_hauler_truck("Hauler_Truck_Departing", (-24, 42, 0.4), rotation_z=math.pi, mats=mats, parent=root, loaded_cars=2)

    # Операторы погрузки и рабочие завода (Lego Minifigures)
    create_lego_minifigure("Worker_Loading_1", (10, 38, 0.5), rotation_z=math.pi/6, shirt_mat=mats["uniform_orange"], mats=mats, parent=root)
    create_lego_minifigure("Worker_Loading_2", (12, 46, 0.5), rotation_z=-math.pi/3, shirt_mat=mats["uniform_orange"], mats=mats, parent=root)
    create_lego_minifigure("Factory_Engineer_1", (-10, 20, 0.5), rotation_z=0, shirt_mat=mats["factory_blue"], mats=mats, parent=root, is_walking=True)

    # =========================================================================
    # 6. КРАСНЫЕ LEGO-БАШНИ МАСШТАБИРОВАНИЯ
    # =========================================================================
    create_lego_brick_tower("Lego_Tower_100", (-46, 28, 0.5), width=3.8, length=3.8, height=3.2, num_studs_x=2, num_studs_y=2, material=mats["lego_red_brick"], parent=root)
    create_lego_brick_tower("Lego_Tower_250", (-38, 28, 0.5), width=3.8, length=3.8, height=6.4, num_studs_x=2, num_studs_y=2, material=mats["lego_red_brick"], parent=root)
    create_lego_brick_tower("Lego_Tower_500", (-30, 28, 0.5), width=4.2, length=4.2, height=10.5, num_studs_x=2, num_studs_y=2, material=mats["lego_red_brick"], parent=root)
    create_lego_brick_tower("Lego_Tower_1000", (-22, 28, 0.5), width=4.8, length=4.8, height=16.5, num_studs_x=3, num_studs_y=3, material=mats["lego_red_brick"], parent=root)
    create_lego_brick_tower("Lego_Tower_2M", (58, 28, 0.5), width=7.5, length=7.5, height=28.0, num_studs_x=4, num_studs_y=4, material=mats["lego_red_brick"], parent=root)

    # 7. LEGO-Окружение фабрики: Ели и фонари
    factory_trees = [
        (-50, -20), (-50, 0), (-50, 15),
        (72, -20), (72, 0), (72, 18), (72, 32)
    ]
    for idx, (tx, ty) in enumerate(factory_trees):
        create_lego_pine_tree(f"Factory_Pine_{idx}", (tx, ty, 0.4), height=7.5 + (idx % 2) * 1.5, mats=mats, parent=root)

    factory_lights = [(-20, 52), (10, 52), (40, 52), (-34, -28), (34, -28)]
    for idx, (lx, ly) in enumerate(factory_lights):
        create_lego_street_light(f"Factory_Light_{idx}", (lx, ly, 0.4), height=6.5, mats=mats, parent=root)

    return root

if __name__ == "__main__":
    clear_scene()
    build_skd_factory_sector()
    print("[Blender Generator] ✅ Walkable SKD Factory built.")
