"""
Blender Generator: Energy & Agriculture Sector ("Энергетика и Сельское хозяйство")
Expanded & Aligned Layout:
- Both TPPs (Coal TPP & Gas TPP) shifted further west.
- Greenhouse rows placed on the exact horizontal level of each TPP (Upper Row at Y = +28, Lower Row at Y = -28).
- Complete interconnected blue thermal pipeline network connecting TPPs, Greenhouses, and Farm.
- Farm expanded with Vegetable Meadows (carrots, cabbage, corn, potato furrows) and Animal Pastures (cows, sheep, horses, barns, hay bales, tractor).
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

def create_cow(name, location, rotation_y=0, parent=None, mats=None):
    cow_grp = bpy.data.objects.new(name, None)
    cow_grp.location = location
    cow_grp.rotation_euler = (0, 0, rotation_y)
    if parent:
        cow_grp.parent = parent
    bpy.context.scene.collection.objects.link(cow_grp)

    # Body
    create_box(f"{name}_Body", (0, 0, 1.4), (2.8, 1.4, 1.4), mats["animal_cow_white"], cow_grp)
    create_box(f"{name}_Spot1", (-0.3, 0.5, 1.75), (1.1, 0.5, 0.4), mats["animal_cow_black"], cow_grp)
    create_box(f"{name}_Spot2", (0.5, -0.4, 1.5), (0.9, 0.6, 0.6), mats["animal_cow_black"], cow_grp)
    # Head & Snout
    create_box(f"{name}_Head", (1.6, 0, 2.0), (1.1, 1.0, 1.1), mats["animal_cow_white"], cow_grp)
    create_box(f"{name}_Snout", (2.1, 0, 1.8), (0.4, 0.8, 0.6), mats["animal_cow_black"], cow_grp)
    create_box(f"{name}_Horn_L", (1.6, 0.5, 2.6), (0.2, 0.2, 0.4), mats["gantry_yellow"], cow_grp)
    create_box(f"{name}_Horn_R", (1.6, -0.5, 2.6), (0.2, 0.2, 0.4), mats["gantry_yellow"], cow_grp)
    # 4 Legs
    for lx, ly in [(-0.9, 0.45), (-0.9, -0.45), (0.9, 0.45), (0.9, -0.45)]:
        create_cylinder(f"{name}_Leg_{lx}_{ly}", (lx, ly, 0.65), radius=0.22, depth=1.3, material=mats["animal_cow_white"], parent=cow_grp)
    return cow_grp

def create_sheep(name, location, rotation_y=0, parent=None, mats=None):
    sh_grp = bpy.data.objects.new(name, None)
    sh_grp.location = location
    sh_grp.rotation_euler = (0, 0, rotation_y)
    if parent:
        sh_grp.parent = parent
    bpy.context.scene.collection.objects.link(sh_grp)

    # Fluffy Wool Body
    create_box(f"{name}_Wool", (0, 0, 0.95), (1.8, 1.2, 1.1), mats["animal_sheep_wool"], sh_grp)
    create_box(f"{name}_Head", (1.0, 0, 1.2), (0.7, 0.6, 0.7), mats["animal_cow_black"], sh_grp)
    for lx, ly in [(-0.6, 0.4), (-0.6, -0.4), (0.6, 0.4), (0.6, -0.4)]:
        create_cylinder(f"{name}_Leg_{lx}_{ly}", (lx, ly, 0.4), radius=0.14, depth=0.8, material=mats["animal_cow_black"], parent=sh_grp)
    return sh_grp

def build_energy_agro_sector():
    mats = get_materials_dict()
    
    root = bpy.data.objects.new("Energy_Agro_Sector_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Base Platform (Широкая мастер-платформа для гармоничного простора)
    create_box("Agro_Master_Green_Base", (-15, 0, 0.2), (230, 125, 0.4), mats["lego_green"], root)
    create_box("Coal_Plaza_Asphalt", (-95, 28, 0.45), (55, 48, 0.3), mats["asphalt_gray"], root)
    create_box("Gas_Plaza_Asphalt", (-95, -28, 0.45), (55, 48, 0.3), mats["asphalt_gray"], root)
    create_box("Central_Boulevard_Road", (-15, 0, 0.45), (190, 14.0, 0.3), mats["asphalt_gray"], root)
    create_box("Central_Road_Stripe", (-15, 0, 0.62), (180, 0.6, 0.05), mats["road_stripe_yellow"], root)
    create_box("Farm_Plaza_Asphalt", (58, -12, 0.45), (65, 80, 0.3), mats["asphalt_gray"], root)

    # =========================================================================
    # 2. УГОЛЬНАЯ ТЭЦ (2x150 МВт) - ОТОДВИНУТА ДАЛЬШЕ НА ЗАПАД (X = -95, Y = +28)
    # =========================================================================
    # 2.1 Котельный цех (Boiler House Tower, 24м)
    create_box("Coal_Boiler_Tower", (-104, 28, 12.0), (26, 24, 24), mats["gray_industrial"], root)
    create_box("Coal_Tower_Roof", (-104, 28, 24.3), (27, 25, 0.6), mats["dark_slate_roof"], root)
    create_box("Coal_Tower_Solar", (-104, 28, 24.8), (22, 20, 0.3), mats["solar_pv_panel"], root)
    for lvl in range(4):
        create_box(f"Coal_Tower_Win_F_{lvl}", (-104, 15.8, 5.5 + lvl * 5.0), (22, 0.4, 2.4), mats["glass_window"], root)
        create_box(f"Coal_Tower_Win_L_{lvl}", (-117.2, 28, 5.5 + lvl * 5.0), (0.4, 20, 2.4), mats["glass_window"], root)

    # 2.2 Проходимый турбинный зал (Turbine Hall)
    create_box("Coal_Turbine_Floor", (-82, 28, 0.5), (18, 26, 0.2), mats["road_curb"], root)
    create_box("Coal_Turbine_Wall_B", (-82, 41, 6.0), (18, 0.8, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_R", (-73, 28, 6.0), (0.8, 26, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_F_L", (-88, 15, 6.0), (6, 0.8, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_F_R", (-76, 15, 6.0), (6, 0.8, 12), mats["factory_blue"], root)
    create_box("Coal_Turbine_Wall_F_Top", (-82, 15, 10.0), (8, 0.8, 4), mats["factory_blue"], root)
    create_box("Coal_Turbine_Roof", (-82, 28, 12.3), (19, 27, 0.6), mats["dark_slate_roof"], root)
    create_box("Coal_Turbine_Sign", (-82, 14.4, 10.5), (14, 0.4, 2.0), mats["lego_red_brick"], root)

    create_cylinder("Coal_Turbine_Gen", (-82, 28, 2.5), radius=2.2, depth=14, rotation=(0, math.pi/2, 0), material=mats["steel_dark"], parent=root)
    create_box("Coal_Turbine_Panel", (-77, 28, 1.8), (1.0, 6.0, 3.2), mats["sign_blue"], root)

    # 2.3 Галерея углеподачи, силосы и фильтры
    create_box("Coal_Conveyor_Bridge", (-124, 24, 9.5), (20, 4.2, 4.2), mats["steel_dark"], root)
    create_cylinder("Coal_Trestle_1", (-130, 24, 4.5), radius=0.45, depth=9.0, material=mats["gantry_yellow"], parent=root)
    create_cylinder("Coal_Trestle_2", (-120, 24, 6.0), radius=0.45, depth=12.0, material=mats["gantry_yellow"], parent=root)

    for si in range(2):
        sx = -136 + si * 9.5
        create_cylinder(f"Coal_Silo_{si}", (sx, 34, 8.0), radius=4.0, depth=16.0, material=mats["gray_industrial"], parent=root)
        create_cylinder(f"Coal_Silo_Cap_{si}", (sx, 34, 16.5), radius=4.2, depth=1.8, material=mats["dark_slate_roof"], parent=root)

    create_box("Coal_ESP_Filter_1", (-100, 43, 6.0), (12, 8, 12), mats["steel_dark"], root)
    create_box("Coal_ESP_Filter_2", (-86, 43, 6.0), (12, 8, 12), mats["steel_dark"], root)

    for i in range(2):
        cx = -100 + i * 14
        cy = 46
        create_cylinder(f"Coal_Chimney_Base_{i}", (cx, cy, 18), radius=2.7, depth=26, material=mats["white_wall"], parent=root)
        create_cylinder(f"Coal_Chimney_Stripe1_{i}", (cx, cy, 22), radius=2.75, depth=3.5, material=mats["lego_red_brick"], parent=root)
        create_cylinder(f"Coal_Chimney_Stripe2_{i}", (cx, cy, 27), radius=2.75, depth=3.5, material=mats["lego_red_brick"], parent=root)
        create_cylinder(f"Coal_Chimney_Top_{i}", (cx, cy, 31.0), radius=2.8, depth=1.2, material=mats["dark_slate_roof"], parent=root)

    # =========================================================================
    # 3. ГАЗОВАЯ ТЭЦ - ОТОДВИНУТА ДАЛЬШЕ НА ЗАПАД (X = -95, Y = -28)
    # =========================================================================
    # 3.1 Главный газотурбинный зал
    create_box("Gas_Turbine_Floor", (-102, -28, 0.5), (28, 26, 0.2), mats["road_curb"], root)
    create_box("Gas_Wall_Back", (-102, -15, 7.5), (28, 0.8, 15), mats["white_wall"], root)
    create_box("Gas_Wall_Left", (-116, -28, 7.5), (0.8, 26, 15), mats["white_wall"], root)
    create_box("Gas_Wall_Right", (-88, -28, 7.5), (0.8, 26, 15), mats["white_wall"], root)
    create_box("Gas_Wall_F_L", (-111, -41, 7.5), (10, 0.8, 15), mats["white_wall"], root)
    create_box("Gas_Wall_F_R", (-93, -41, 7.5), (10, 0.8, 15), mats["white_wall"], root)
    create_box("Gas_Wall_F_Top", (-102, -41, 12.0), (10, 0.8, 6), mats["white_wall"], root)

    create_triangular_roof("Gas_Roof_Main", (-102, -28, 17.8), width=29, length=27, height=8.0, rotation=(math.pi/2, 0, 0), material=mats["lego_red_brick"], parent=root)
    create_box("Gas_Signboard", (-102, -41.4, 12.5), (18, 0.4, 2.4), mats["factory_blue"], root)

    create_cylinder("Gas_Turbine_Unit", (-102, -28, 3.0), radius=2.5, depth=16, rotation=(0, math.pi/2, 0), material=mats["steel_dark"], parent=root)
    create_cylinder("Gas_Turbine_Ring_1", (-107, -28, 3.0), radius=2.8, depth=0.8, rotation=(0, math.pi/2, 0), material=mats["gantry_yellow"], parent=root)
    create_cylinder("Gas_Turbine_Ring_2", (-97, -28, 3.0), radius=2.8, depth=0.8, rotation=(0, math.pi/2, 0), material=mats["gantry_yellow"], parent=root)

    # 3.2 Котел HRSG (второе здание с красной скатной крышей)
    create_box("Gas_Boiler_Unit", (-79, -28, 6.5), (18, 22, 13), mats["white_wall"], root)
    create_triangular_roof("Gas_Roof_Boiler", (-79, -28, 15.2), width=19, length=23, height=6.5, rotation=(math.pi/2, 0, 0), material=mats["lego_red_brick"], parent=root)
    for fan_i in range(3):
        create_box(f"Gas_Cooler_Fan_{fan_i}", (-84 + fan_i * 5.0, -28, 16.8), (4.5, 4.5, 2.0), mats["gray_industrial"], root)

    create_box("Gas_GRP_Building", (-118, -14, 4.0), (10, 12, 8), mats["gray_industrial"], root)
    for gi in range(4):
        create_cylinder(f"Gas_Tank_{gi}", (-121.0 + gi * 2.2, -7, 4.0), radius=1.0, depth=6.5, material=mats["gantry_yellow"], parent=root)

    create_cylinder("Gas_Chimney_1", (-102, -12, 17), radius=2.4, depth=26, material=mats["white_wall"], parent=root)
    create_cylinder("Gas_Chimney_1_Red1", (-102, -12, 22), radius=2.45, depth=4.0, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_1_Red2", (-102, -12, 27), radius=2.45, depth=4.0, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_1_Top", (-102, -12, 30.0), radius=2.5, depth=1.0, material=mats["dark_slate_roof"], parent=root)

    create_cylinder("Gas_Chimney_2", (-79, -12, 15), radius=2.0, depth=22, material=mats["white_wall"], parent=root)
    create_cylinder("Gas_Chimney_2_Red1", (-79, -12, 19), radius=2.05, depth=3.5, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_2_Red2", (-79, -12, 23), radius=2.05, depth=3.5, material=mats["lego_red_brick"], parent=root)
    create_cylinder("Gas_Chimney_2_Top", (-79, -12, 26.0), radius=2.1, depth=1.0, material=mats["dark_slate_roof"], parent=root)

    # =========================================================================
    # 4. ТЕПЛИЧНЫЙ АГРОКОМПЛЕКС (НА УРОВНЕ КАЖДОЙ ТЭЦ)
    # =========================================================================
    # РЯД 1 (Верхний ряд: СТРОГО НА УРОВНЕ УГОЛЬНОЙ ТЭЦ: Y = +28)
    for col in range(4):
        gx = -48.0 + col * 18.0
        gy = 28.0
        gh = bpy.data.objects.new(f"GH_R1_{col}", None)
        gh.location = (gx, gy, 0)
        gh.parent = root
        bpy.context.scene.collection.objects.link(gh)

        create_box("GH1_Base", (0, 0, 0.4), (15.0, 17.5, 0.8), mats["white_wall"], gh)
        create_box("GH1_Walkway", (0, 0, 0.85), (3.0, 16.0, 0.1), mats["road_curb"], gh)
        create_box("GH1_Bed_L", (-4.5, 0, 0.95), (4.8, 15.0, 0.3), mats["soil_brown"], gh)
        create_box("GH1_Bed_R", (4.5, 0, 0.95), (4.8, 15.0, 0.3), mats["soil_brown"], gh)
        create_box("GH1_Crops_L", (-4.5, 0, 1.4), (3.8, 14.0, 0.6), mats["crop_cabbage_lime"], gh)
        create_box("GH1_Crops_R", (4.5, 0, 1.4), (3.8, 14.0, 0.6), mats["crop_carrot_orange"], gh)

        create_cylinder("GH1_Vault", (0, 0, 5.0), radius=7.0, depth=16.8, rotation=(math.pi/2, 0, 0), material=mats["glass_greenhouse"], parent=gh, vertices=24)
        for rib in range(5):
            create_cylinder(f"GH1_Rib_{rib}", (0, -7.0 + rib * 3.5, 5.0), radius=7.1, depth=0.3, rotation=(math.pi/2, 0, 0), material=mats["white_wall"], parent=gh, vertices=24)

    # РЯД 2 (Нижний ряд: СТРОГО НА УРОВНЕ ГАЗОВОЙ ТЭЦ: Y = -28)
    for col in range(4):
        gx = -48.0 + col * 18.0
        gy = -28.0
        gh = bpy.data.objects.new(f"GH_R2_{col}", None)
        gh.location = (gx, gy, 0)
        gh.parent = root
        bpy.context.scene.collection.objects.link(gh)

        create_box("GH2_Base", (0, 0, 0.4), (15.0, 17.5, 0.8), mats["white_wall"], gh)
        create_box("GH2_Walkway", (0, 0, 0.85), (3.0, 16.0, 0.1), mats["road_curb"], gh)
        create_box("GH2_Bed_L", (-4.5, 0, 0.95), (4.8, 15.0, 0.3), mats["soil_brown"], gh)
        create_box("GH2_Bed_R", (4.5, 0, 0.95), (4.8, 15.0, 0.3), mats["soil_brown"], gh)
        create_box("GH2_Crops_L", (-4.5, 0, 1.4), (3.8, 14.0, 0.6), mats["crop_green"], gh)
        create_box("GH2_Crops_R", (4.5, 0, 1.4), (3.8, 14.0, 0.6), mats["crop_corn_gold"], gh)

        create_cylinder("GH2_Vault", (0, 0, 5.0), radius=7.0, depth=16.8, rotation=(math.pi/2, 0, 0), material=mats["glass_greenhouse"], parent=gh, vertices=24)
        for rib in range(5):
            create_cylinder(f"GH2_Rib_{rib}", (0, -7.0 + rib * 3.5, 5.0), radius=7.1, depth=0.3, rotation=(math.pi/2, 0, 0), material=mats["white_wall"], parent=gh, vertices=24)

    # =========================================================================
    # 5. ПОЛНАЯ СЕТЬ СИНИХ ТЕПЛОТРАСС (СОЕДИНЯЕТ ТЭЦ, ТЕПЛИЦЫ И ФЕРМУ)
    # =========================================================================
    # Верхняя магистраль от Угольной ТЭЦ вдоль верхних теплиц
    create_cylinder("Pipe_Coal_Main", (-28, 39, 1.8), radius=1.3, depth=95, rotation=(0, math.pi/2, 0), material=mats["thermal_pipe_blue"], parent=root)
    # Нижняя магистраль от Газовой ТЭЦ вдоль нижних теплиц
    create_cylinder("Pipe_Gas_Main", (-28, -39, 1.8), radius=1.3, depth=95, rotation=(0, math.pi/2, 0), material=mats["thermal_pipe_blue"], parent=root)

    # Отводы ко всем 8 теплицам
    for col in range(4):
        gx = -48.0 + col * 18.0
        create_cylinder(f"Pipe_Drop_R1_{col}", (gx, 37.5, 1.8), radius=0.65, depth=4.0, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)
        create_cylinder(f"Pipe_Drop_R2_{col}", (gx, -37.5, 1.8), radius=0.65, depth=4.0, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)

    # Центральный коллектор и переходные перемычки с П-образными компенсаторами
    create_cylinder("Pipe_Cross_Upper", (20, 19.5, 1.8), radius=1.2, depth=39, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_Cross_Lower", (20, -19.5, 1.8), radius=1.2, depth=39, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)

    # Главная подающая труба на Ферму и Агропереработку
    create_cylinder("Pipe_To_Farm_Main", (42, 0, 2.0), radius=1.4, depth=46, rotation=(0, math.pi/2, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_To_Farm_Branch1", (55, 12, 1.8), radius=1.1, depth=24, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)
    create_cylinder("Pipe_To_Farm_Branch2", (55, -12, 1.8), radius=1.1, depth=24, rotation=(math.pi/2, 0, 0), material=mats["thermal_pipe_blue"], parent=root)

    # =========================================================================
    # 6. ФЕРМА: ФАБРИКА-КУХНЯ, ЛУГА С ОВОЩАМИ И ПАСТБИЩЕ ЖИВОТНЫХ
    # =========================================================================
    # 6.1 Главное здание Фабрики-кухни и Переработки
    create_box("Farm_Kitchen_Main", (62, 0, 6.0), (22, 28, 12.0), mats["white_wall"], root)
    create_triangular_roof("Farm_Kitchen_Roof", (62, 0, 15.5), width=23, length=29, height=7.5, rotation=(math.pi/2, 0, 0), material=mats["lego_red_brick"], parent=root)
    create_box("Farm_Kitchen_Sign", (50.6, 0, 10.5), (0.4, 16, 2.8), mats["lego_red_brick"], root)
    create_cylinder("Farm_Silo_Feed", (52, 18, 8.0), radius=3.8, depth=16.0, material=mats["gray_industrial"], parent=root)
    create_cylinder("Farm_Silo_Cap", (52, 18, 16.8), radius=4.0, depth=2.2, material=mats["dark_slate_roof"], parent=root)

    # 6.2 ЛУГА С ОВОЩАМИ (Vegetable Fields & Furrows: X = 32..85, Y = 22..48)
    create_box("Veg_Field_Base", (55, 34, 0.4), (55, 24, 0.3), mats["soil_brown"], root)
    # Лего-забор вокруг овощных полей
    create_box("Veg_Fence_N", (55, 46.2, 0.8), (56, 0.4, 0.8), mats["wood_fence"], root)
    create_box("Veg_Fence_S", (55, 21.8, 0.8), (56, 0.4, 0.8), mats["wood_fence"], root)
    create_box("Veg_Fence_E", (82.8, 34, 0.8), (0.4, 24.8, 0.8), mats["wood_fence"], root)

    # Грядки 1: Морковь с оранжевыми плодами
    for row in range(3):
        create_box(f"Carrot_Bed_{row}", (38 + row * 6.5, 34, 0.7), (4.5, 21, 0.3), mats["soil_brown"], root)
        for plant in range(7):
            create_box(f"Carrot_Top_{row}_{plant}", (38 + row * 6.5, 25 + plant * 3.0, 1.1), (2.0, 2.0, 0.4), mats["crop_carrot_orange"], root)
            create_cylinder(f"Carrot_Leaf_{row}_{plant}", (38 + row * 6.5, 25 + plant * 3.0, 1.5), radius=0.6, depth=0.6, material=mats["crop_green"], parent=root)

    # Грядки 2: Капуста
    for row in range(2):
        create_box(f"Cabbage_Bed_{row}", (60 + row * 7.0, 34, 0.7), (5.0, 21, 0.3), mats["soil_brown"], root)
        for plant in range(6):
            create_cylinder(f"Cabbage_Head_{row}_{plant}", (60 + row * 7.0, 25.5 + plant * 3.4, 1.2), radius=1.0, depth=1.0, material=mats["crop_cabbage_lime"], parent=root, vertices=12)

    # Грядки 3: Кукуруза и злаки
    create_box("Corn_Bed", (76, 34, 0.7), (6.0, 21, 0.3), mats["soil_brown"], root)
    for plant in range(8):
        create_cylinder(f"Corn_Stalk_{plant}", (76, 25 + plant * 2.6, 2.2), radius=0.35, depth=3.0, material=mats["crop_green"], parent=root)
        create_cylinder(f"Corn_Ear_{plant}", (76, 25 + plant * 2.6, 2.8), radius=0.6, depth=1.4, material=mats["crop_corn_gold"], parent=root)

    # 6.3 ПАСТБИЩЕ ЖИВОТНЫХ (Livestock Pasture & Barn: X = 32..85, Y = -48..-16)
    create_box("Pasture_Meadow", (58, -32, 0.4), (58, 28, 0.3), mats["lego_green"], root)
    # Деревянный забор пастбища
    create_box("Pasture_Fence_N", (58, -17.8, 0.8), (59, 0.4, 0.8), mats["wood_fence"], root)
    create_box("Pasture_Fence_S", (58, -46.2, 0.8), (59, 0.4, 0.8), mats["wood_fence"], root)
    create_box("Pasture_Fence_E", (87.2, -32, 0.8), (0.4, 28.8, 0.8), mats["wood_fence"], root)

    # Деревянный коровник / амбар
    create_box("Animal_Barn_Main", (78, -32, 4.5), (14, 18, 9.0), mats["lego_red_brick"], root)
    create_triangular_roof("Animal_Barn_Roof", (78, -32, 11.5), width=15, length=19, height=5.5, rotation=(math.pi/2, 0, 0), material=mats["dark_slate_roof"], parent=root)

    # Поилка и стога сена
    create_box("Water_Trough", (65, -24, 0.8), (6.0, 2.2, 0.8), mats["road_curb"], root)
    create_box("Trough_Water", (65, -24, 0.95), (5.4, 1.8, 0.3), mats["canopy_blue"], root)
    for h_i, h_pos in enumerate([(45, -22), (48, -24), (45, -26)]):
        create_cylinder(f"Hay_Bale_{h_i}", (h_pos[0], h_pos[1], 1.2), radius=1.4, depth=2.0, rotation=(math.pi/2, 0, 0), material=mats["hay_yellow"], parent=root)

    # Животные на пастбище: 3 Коровы, 3 Овечки, Лошадь
    create_cow("Cow_1", (42, -34, 0.5), rotation_y=0.4, parent=root, mats=mats)
    create_cow("Cow_2", (52, -40, 0.5), rotation_y=-0.6, parent=root, mats=mats)
    create_cow("Cow_3", (62, -36, 0.5), rotation_y=1.2, parent=root, mats=mats)

    create_sheep("Sheep_1", (46, -42, 0.5), rotation_y=0.8, parent=root, mats=mats)
    create_sheep("Sheep_2", (56, -26, 0.5), rotation_y=-1.1, parent=root, mats=mats)
    create_sheep("Sheep_3", (68, -42, 0.5), rotation_y=0.2, parent=root, mats=mats)

    # Трактор с прицепом
    create_box("Tractor_Body", (38, -12, 1.6), (4.5, 2.6, 2.2), mats["gantry_yellow"], root)
    create_box("Tractor_Cabin", (36.8, -12, 2.8), (2.2, 2.2, 1.8), mats["glass_window"], root)
    create_box("Tractor_Trailer", (44, -12, 1.4), (5.0, 2.6, 1.6), mats["lego_red_brick"], root)
    create_box("Trailer_Hay", (44, -12, 2.2), (4.4, 2.2, 1.2), mats["hay_yellow"], root)

    return root

if __name__ == "__main__":
    clear_scene()
    build_energy_agro_sector()
    print("[Blender Generator] ✅ Expanded Energy & Agro Sector with Vegetables and Livestock built.")
