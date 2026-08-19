"""
Blender Generator: Tech Center Skyscraper & Innovation Campus ("Кибердеревня: Технологический центр")
Walkable interior for FPS First-Person mode:
- Stepped glass skyscraper with open ground-floor atrium, central quantum AI sphere, reception lobby.
- Geodesic AI Lab dome and Drone landing pad.
"""
import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from materials import get_materials_dict
from lego_utils import create_box, create_cylinder, create_quantum_server_rack

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_tech_center_sector():
    mats = get_materials_dict()
    
    root = bpy.data.objects.new("Tech_Center_Sector_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Base Platform
    create_box("Tech_Grass_Base", (0, 0, 0.2), (80, 80, 0.4), mats["lego_green"], root)
    create_box("Tech_Asphalt_Plaza", (0, 0, 0.45), (74, 74, 0.3), mats["asphalt_gray"], root)
    create_box("Tech_Curbs", (0, 0, 0.65), (75, 75, 0.2), mats["road_curb"], root)

    # =========================================================================
    # 2. ПРОСТОРНЫЙ НЕБОСКРЕБ С ПРОХОДИМЫМ АТРИУМОМ
    # =========================================================================
    # 2.1 Внутренний мраморный пол вестибюля
    create_box("Atrium_Floor", (0, 0, 0.5), (32, 32, 0.2), mats["white_wall"], root)

    # 2.2 Стены первого этажа (Полые, с открытым стеклянным входом спереди Y = 16)
    create_box("Atrium_Wall_Back", (0, -16, 7.5), (32, 0.8, 14), mats["white_wall"], root)
    create_box("Atrium_Wall_Left", (-16, 0, 7.5), (0.8, 32, 14), mats["white_wall"], root)
    create_box("Atrium_Wall_Right", (16, 0, 7.5), (0.8, 32, 14), mats["white_wall"], root)
    create_box("Atrium_Wall_Front_L", (-11, 16, 7.5), (10, 0.8, 14), mats["white_wall"], root)
    create_box("Atrium_Wall_Front_R", (11, 16, 7.5), (10, 0.8, 14), mats["white_wall"], root)
    create_box("Atrium_Wall_Front_Lintel", (0, 16, 12.0), (12, 0.8, 5), mats["glass_window"], root)

    # 2.3 Квантовое ядро ИИ в центре вестибюля
    create_cylinder("Quantum_Core_Pedestal", (0, 0, 1.0), radius=3.2, depth=1.2, material=mats["steel_dark"], parent=root)
    create_cylinder("Quantum_Core_Sphere", (0, 0, 3.8), radius=2.2, depth=3.2, material=mats["sign_blue"], parent=root)

    # Серверные стойки вычислений ИИ (справа и слева в вестибюле)
    create_quantum_server_rack("Server_Rack_1", (-10, -12, 0.5), mats, root)
    create_quantum_server_rack("Server_Rack_2", (-12, -12, 0.5), mats, root)
    create_quantum_server_rack("Server_Rack_3", (10, -12, 0.5), mats, root)

    # Стойка ресепшен и голографический стол
    create_box("Lobby_Desk", (8, 6, 1.4), (6.0, 2.0, 1.8), mats["white_wall"], root)
    create_box("Lobby_Desk_Top", (8, 6, 2.4), (6.4, 2.4, 0.2), mats["factory_blue"], root)
    create_box("Holo_Table", (-8, 6, 1.0), (4.0, 4.0, 1.0), mats["steel_dark"], root)
    create_cylinder("Holo_Emitter", (-8, 6, 1.6), radius=1.4, depth=0.2, material=mats["sign_blue"], parent=root)

    # 2.4 Верхние ярусы башни (Tier 1 Slab & Upper Tiers)
    create_box("Tower_Tier1_Slab", (0, 0, 15.2), (33, 33, 1.0), mats["factory_blue"], root)

    # Tier 2 (Mid-rise)
    create_box("Tower_Tier2_Body", (0, 0, 25.0), (24, 24, 18), mats["white_wall"], root)
    create_box("Tower_Tier2_Glass", (0, 0, 25.0), (24.4, 24.4, 15), mats["glass_window"], root)
    create_box("Tower_Tier2_Slab", (0, 0, 34.3), (25, 25, 0.8), mats["factory_blue"], root)

    # Tier 3 (High-rise)
    create_box("Tower_Tier3_Body", (0, 0, 42.0), (18, 18, 15), mats["white_wall"], root)
    create_box("Tower_Tier3_Glass", (0, 0, 42.0), (18.4, 18.4, 12), mats["glass_window"], root)
    create_box("Tower_Tier3_Slab", (0, 0, 49.8), (19, 19, 0.8), mats["factory_blue"], root)

    # Spire & Antenna Mast
    create_cylinder("Tower_Spire", (0, 0, 58.0), radius=0.7, depth=16, material=mats["white_wall"], parent=root)
    create_cylinder("Tower_Beacon", (0, 0, 66.0), radius=1.3, depth=0.8, material=mats["red_cross"], parent=root)

    # =========================================================================
    # 3. ГЕОКУПОЛ ЛАБОРАТОРИЙ ИИ (Geodesic AI Lab)
    # =========================================================================
    create_cylinder("Dome_Base", (-24, 22, 0.8), radius=9.0, depth=1.6, material=mats["white_wall"], parent=root)
    create_cylinder("Dome_Glass", (-24, 22, 6.0), radius=8.5, depth=9.0, material=mats["glass_window"], parent=root, vertices=16)
    create_cylinder("Dome_Core", (-24, 22, 5.5), radius=3.5, depth=4.5, material=mats["sign_blue"], parent=root)

    # =========================================================================
    # 4. ИСПЫТАТЕЛЬНЫЙ ПОЛИГОН БПЛА (Drone Landing Pad)
    # =========================================================================
    create_cylinder("Drone_Pad_Base", (24, 22, 0.6), radius=10.0, depth=0.4, material=mats["lego_green"], parent=root, vertices=32)
    create_cylinder("Drone_Pad_Circle", (24, 22, 0.7), radius=8.0, depth=0.1, material=mats["white_wall"], parent=root, vertices=32)
    create_box("Drone_Pad_H_V", (24, 22, 0.75), (1.4, 6.0, 0.05), mats["white_wall"], root)
    create_box("Drone_Pad_H_H", (24, 22, 0.75), (5.0, 1.4, 0.05), mats["white_wall"], root)

    return root

if __name__ == "__main__":
    clear_scene()
    build_tech_center_sector()
    print("[Blender Generator] ✅ Walkable Tech Center built.")
