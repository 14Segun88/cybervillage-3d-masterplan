"""
Blender Generator: Dom Taxi Hub & Vityaz Ecosystem ("Экосистема Дом Такси и Электрохаб Витязь")
Walkable interior for FPS First-Person mode:
- Spacious 2-story terminal with open glass entrance, interior reception, dispatch center & medical clinic.
- 6-bay charging canopy with EV chargers and BYD electric taxis.
- Car wash bay with open entrance.
"""
import bpy
import math
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from materials import get_materials_dict
from lego_utils import (
    create_box, create_cylinder, create_detailed_byd_car, 
    create_tire_service_changer, create_lego_pine_tree, 
    create_lego_street_light, create_lego_stud_roof,
    create_lego_minifigure
)

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def build_dom_taxi_hub_sector():
    mats = get_materials_dict()
    
    root = bpy.data.objects.new("Dom_Taxi_Hub_Root", None)
    bpy.context.scene.collection.objects.link(root)

    # 1. Base Asphalt Plaza & Green Border
    create_box("Hub_Master_Green", (0, 0, 0.2), (100, 80, 0.4), mats["lego_green"], root)
    create_box("Hub_Asphalt_Plaza", (0, 0, 0.45), (90, 72, 0.3), mats["asphalt_gray"], root)
    create_box("Hub_Concrete_Curbs", (0, 0, 0.65), (92, 74, 0.2), mats["road_curb"], root)

    # =========================================================================
    # 2. ПРОСТОРНЫЙ 2-ЭТАЖНЫЙ ТЕРМИНАЛ «ДОМ ТАКСИ» С ПРОХОДИМЫМ ИНТЕРЬЕРОМ
    # =========================================================================
    # 2.1 Пол терминала
    create_box("Terminal_Interior_Floor", (0, -10, 0.5), (54, 30, 0.2), mats["road_curb"], root)
    
    # 2.2 Стены терминала (Полые, с открытым парадным входом)
    create_box("Terminal_Wall_Back", (0, -25, 7.5), (54, 0.8, 14), mats["white_wall"], root)
    create_box("Terminal_Wall_Left", (-27, -10, 7.5), (0.8, 30, 14), mats["white_wall"], root)
    create_box("Terminal_Wall_Right", (27, -10, 7.5), (0.8, 30, 14), mats["white_wall"], root)
    create_box("Terminal_Wall_Front_L", (-18, 5, 7.5), (18, 0.8, 14), mats["white_wall"], root)
    create_box("Terminal_Wall_Front_R", (18, 5, 7.5), (18, 0.8, 14), mats["white_wall"], root)
    create_box("Terminal_Wall_Front_Lintel", (0, 5, 12.5), (18, 0.8, 4), mats["white_wall"], root)

    # 2.3 Горизонтальные синие архитектурные пояса
    create_box("Terminal_Band_Mid", (0, -10, 7.0), (55, 31, 0.6), mats["factory_blue"], root)
    create_box("Terminal_Band_Top", (0, -10, 14.5), (55.4, 31.4, 0.8), mats["factory_blue"], root)

    # 2.4 Крыша с солнечной электростанцией и Lego-шипами
    create_lego_stud_roof("Terminal_Roof_Deck", (0, -10, 14.8), 54, 30, 0.4, 3.5, mats["dark_slate_roof"], root)
    create_box("Terminal_Solar_Panels", (0, -10, 15.6), (46, 24, 0.3), mats["solar_pv_panel"], root)
    create_box("Terminal_HVAC_1", (-18, -18, 16.6), (5.5, 4.5, 2.5), mats["gray_industrial"], root)
    create_box("Terminal_HVAC_2", (18, -18, 16.6), (5.5, 4.5, 2.5), mats["gray_industrial"], root)

    # 2.5 Внутренний интерьер: Стойка диспетчерской, мониторы, зона отдыха
    create_box("Desk_Dispatch_Counter", (0, -6, 1.6), (14, 2.2, 2.2), mats["white_wall"], root)
    create_box("Desk_Dispatch_Top", (0, -6, 2.8), (15, 2.6, 0.2), mats["factory_blue"], root)
    for mi in range(3):
        create_box(f"Dispatch_Monitor_{mi}", (-4.5 + mi * 4.5, -6.5, 3.8), (2.8, 0.2, 1.6), mats["sign_blue"], root)
    create_box("Lounge_Sofa_1", (-18, -6, 1.2), (6.0, 2.4, 1.4), mats["factory_blue"], root)
    create_box("Lounge_Sofa_2", (-18, -14, 1.2), (6.0, 2.4, 1.4), mats["factory_blue"], root)
    create_box("Lounge_Coffee_Table", (-18, -10, 0.8), (4.0, 2.0, 0.8), mats["white_wall"], root)

    # 2.6 Медицинский центр (Телемедицина / предрейсовый осмотр)
    create_box("Med_Clinic_Partition", (14, -12, 4.5), (0.4, 18, 8.0), mats["glass_window"], root)
    create_box("Med_Doctor_Desk", (20, -12, 1.5), (4.5, 2.5, 2.0), mats["white_wall"], root)
    create_box("Med_Bed", (22, -20, 1.2), (3.0, 7.0, 1.4), mats["white_wall"], root)
    create_box("Med_Cross_Wall", (26.5, -12, 6.0), (0.2, 2.5, 2.5), mats["red_cross"], root)

    # 3. Вывеска «ЭЛЕКТРОХАБ "ВИТЯЗЬ"»
    create_box("Vityaz_Signboard_Board", (0, 5.6, 12.5), (28, 0.4, 2.6), mats["sign_blue"], root)

    # 4. Зарядный фронт: Навес с 6 станциями 240 кВт и реалистичными авто BYD
    create_lego_stud_roof("Charger_Canopy_Roof", (0, 24, 8.5), 56, 18, 0.8, 3.5, mats["canopy_blue"], root)
    create_box("Charger_Canopy_Solar", (0, 24, 9.4), (52, 16, 0.2), mats["solar_pv_panel"], root)

    for c in range(6):
        col_x = (c - 2.5) * 8.5
        create_cylinder(f"Canopy_Pillar_{c}", (col_x, 24, 4.2), radius=0.4, depth=8.4, material=mats["white_wall"], parent=root)

        # 240 kW Ultra-Fast Charging Station
        create_box(f"EV_Pillar_{c}", (col_x, 30, 2.2), (1.4, 1.0, 4.4), mats["white_wall"], root)
        create_box(f"EV_Pillar_Screen_{c}", (col_x, 29.4, 2.8), (0.9, 0.2, 1.4), mats["sign_blue"], root)
        create_box(f"EV_Pillar_Top_{c}", (col_x, 30, 4.5), (1.5, 1.1, 0.3), mats["canopy_blue"], root)

        # White Parking Stall Lines
        create_box(f"Parking_Line_L_{c}", (col_x - 3.8, 22, 0.55), (0.2, 14, 0.05), mats["white_wall"], root)
        create_box(f"Parking_Line_R_{c}", (col_x + 3.8, 22, 0.55), (0.2, 14, 0.05), mats["white_wall"], root)

        # РЕАЛИСТИЧНЫЕ АВТОМОБИЛИ BYD НА ЗАРЯДКЕ
        if c in [0, 1, 3, 4, 5]:
            car_col = mats["factory_blue"] if c % 2 == 0 else mats["road_stripe_yellow"]
            create_detailed_byd_car(f"Parked_BYD_{c}", (col_x, 22, 0.45), rotation_z=-math.pi/2, color_mat=car_col, mats=mats, parent=root)

    # 5. Автоматическая автомойка и СТО сервисный пост со станком шиномонтажа (Слева)
    create_box("Car_Wash_Hangar", (-36, -8, 6.0), (14, 26, 11), mats["factory_blue"], root)
    create_lego_stud_roof("Car_Wash_Roof", (-36, -8, 11.8), 15, 27, 0.6, 3.0, mats["dark_slate_roof"], root)
    create_box("Car_Wash_Portal_F", (-36, 5.2, 4.0), (8, 0.4, 8), mats["glass_window"], root)
    create_box("Car_Wash_Sign", (-36, 5.4, 9.5), (10, 0.4, 1.8), mats["sign_blue"], root)

    # Станок шиномонтажа и диагностический пост СТО внутри сервисного бокса
    create_tire_service_changer("Lego_Tire_Changer", (-36, -14, 0.5), mats, root)
    create_box("STO_Diagnostic_Computer", (-33, -6, 1.4), (1.4, 1.0, 2.0), mats["white_wall"], root)
    create_box("STO_Screen", (-33, -5.4, 1.8), (1.0, 0.1, 0.8), mats["sign_blue"], root)

    # 6. ДИНАМИКА ДОМА ТАКСИ: ПРИБЫВАЮЩИЕ И ОТПРАВЛЯЮЩИЕСЯ ТАКСИСТЫ
    # Дорожка высадки и прибывающее такси
    create_detailed_byd_car("Arriving_Taxi_1", (-16, -26, 0.4), rotation_z=0, color_mat=mats["gantry_yellow"], mats=mats, parent=root)
    # Водитель вышел из такси и направляется к терминалу
    create_lego_minifigure("Driver_Arriving_Walk", (-12, -22, 0.4), rotation_z=math.pi/2, shirt_mat=mats["uniform_orange"], mats=mats, parent=root, is_walking=True)
    # Водитель заходит в стеклянные двери «Дома Такси» (отдохнуть и выпить кофе)
    create_lego_minifigure("Driver_Entering_Doors", (-2, -18, 0.4), rotation_z=math.pi/2, shirt_mat=mats["factory_blue"], mats=mats, parent=root, is_walking=True)

    # Отдохнувший водитель выходит из дверей терминала
    create_lego_minifigure("Driver_Exiting_Doors", (4, -18, 0.4), rotation_z=-math.pi/2, shirt_mat=mats["uniform_orange"], mats=mats, parent=root, is_walking=True)
    # Водитель подходит к заряженному такси
    create_lego_minifigure("Driver_Walking_To_Taxi", (14, -22, 0.4), rotation_z=-math.pi/2, shirt_mat=mats["factory_blue"], mats=mats, parent=root, is_walking=True)
    # Заряженное такси выезжает на линию в город
    create_detailed_byd_car("Departing_Taxi_1", (18, -26, 0.4), rotation_z=0, color_mat=mats["gantry_yellow"], mats=mats, parent=root)

    # Водители на террасе (отдыхают за столиком)
    create_box("Terrace_Cafe_Table", (16, 6, 0.8), (1.6, 1.6, 0.9), mats["white_wall"], root)
    create_lego_minifigure("Driver_Lounge_1", (16, 4.8, 0.4), rotation_z=0, shirt_mat=mats["lego_red_brick"], mats=mats, parent=root)
    create_lego_minifigure("Driver_Lounge_2", (16, 7.2, 0.4), rotation_z=math.pi, shirt_mat=mats["factory_blue"], mats=mats, parent=root)

    # 7. LEGO-Окружение: Ели, фонари и благоустройство
    tree_spots = [
        (-42, 28), (-42, 14), (-42, -28),
        (38, 28), (38, 14), (38, -28),
        (44, -10), (44, 5)
    ]
    for idx, (tx, ty) in enumerate(tree_spots):
        create_lego_pine_tree(f"Lego_Pine_{idx}", (tx, ty, 0.4), height=7.0 + (idx % 3) * 1.2, mats=mats, parent=root)

    street_lights = [(-28, 33), (0, 33), (28, 33), (-28, -28), (28, -28)]
    for idx, (lx, ly) in enumerate(street_lights):
        create_lego_street_light(f"Lego_Street_Light_{idx}", (lx, ly, 0.4), height=6.0, mats=mats, parent=root)

    return root

if __name__ == "__main__":
    clear_scene()
    build_dom_taxi_hub_sector()
    print("[Blender Generator] ✅ Walkable Dom Taxi Hub built.")
