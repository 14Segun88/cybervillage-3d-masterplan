"""
Blender Generator: Autonomous Drone Port & Cargo Launch Hub ("Дронопорт и Логистический Центр")
Features:
- Flight Control Command Tower with 360-degree glass cupola and radar antenna.
- 4 Heavy Drone Launchpads with illuminated 'H' pads and hazard boundary tiles.
- Autonomous Quadcopters launching into flight and landing with cargo crates.
- Robotic battery swapping & package distribution hub.
- Lego Minifigure flight controllers and technicians.
"""
import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from materials import get_materials_dict
from lego_utils import (
    create_box, create_cylinder, create_lego_pine_tree,
    create_lego_street_light, create_lego_stud_roof,
    create_lego_minifigure, create_lego_quadcopter_drone
)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_drone_port_sector():
    mats = get_materials_dict()

    root = bpy.data.objects.new("Drone_Port_Sector_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Base Platform (55m x 55m)
    create_box("Drone_Port_Base", (0, 0, 0.2), (65, 65, 0.4), mats["lego_green"], root)
    create_box("Drone_Tarmac_Asphalt", (0, 0, 0.45), (56, 56, 0.3), mats["asphalt_gray"], root)

    # 2. ДИСПЕТЧЕРСКАЯ ВЫШКА УПРАВЛЕНИЯ ПОЛЕТАМИ (Control Tower)
    # Основание башни
    create_box("Tower_Base", (0, 0, 4.0), (14, 14, 8.0), mats["gray_industrial"], root)
    create_lego_stud_roof("Tower_Base_Roof_Studs", (0, 0, 8.15), width=14.4, length=14.4, material=mats["dark_slate_roof"], parent=root)

    # Ствол вышки
    create_box("Tower_Shaft", (0, 0, 14.0), (8.0, 8.0, 12.0), mats["white_wall"], root)

    # Купол командного пункта (360 панорамное остекление)
    create_box("Tower_Cupola_Glass", (0, 0, 21.5), (12.0, 12.0, 3.5), mats["glass_window"], root)
    create_box("Tower_Cupola_Roof", (0, 0, 23.5), (13.0, 13.0, 0.6), mats["factory_blue"], root)
    create_box("Tower_Sign", (0, -6.1, 23.5), (8.0, 0.3, 1.4), mats["sign_blue"], root)

    # Радар и антенна связи
    create_cylinder("Tower_Radar_Mast", (0, 0, 26.0), radius=0.25, depth=5.0, material=mats["steel_dark"], parent=root)
    create_cylinder("Tower_Radar_Dish", (0, 0, 27.5), radius=1.6, depth=0.3, rotation=(0.5, 0, 0), material=mats["pipe_joint_silver"], parent=root, vertices=12)

    # 3. 4 ПУСКОВЫХ ПЛОЩАДКИ ДЛЯ ДРОНОВ (Launchpads Alpha, Beta, Gamma, Delta)
    pad_positions = [
        (-18, -18, "Pad_Alpha"),
        (18, -18, "Pad_Beta"),
        (-18, 18, "Pad_Gamma"),
        (18, 18, "Pad_Delta")
    ]

    for px, py, pname in pad_positions:
        # Платформа площадки со скошенными углами
        create_box(f"{pname}_Plaza", (px, py, 0.65), (13.0, 13.0, 0.4), mats["dark_slate_roof"], root)
        # Неоновое кольцо подсветки
        create_cylinder(f"{pname}_Ring", (px, py, 0.88), radius=5.0, depth=0.08, material=mats["neon_cyan"], parent=root, vertices=24)
        create_cylinder(f"{pname}_Inner", (px, py, 0.89), radius=4.6, depth=0.08, material=mats["asphalt_gray"], parent=root, vertices=24)
        # Знак 'H' (Helipad)
        create_box(f"{pname}_H_Bar_L", (px - 1.2, py, 0.94), (0.6, 3.2, 0.04), mats["road_stripe_yellow"], root)
        create_box(f"{pname}_H_Bar_R", (px + 1.2, py, 0.94), (0.6, 3.2, 0.04), mats["road_stripe_yellow"], root)
        create_box(f"{pname}_H_Bar_M", (px, py, 0.94), (2.0, 0.6, 0.04), mats["road_stripe_yellow"], root)

        # 4 Угловых маяка
        for bx, by in [(-5.8, -5.8), (5.8, -5.8), (-5.8, 5.8), (5.8, 5.8)]:
            create_cylinder(f"{pname}_Beacon_{bx}_{by}", (px + bx, py + by, 1.0), radius=0.25, depth=0.35, material=mats["neon_orange"], parent=root)

    # 4. ДРОНЫ (Готовые к взлету и летящие в воздухе)
    # Дрон на площадке Альфа (на зарядке)
    create_lego_quadcopter_drone("Drone_Pad_Alpha", (-18, -18, 1.4), rotation=(0, 0, 0), mats=mats, parent=root, has_cargo=True)
    
    # Дрон на площадке Бета
    create_lego_quadcopter_drone("Drone_Pad_Beta", (18, -18, 1.4), rotation=(0, 0, math.pi/4), mats=mats, parent=root, has_cargo=False)

    # Дрон в воздухе над площадкой Гамма (взлетает, Z = 8.5)
    create_lego_quadcopter_drone("Drone_Air_Gamma", (-18, 18, 8.5), rotation=(0.1, 0.05, 0.8), mats=mats, parent=root, has_cargo=True)

    # Дрон высоко в небе (Z = 16.0, летит в сторону города с посылкой)
    create_lego_quadcopter_drone("Drone_Air_High", (22, 22, 16.0), rotation=(-0.15, 0.1, 2.1), mats=mats, parent=root, has_cargo=True)

    # 5. СКЛАД ПОСЫЛОК И РОБОТ-МАНИПУЛЯТОР
    create_box("Cargo_Sorting_Hub", (-16, 0, 2.0), (8.0, 10.0, 3.5), mats["factory_blue"], root)
    create_box("Cargo_Conveyor_Belt", (-8, 0, 1.2), (9.0, 2.2, 1.5), mats["dark_slate_roof"], root)
    for cbox in range(3):
        create_box(f"Conveyor_Crate_{cbox}", (-10 + cbox * 2.4, 0, 2.2), (1.1, 1.1, 0.9), mats["uniform_orange"], root)

    # 6. LEGO-ЧЕЛОВЕЧКИ (Операторы дронов и техники)
    create_lego_minifigure("Drone_Pilot_1", (-6, -4, 0.6), rotation_z=math.pi/3, shirt_mat=mats["uniform_orange"], mats=mats, parent=root)
    create_lego_minifigure("Drone_Pilot_2", (-4, 4, 0.6), rotation_z=-math.pi/4, shirt_mat=mats["factory_blue"], mats=mats, parent=root)

    # 7. Фонари и ели
    for idx, (lx, ly) in enumerate([(-25, 0), (25, 0), (0, -25), (0, 25)]):
        create_lego_street_light(f"DronePort_Light_{idx}", (lx, ly, 0.5), height=5.5, mats=mats, parent=root)

    for idx, (tx, ty) in enumerate([(-28, -28), (28, -28), (-28, 28), (28, 28)]):
        create_lego_pine_tree(f"DronePort_Pine_{idx}", (tx, ty, 0.5), height=6.5, mats=mats, parent=root)

    return root

if __name__ == "__main__":
    clear_scene()
    build_drone_port_sector()
    print("[Blender Generator] ✅ Drone Port Sector built successfully.")
