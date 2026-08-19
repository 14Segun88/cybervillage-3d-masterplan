"""
Blender Generator: Energy & Agriculture Sector ("Энергетика и Сельское хозяйство")
Walkable interior for FPS First-Person mode:
- Spacious Walkable Greenhouses with open front glass sliding doors, soil beds, crops, and walking paths.
- Walkable Gas Turbine Hall with giant internal gas turbines.
- Walkable Coal TPP Turbine Hall with open door and machinery.
- Walkable Farmhouse Kitchen and Orchard Garden.
"""
import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from materials import get_materials_dict
from lego_utils import create_box, create_cylinder

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def create_triangular_roof(name, location, width, length, height, rotation=(0, 0, 0), material=None, parent=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=width * 0.57735, depth=length, location=location, rotation=(math.pi/2, 0, 0), vertices=3)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rotation
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj

def build_energy_agro_sector():
    mats = get_materials_dict()
    
    root = bpy.data.objects.new("Energy_Agro_Sector_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Base Platform (Компактная аккуратная база строго под размер зданий фермы)
    create_box("Agro_Master_Green_Base", (-15, 5, 0.2), (160, 115, 0.4), mats["lego_green"], root)
    create_box("Coal_Plaza_Asphalt", (-55, 25, 0.45), (58, 50, 0.3), mats["asphalt_gray"], root)
    create_box("Gas_Plaza_Asphalt", (-55, -24, 0.45), (58, 48, 0.3), mats["asphalt_gray"], root) # Перемещена на ближний передний план
    create_box("Solar_BESS_Plaza", (35, 30, 0.45), (58, 50, 0.3), mats["asphalt_gray"], root) # Солнечный парк и накопители BESS
    create_box("Central_Agro_Road", (-5, -17.5, 0.45), (105, 12.0, 0.3), mats["asphalt_gray"], root)
    create_box("Farm_Plaza_Asphalt", (45, -20, 0.45), (50, 50, 0.3), mats["asphalt_gray"], root)

    # =========================================================================
    # 2. ПРОСТОРНАЯ УГОЛЬНАЯ ТЭЦ (2x150 МВт) С ПРОХОДИМЫМ ТУРБИННЫМ ЗАЛОМ
    # =========================================================================
    # 2.1 Котельный цех (Boiler House Tower, 24м)
    create_box("Coal_Boiler_Tower", (-62, 28, 12.0), (26, 24, 24), mats["gray_industrial"], root)
    create_box("Coal_Tower_Roof", (-62, 28, 24.3), (27, 25, 0.6), mats["dark_slate_roof"], root)
    create_box("Coal_Tower_Solar", (-62, 28, 24.8), (22, 20, 0.3), mats["solar_pv_panel"], root)
    for lvl in range(4):
        create_box(f"Coal_Tower_Win_F_{lvl}", (-62, 15.8, 5.5 + lvl * 5.0), (22, 0.4, 2.4), mats["glass_window"], root)
        create_box(f"Coal_Tower_Win_L_{lvl}", (-75.2, 28, 5.5 + lvl * 5.0), (0.4, 20, 2.4), mats["glass_window"], root)

    # 2.2 Проходимый турбинный зал (Turbine Hall) с открытым входом
    # Пол
    create_box("Coal_Turbine_Floor", (-40, 25, 0.5), (18, 26, 0.2), mats["road_curb"], root)
    # Стены и открытые ворота спереди (Y = +12)
    create_box("Coal_Turbine_Wall_B", (-40, 38, 6.0), (18, 0.8, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_R", (-31, 25, 6.0), (0.8, 26, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_F_L", (-46, 12, 6.0), (6, 0.8, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_F_R", (-34, 12, 6.0), (6, 0.8, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_F_Top", (-40, 12, 10.0), (8, 0.8, 4), mats["factory_blue"], root)
    create_box("Coal_Turbine_Roof", (-40, 25, 12.3), (19, 27, 0.6), mats["dark_slate_roof"], root)
    create_box("Coal_Turbine_Sign", (-40, 11.4, 10.5), (14, 0.4, 2.0), mats["lego_red_brick"], root)

    # Внутренняя паровая турбина внутри машинного зала
    create_cylinder("Coal_Turbine_Gen", (-40, 25, 2.5), radius=2.2, depth=14, rotation=(0, math.pi/2, 0), material=mats["steel_dark"], parent=root)
    create_box("Coal_Turbine_Panel", (-35, 25, 1.8), (1.0, 6.0, 3.2), mats["sign_blue"], root)

    # 2.3 Галерея углеподачи, силосы и фильтры
    create_box("Coal_Conveyor_Bridge", (-82, 22, 9.5), (20, 4.2, 4.2), mats["steel_dark"], root)
    create_cylinder("Coal_Trestle_1", (-88, 22, 4.5), radius=0.45, depth=9.0, material=mats["gantry_yellow"], parent=root)
    create_cylinder("Coal_Trestle_2", (-78, 22, 6.0), radius=0.45, depth=12.0, material=mats["gantry_yellow"], parent=root)

    for si in range(2):
        sx = -94 + si * 9.5
        create_cylinder(f"Coal_Silo_{si}", (sx, 32, 8.0), radius=4.0, depth=16.0, material=mats["gray_industrial"], parent=root)
        create_cylinder(f"Coal_Silo_Cap_{si}", (sx, 32, 16.5), radius=4.2, depth=1.8, material=mats["dark_slate_roof"], parent=root)

    create_box("Coal_ESP_Filter_1", (-58, 43, 6.0), (12, 8, 12), mats["steel_dark"], root)
    create_box("Coal_ESP_Filter_2", (-44, 43, 6.0), (12, 8, 12), mats["steel_dark"], root)

    # Подстанция и 2 высокие трубы
    create_box("Coal_Substation_Pad", (-40, 8, 0.4), (18, 6, 0.3), mats["road_curb"], root)
    create_box("Coal_Transformer_1", (-45, 8, 2.8), (5.5, 4.8, 5.0), mats["steel_dark"], root)
    create_box("Coal_Transformer_2", (-35, 8, 2.8), (5.5, 4.8, 5.0), mats["steel_dark"], root)

    for i in range(2):
        cx = -58 + i * 14
        cy = 46
        create_cylinder(f"Coal_Chimney_Base_{i}", (cx, cy, 18), radius=2.7, depth=26, material=mats["white_wall"], parent=root)
        create_cylinder(f"Coal_Chimney_Stripe1_{i}", (cx, cy, 22), radius=2.75, depth=3.5, material=mats["lego_red_brick"], parent=root)
        create_cylinder(f"Coal_Chimney_Stripe2_{i}", (cx, cy, 27), radius=2.75, depth=3.5, material=mats["lego_red_brick"], parent=root)
        create_cylinder(f"Coal_Chimney_Top_{i}", (cx, cy, 31.0), radius=2.8, depth=1.2, material=mats["dark_slate_roof"], parent=root)

    # =========================================================================
    # 3. ГАЗОВАЯ ТЭЦ (ПЕРЕНЕСЕНА НА ПЕРЕДНИЙ ПЛАН СЛЕВА: X = -58, Y = -22)
    # =========================================================================
    # 3.1 Главный газотурбинный зал с открытыми воротами
    create_box("Gas_Turbine_Floor", (-60, -22, 0.5), (28, 26, 0.2), mats["road_curb"], root)
    create_box("Gas_Wall_Back", (-60, -9, 7.5), (28, 0.8, 15), mats["white_wall"], root)
    create_box("Gas_Wall_Left", (-74, -22, 7.5), (0.8, 26, 15), mats["white_wall"], root)
    create_box("Gas_Wall_Right", (-46, -22, 7.5), (0.8, 26, 15), mats["white_wall"], root)
    create_box("Gas_Wall_F_L", (-69, -35, 7.5), (10, 0.8, 15), mats["white_wall"], root)
    create_box("Gas_Wall_F_R", (-51, -35, 7.5), (10, 0.8, 15), mats["white_wall"], root)
    create_box("Gas_Wall_F_Top", (-60, -35, 12.0), (10, 0.8, 6), mats["white_wall"], root)

    create_triangular_roof("Gas_Roof_Main", (-60, -22, 17.8), width=29, length=27, height=8.0, rotation=(math.pi/2, 0, 0), material=mats["lego_red_brick"], parent=root)
    create_box("Gas_Signboard", (-60, -35.4, 12.5), (18, 0.4, 2.4), mats["factory_blue"], root)

    # Внутренняя газовая турбина, генератор и щиты управления
    create_cylinder("Gas_Turbine_Unit", (-60, -22, 3.0), radius=2.5, depth=16, rotation=(0, math.pi/2, 0), material=mats["steel_dark"], parent=root)
    create_cylinder("Gas_Turbine_Ring_1", (-65, -22, 3.0), radius=2.8, depth=0.8, rotation=(0, math.pi/2, 0), material=mats["gantry_yellow"], parent=root)
    create_cylinder("Gas_Turbine_Ring_2", (-55, -22, 3.0), radius=2.8, depth=0.8, rotation=(0, math.pi/2, 0), material=mats["gantry_yellow"], parent=root)

    # 3.2 Котел HRSG (второе здание с красной скатной крышей)
    create_box("Gas_Boiler_Unit", (-37, -22, 6.5), (18, 22, 13), mats["white_wall"], root)
    create_triangular_roof("Gas_Roof_Boiler", (-37, -22, 15.2), width=19, length=23, height=6.5, rotation=(math.pi/2, 0, 0), material=mats["lego_red_brick"], parent=root)
    for fan_i in range(3):
        create_box(f"Gas_Cooler_Fan_{fan_i}", (-42 + fan_i * 5.0, -22, 16.8), (4.5, 4.5, 2.0), mats["gray_industrial"], root)

    create_box("Gas_GRP_Building", (-76, -8, 4.0), (10, 12, 8), mats["gray_industrial"], root)
    for gi in range(4):
        create_cylinder(f"Gas_Tank_{gi}", (-79.0 + gi * 2.2, -1, 4.0), radius=1.0, depth=6.5, material=mats["gantry_yellow"], parent=root)

    # 2 Трубы Газовой ТЭЦ
    create_cylinder("Gas_Chimney_1", (-60, -6, 17), radius=2.4, depth=26, material=mats["white_wall"], parent=root)
    create_cylinder("Gas_Chimney_1_Red1", (-60, -6, 22), radius=2.45, depth=4.0, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_1_Red2", (-60, -6, 27), radius=2.45, depth=4.0, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_1_Top", (-60, -6, 30.0), radius=2.5, depth=1.0, material=mats["dark_slate_roof"], parent=root)

    create_cylinder("Gas_Chimney_2", (-37, -6, 15), radius=2.0, depth=22, material=mats["white_wall"], parent=root)
    create_cylinder("Gas_Chimney_2_Red1", (-37, -6, 19), radius=2.05, depth=3.5, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_2_Red2", (-37, -6, 23), radius=2.05, depth=3.5, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_2_Top", (-37, -6, 26.0), radius=2.1, depth=1.0, material=mats["dark_slate_roof"], parent=root)

    # 3.3 Солнечный парк и Батарейные накопители BESS на освободившемся верхнем месте (35, 30)
    for srow in range(3):
        for scol in range(4):
            create_box(f"Solar_Panel_{srow}_{scol}", (18 + scol * 10, 20 + srow * 10, 2.5), (8.5, 7.5, 0.4), mats["solar_pv_panel"], root)
    create_box("BESS_Container_1", (30, 48, 3.5), (16, 7.0, 7.0), mats["white_wall"], root)
    create_box("BESS_Container_2", (48, 48, 3.5), (16, 7.0, 7.0), mats["white_wall"], root)

    # =========================================================================
    # 4. ПРОСТОРНЫЕ ПРОХОДИМЫЕ ТЕПЛИЦЫ (2 РЯДА ПО 4 ТЕПЛИЦЫ С ОТКРЫТЫМИ ВХОДАМИ)
    # =========================================================================
    # РЯД 1 (Верхний ряд: Y = -5)
    for col in range(4):
        gx = -42.0 + col * 17.0
        gy = -5.0
        gh = bpy.data.objects.new(f"GH_R1_{col}", None)
        gh.location = (gx, gy, 0)
        gh.parent = root
        bpy.context.scene.collection.objects.link(gh)

        # Пол и дорожка
        create_box("GH1_Base", (0, 0, 0.4), (14.0, 16.5, 0.8), mats["white_wall"], gh)
        create_box("GH1_Walkway", (0, 0, 0.85), (3.0, 15.0, 0.1), mats["road_curb"], gh)
        # Грядки слева и справа от прохода
        create_box("GH1_Bed_L", (-4.2, 0, 0.95), (4.5, 14.0, 0.3), mats["soil_brown"], gh)
        create_box("GH1_Bed_R", (4.2, 0, 0.95), (4.5, 14.0, 0.3), mats["soil_brown"], gh)
        create_box("GH1_Crops_L", (-4.2, 0, 1.4), (3.5, 13.0, 0.6), mats["crop_green"], gh)
        create_box("GH1_Crops_R", (4.2, 0, 1.4), (3.5, 13.0, 0.6), mats["crop_green"], gh)

        # Высокий стеклянный арочный свод (Высота 7м)
        create_cylinder("GH1_Vault", (0, 0, 4.8), radius=6.6, depth=15.8, rotation=(math.pi/2, 0, 0), material=mats["glass_greenhouse"], parent=gh, vertices=24)
        for rib in range(5):
            create_cylinder(f"GH1_Rib_{rib}", (0, -6.5 + rib * 3.25, 4.8), radius=6.7, depth=0.3, rotation=(math.pi/2, 0, 0), material=mats["white_wall"], parent=gh, vertices=24)

    # РЯД 2 (Нижний ряд: Y = -30)
    for col in range(4):
        gx = -42.0 + col * 17.0
        gy = -30.0
        gh = bpy.data.objects.new(f"GH_R2_{col}", None)
        gh.location = (gx, gy, 0)
        gh.parent = root
        bpy.context.scene.collection.objects.link(gh)

        create_box("GH2_Base", (0, 0, 0.4), (14.0, 16.5, 0.8), mats["white_wall"], gh)
        create_box("GH2_Walkway", (0, 0, 0.85), (3.0, 15.0, 0.1), mats["road_curb"], gh)
        create_box("GH2_Bed_L", (-4.2, 0, 0.95), (4.5, 14.0, 0.3), mats["soil_brown"], gh)
        create_box("GH2_Bed_R", (4.2, 0, 0.95), (4.5, 14.0, 0.3), mats["soil_brown"], gh)
        create_box("GH2_Crops_L", (-4.2, 0, 1.4), (3.5, 13.0, 0.6), mats["crop_green"], gh)
        create_box("GH2_Crops_R", (4.2, 0, 1.4), (3.5, 13.0, 0.6), mats["crop_green"], gh)

        create_cylinder("GH2_Vault", (0, 0, 4.8), radius=6.6, depth=15.8, rotation=(math.pi/2, 0, 0), material=mats["glass_greenhouse"], parent=gh, vertices=24)
        for rib in range(5):
            create_cylinder(f"GH2_Rib_{rib}", (0, -6.5 + rib * 3.25, 4.8), radius=6.7, depth=0.3, rotation=(math.pi/2, 0, 0), material=mats["white_wall"], parent=gh, vertices=24)

    # =========================================================================
    # 5. СЕТЬ СИНИХ ТЕПЛОТРАСС
    # =========================================================================
    create_cylinder("Pipe_Coal_Outlet", (-36, 12, 1.8), radius=1.2, depth=24, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_Gas_Outlet", (-37, -10, 1.8), radius=1.2, depth=16, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_Central_Header", (-5, 0, 1.8), radius=1.3, depth=72, rotation=(0, math.pi/2, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_Between_GH_Rows", (-15, -17.5, 1.5), radius=1.0, depth=64, rotation=(0, math.pi/2, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_To_Farm_Kitchen", (28, -17.5, 1.5), radius=1.1, depth=24, rotation=(0, math.pi/2, 0), material=mats["thermal_pipe_blue"], parent=root)

    # =========================================================================
    # 6. ФАБРИКА-КУХНЯ, САД, СИЛОС И ЖИВОТНОВОДСТВО
    # =========================================================================
    fb1 = create_box("Farm_Kitchen_Main", (50, -20, 5.0), (18, 24, 10.0), mats["white_wall"], root)
    create_triangular_roof("Farm_Kitchen_Roof", (50, -20, 13.2), width=19, length=25, height=6.5, rotation=(math.pi/2, 0, 0), material=mats["lego_red_brick"], parent=root)
    create_box("Farm_Kitchen_Sign", (50, -7.8, 8.5), (14, 0.4, 2.4), mats["lego_red_brick"], root)

    create_cylinder("Farm_Silo_Body", (40, -40, 8.0), radius=3.8, depth=16.0, material=mats["gray_industrial"], parent=root)
    create_cylinder("Farm_Silo_Top", (40, -40, 16.8), radius=4.0, depth=2.2, material=mats["dark_slate_roof"], parent=root)

    for t_idx, t_pos in enumerate([(36, -8), (44, -4), (54, -4), (62, -8)]):
        create_cylinder(f"Garden_Tree_Trunk_{t_idx}", (t_pos[0], t_pos[1], 2.0), radius=0.5, depth=4.0, material=mats["soil_brown"], parent=root)
        create_cylinder(f"Garden_Tree_Crown_{t_idx}", (t_pos[0], t_pos[1], 5.2), radius=2.8, depth=3.8, material=mats["crop_green"], parent=root, vertices=12)

    create_box("Livestock_Soil", (64, -36, 0.35), (22, 18, 0.4), mats["soil_brown"], root)
    for c_idx, c_pos in enumerate([(59, -33), (64, -39), (69, -34)]):
        create_box(f"Animal_Body_{c_idx}", (c_pos[0], c_pos[1], 1.1), (2.2, 1.3, 1.4), mats["white_wall"], root)

    create_box("Tractor_Body", (50, -42, 1.4), (3.8, 2.2, 2.0), mats["gantry_yellow"], root)

    return root

if __name__ == "__main__":
    clear_scene()
    build_energy_agro_sector()
    print("[Blender Generator] ✅ Walkable Energy & Agro Sector built.")
