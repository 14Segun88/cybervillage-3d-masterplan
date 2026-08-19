"""
=============================================================================
🏛️ 3D ESTATE GENERATOR FOR BLENDER (3.x / 4.x)
=============================================================================
Промпт:
"Создать 3D‑сцену жилого участка с домом, гаражом, бассейном и садом. 
Главный дом — одноэтажный, с плоской тёмно‑серой крышей и большими стеклянными дверями. 
Рядом — прямоугольный бассейн с голубой водой и бежевым каменным настилом. 
Слева — садовый павильон с плоской крышей, стеклянными стенами и перголой из серого металла. 
Перед павильоном — круглый каменный фонтан, вокруг — серые плитки и небольшие круглые деревья. 
Слева вверху — двойной гараж с белыми воротами и плоской крышей, соединённый с домом мощёной дорожкой. 
Вся территория окружена светло‑серой плиткой, с зелёными деревьями и аккуратным газоном."
=============================================================================
"""

import bpy
import math
import mathutils
import os

# ---------------------------------------------------------------------------
# 1. Менеджер коллекций и PBR материалов
# ---------------------------------------------------------------------------
def get_or_create_collection(name, parent_coll=None):
    if name in bpy.data.collections:
        coll = bpy.data.collections[name]
    else:
        coll = bpy.data.collections.new(name)
        if parent_coll:
            parent_coll.children.link(coll)
        else:
            bpy.context.scene.collection.children.link(coll)
    return coll

def link_to_collection(obj, target_coll):
    if not target_coll:
        return
    for c in list(obj.users_collection):
        if c != target_coll:
            c.objects.unlink(obj)
    if obj.name not in target_coll.objects:
        target_coll.objects.link(obj)

def set_smooth_shading(obj):
    if obj.type == 'MESH' and obj.data.polygons:
        for poly in obj.data.polygons:
            poly.use_smooth = True

def create_pbr_material(name, base_color=(0.8, 0.8, 0.8, 1.0), roughness=0.45, metallic=0.0,
                        emission_color=(0.0, 0.0, 0.0, 1.0), emission_strength=0.0,
                        transmission=0.0, ior=1.5, alpha=1.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]

    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    bsdf = nodes.get("Principled BSDF")
    if not bsdf:
        bsdf = nodes.new(type="ShaderNodeBsdfPrincipled")
        output = nodes.get("Material Output") or nodes.new(type="ShaderNodeOutputMaterial")
        links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])

    if "Base Color" in bsdf.inputs:
        bsdf.inputs["Base Color"].default_value = base_color
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = roughness
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic

    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.5
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.5

    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = emission_color
    elif "Emission" in bsdf.inputs:
        bsdf.inputs["Emission"].default_value = emission_color
    if "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Strength"].default_value = emission_strength

    if transmission > 0.0:
        if "Transmission Weight" in bsdf.inputs:
            bsdf.inputs["Transmission Weight"].default_value = transmission
        elif "Transmission" in bsdf.inputs:
            bsdf.inputs["Transmission"].default_value = transmission
        if "IOR" in bsdf.inputs:
            bsdf.inputs["IOR"].default_value = ior

    if alpha < 1.0:
        if "Alpha" in bsdf.inputs:
            bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(mat, 'blend_method'):
            mat.blend_method = 'BLEND'
        if hasattr(mat, 'shadow_method'):
            mat.shadow_method = 'NONE'

    return mat

def init_palette():
    palette = {
        # Стены и фасады
        "white_stucco": create_pbr_material("Mat_WhiteStucco", (0.93, 0.93, 0.92, 1.0), roughness=0.45),
        "dark_roof": create_pbr_material("Mat_DarkRoof", (0.38, 0.39, 0.42, 1.0), roughness=0.60),
        "dark_fascia": create_pbr_material("Mat_DarkFascia", (0.28, 0.29, 0.32, 1.0), roughness=0.40),
        "concrete_wall": create_pbr_material("Mat_ConcreteWall", (0.82, 0.83, 0.84, 1.0), roughness=0.50),

        # Дерево и террасы
        "beige_deck": create_pbr_material("Mat_BeigeDeck", (0.84, 0.65, 0.44, 1.0), roughness=0.40),
        "teak_slats": create_pbr_material("Mat_TeakSlats", (0.76, 0.52, 0.32, 1.0), roughness=0.42),
        "wood_planter": create_pbr_material("Mat_WoodPlanter", (0.60, 0.40, 0.25, 1.0), roughness=0.45),

        # Металл и остекление
        "black_frames": create_pbr_material("Mat_BlackFrames", (0.16, 0.16, 0.18, 1.0), roughness=0.25, metallic=0.7),
        "pergola_metal": create_pbr_material("Mat_PergolaMetal", (0.42, 0.43, 0.46, 1.0), roughness=0.30, metallic=0.85),
        "garage_door_white": create_pbr_material("Mat_GarageDoorWhite", (0.92, 0.93, 0.94, 1.0), roughness=0.30),
        "red_accent_frame": create_pbr_material("Mat_RedAccentFrame", (0.80, 0.16, 0.14, 1.0), roughness=0.35),
        "metal_hvac": create_pbr_material("Mat_MetalHVAC", (0.82, 0.84, 0.86, 1.0), roughness=0.22, metallic=0.88),
        "dark_utility_box": create_pbr_material("Mat_DarkUtilityBox", (0.30, 0.32, 0.34, 1.0), roughness=0.40),

        # Остекление
        "clear_glass": create_pbr_material("Mat_ClearGlass", (0.92, 0.96, 0.98, 0.25), roughness=0.03, transmission=0.92, ior=1.52, alpha=0.25),

        # Бассейн и вода
        "pool_water": create_pbr_material("Mat_PoolWater", (0.18, 0.72, 0.92, 0.85), roughness=0.02, transmission=0.85, ior=1.333, alpha=0.85),
        "pool_tile_cyan": create_pbr_material("Mat_PoolTileCyan", (0.18, 0.65, 0.82, 1.0), roughness=0.18),
        "pool_coping_beige": create_pbr_material("Mat_PoolCopingBeige", (0.88, 0.86, 0.82, 1.0), roughness=0.45),

        # Мощение и дороги
        "paving_tile_light": create_pbr_material("Mat_PavingTileLight", (0.82, 0.82, 0.80, 1.0), roughness=0.55),
        "paving_tile_dark": create_pbr_material("Mat_PavingTileDark", (0.72, 0.72, 0.70, 1.0), roughness=0.60),

        # Растительность
        "lawn_grass": create_pbr_material("Mat_LawnGrass", (0.28, 0.60, 0.20, 1.0), roughness=0.65),
        "tree_canopy": create_pbr_material("Mat_TreeCanopy", (0.24, 0.52, 0.17, 1.0), roughness=0.45),
        "bush_green": create_pbr_material("Mat_BushGreen", (0.20, 0.46, 0.15, 1.0), roughness=0.50),
        "tree_trunk": create_pbr_material("Mat_TreeTrunk", (0.34, 0.24, 0.15, 1.0), roughness=0.70),

        # Мебель интерьера
        "sofa_fabric": create_pbr_material("Mat_SofaFabric", (0.86, 0.80, 0.72, 1.0), roughness=0.60),
        "interior_wood": create_pbr_material("Mat_InteriorWood", (0.68, 0.48, 0.28, 1.0), roughness=0.35),
        "interior_white": create_pbr_material("Mat_InteriorWhite", (0.94, 0.94, 0.94, 1.0), roughness=0.40),
        "curtain_white": create_pbr_material("Mat_CurtainWhite", (0.95, 0.95, 0.95, 0.85), roughness=0.70, alpha=0.85),
    }
    return palette


# ---------------------------------------------------------------------------
# 2. Геометрические примитивы
# ---------------------------------------------------------------------------
def create_box(name, location, size, material=None, collection=None):
    sx, sy, sz = size
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if collection:
        link_to_collection(obj, collection)
    return obj

def create_cylinder(name, location, radius, depth, material=None, collection=None, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=location, rotation=rotation, vertices=32)
    obj = bpy.context.active_object
    obj.name = name
    set_smooth_shading(obj)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if collection:
        link_to_collection(obj, collection)
    return obj

def create_slatted_wall(name, center, width, height, depth=0.04, slat_w=0.06, slat_gap=0.03, material=None, collection=None, vertical=True):
    cx, cy, cz = center
    if vertical:
        count = max(1, int(width / (slat_w + slat_gap)))
        start_x = cx - (count - 1) * (slat_w + slat_gap) / 2.0
        for i in range(count):
            sx = start_x + i * (slat_w + slat_gap)
            create_box(f"{name}_slat_{i}", (sx, cy, cz), (slat_w, depth, height), material, collection)
    else:
        count = max(1, int(height / (slat_w + slat_gap)))
        start_z = cz - (count - 1) * (slat_w + slat_gap) / 2.0
        for i in range(count):
            sz = start_z + i * (slat_w + slat_gap)
            create_box(f"{name}_slat_{i}", (cx, cy, sz), (width, depth, slat_w), material, collection)

def create_glass_facade(name, center, width, height, cols=4, rows=1, frame_mat=None, glass_mat=None, collection=None):
    cx, cy, cz = center
    create_box(f"{name}_glass", (cx, cy, cz), (width - 0.04, 0.02, height - 0.04), glass_mat, collection)
    frame_t = 0.06
    frame_d = 0.08
    create_box(f"{name}_frame_top", (cx, cy, cz + height/2 - frame_t/2), (width, frame_d, frame_t), frame_mat, collection)
    create_box(f"{name}_frame_bot", (cx, cy, cz - height/2 + frame_t/2), (width, frame_d, frame_t), frame_mat, collection)
    create_box(f"{name}_frame_left", (cx - width/2 + frame_t/2, cy, cz), (frame_t, frame_d, height), frame_mat, collection)
    create_box(f"{name}_frame_right", (cx + width/2 - frame_t/2, cy, cz), (frame_t, frame_d, height), frame_mat, collection)
    if cols > 1:
        step_x = width / cols
        for i in range(1, cols):
            mx = cx - width/2 + i * step_x
            create_box(f"{name}_mullion_v_{i}", (mx, cy, cz), (frame_t * 0.8, frame_d * 0.9, height), frame_mat, collection)

def create_fluffy_spherical_tree(name, location, radius=0.92, trunk_h=1.1, pal=None, coll=None):
    cx, cy, cz = location
    create_cylinder(f"{name}_trunk", (cx, cy, cz + trunk_h/2), radius=0.08, depth=trunk_h, material=pal["tree_trunk"], collection=coll)
    canopy_z = cz + trunk_h + radius * 0.85
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=(cx, cy, canopy_z), segments=32, ring_count=24)
    c_main = bpy.context.active_object
    c_main.name = f"{name}_canopy_main"
    c_main.scale = (1.0, 1.0, 0.92)
    set_smooth_shading(c_main)
    c_main.data.materials.append(pal["tree_canopy"])
    link_to_collection(c_main, coll)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius * 0.62, location=(cx + radius * 0.35, cy - radius * 0.25, canopy_z + radius * 0.18), segments=24, ring_count=16)
    c_sub1 = bpy.context.active_object
    c_sub1.name = f"{name}_canopy_sub1"
    set_smooth_shading(c_sub1)
    c_sub1.data.materials.append(pal["tree_canopy"])
    link_to_collection(c_sub1, coll)

    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius * 0.58, location=(cx - radius * 0.3, cy + radius * 0.25, canopy_z + radius * 0.12), segments=24, ring_count=16)
    c_sub2 = bpy.context.active_object
    c_sub2.name = f"{name}_canopy_sub2"
    set_smooth_shading(c_sub2)
    c_sub2.data.materials.append(pal["tree_canopy"])
    link_to_collection(c_sub2, coll)

def create_tiered_fountain(name, center, pal=None, coll=None):
    cx, cy, cz = center
    create_cylinder(f"{name}_paving_ring", (cx, cy, cz + 0.04), radius=1.4, depth=0.08, material=pal["paving_tile_light"], collection=coll)
    create_cylinder(f"{name}_stone_basin", (cx, cy, cz + 0.18), radius=1.1, depth=0.22, material=pal["pool_coping_beige"], collection=coll)
    create_cylinder(f"{name}_water", (cx, cy, cz + 0.22), radius=0.92, depth=0.06, material=pal["pool_water"], collection=coll)
    create_cylinder(f"{name}_center_pedestal", (cx, cy, cz + 0.38), radius=0.32, depth=0.40, material=pal["pool_coping_beige"], collection=coll)
    create_cylinder(f"{name}_top_bowl", (cx, cy, cz + 0.56), radius=0.42, depth=0.10, material=pal["black_frames"], collection=coll)
    create_cylinder(f"{name}_top_nozzle", (cx, cy, cz + 0.66), radius=0.05, depth=0.16, material=pal["metal_hvac"], collection=coll)

    for idx, angle in enumerate([0.3, 1.8, 3.5, 4.9]):
        bx = cx + math.cos(angle) * 1.25
        by = cy + math.sin(angle) * 1.25
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.20, location=(bx, by, cz + 0.16), segments=16, ring_count=12)
        b_obj = bpy.context.active_object
        b_obj.name = f"{name}_bush_{idx}"
        set_smooth_shading(b_obj)
        b_obj.data.materials.append(pal["bush_green"])
        link_to_collection(b_obj, coll)


# ---------------------------------------------------------------------------
# 3. ОСНОВНОЙ СБОРЩИК 3D ДИОРАМЫ
# ---------------------------------------------------------------------------
def build_exact_reference_estate():
    print("🚀 Генерация 3D макета жилого участка по промпту...")

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    pal = init_palette()

    coll_ground = get_or_create_collection("00_Ground_and_Site")
    coll_house = get_or_create_collection("01_Main_House")
    coll_garage = get_or_create_collection("02_Garage")
    coll_pavilion = get_or_create_collection("03_Garden_Pavilion")
    coll_pool = get_or_create_collection("04_Pool_and_Courtyard")
    coll_landscape = get_or_create_collection("05_Landscape_and_Trees")
    coll_lighting = get_or_create_collection("06_Lighting_and_Cameras")

    # =========================================================================
    # 3.1. УЧАСТОК И БАЗОВОЕ ЗОНИРОВАНИЕ
    # =========================================================================
    site_w, site_d = 26.0, 26.0
    
    # 1. Постамент диорамы
    create_box("Site_Base_Plinth", (0, 0, -0.4), (site_w + 1.2, site_d + 1.2, 0.8), pal["concrete_wall"], coll_ground)
    
    # 2. Сплошной сочный газон
    create_box("Site_Main_Lawn", (0, 0, 0.01), (site_w, site_d, 0.04), pal["lawn_grass"], coll_ground)

    # 3. Периметральный бетонный бордюр
    border_h = 0.22
    border_t = 0.25
    create_box("Perimeter_N", (0, site_d/2 - border_t/2, border_h/2), (site_w, border_t, border_h), pal["concrete_wall"], coll_ground)
    create_box("Perimeter_S", (0, -site_d/2 + border_t/2, border_h/2), (site_w, border_t, border_h), pal["concrete_wall"], coll_ground)
    create_box("Perimeter_W", (-site_w/2 + border_t/2, 0, border_h/2), (border_t, site_d, border_h), pal["concrete_wall"], coll_ground)
    create_box("Perimeter_E", (site_w/2 - border_t/2, 0, border_h/2), (border_t, site_d, border_h), pal["concrete_wall"], coll_ground)

    # 4. Передняя большая мощеная площадь
    plaza_w, plaza_d = 10.5, 9.5
    plaza_x, plaza_y = -0.8, -9.8
    create_box("Forecourt_Plaza", (plaza_x, plaza_y, 0.035), (plaza_w, plaza_d, 0.05), pal["paving_tile_dark"], coll_ground)

    # 5. Мощеные дорожки двора:
    create_box("Paving_Pool_Surround_S", (-0.5, -4.0, 0.03), (12.0, 1.8, 0.04), pal["paving_tile_light"], coll_ground)
    create_box("Paving_Pool_Surround_W", (-4.2, -1.0, 0.03), (3.6, 6.5, 0.04), pal["paving_tile_light"], coll_ground)
    create_box("Paving_Driveway_Garage", (-1.8, 5.0, 0.03), (7.0, 4.5, 0.04), pal["paving_tile_light"], coll_ground)

    # Площадка павильона
    create_box("Pavilion_Platform_Paving", (-7.5, 1.8, 0.06), (6.8, 6.8, 0.08), pal["paving_tile_light"], coll_ground)

    # Газонная полоса между бассейном и виллой
    create_box("Lawn_Strip_Pool_House", (2.5, 1.8, 0.035), (9.0, 2.2, 0.04), pal["lawn_grass"], coll_ground)

    # =========================================================================
    # 3.2. ГЛАВНЫЙ ДОМ (Одноэтажный, с плоской темно-серой крышей и стеклянными дверями)
    # =========================================================================
    house_x, house_y = 5.2, 5.2
    house_w, house_d, house_h = 7.6, 7.0, 3.4
    
    create_box("House_Foundation", (house_x, house_y, 0.12), (house_w + 0.2, house_d + 0.2, 0.24), pal["concrete_wall"], coll_house)
    create_box("House_Main_Walls", (house_x, house_y, house_h/2 + 0.2), (house_w, house_d, house_h), pal["white_stucco"], coll_house)

    # Плоская темно-серая крыша
    roof_z = house_h + 0.28
    create_box("House_Roof_Fascia", (house_x, house_y, roof_z), (house_w + 0.3, house_d + 0.3, 0.20), pal["dark_fascia"], coll_house)
    create_box("House_Roof_Top", (house_x, house_y, roof_z + 0.11), (house_w + 0.28, house_d + 0.28, 0.04), pal["dark_roof"], coll_house)

    # Большие стеклянные двери на фасад
    facade_w, facade_h = 5.8, 2.6
    facade_y = house_y - house_d/2.0
    create_glass_facade("House_South_Glazing", (house_x - 0.3, facade_y, 0.2 + facade_h/2.0), facade_w, facade_h, cols=4, rows=1, frame_mat=pal["black_frames"], glass_mat=pal["clear_glass"], collection=coll_house)

    # Внутренний интерьер виллы
    create_box("House_Floor_Wood", (house_x, house_y, 0.22), (house_w - 0.4, house_d - 0.4, 0.04), pal["interior_wood"], coll_house)
    create_box("House_Kitchen_Island", (house_x - 0.6, house_y + 0.5, 0.7), (2.4, 1.0, 0.9), pal["interior_white"], coll_house)
    create_box("House_Kitchen_Top", (house_x - 0.6, house_y + 0.5, 1.16), (2.5, 1.1, 0.06), pal["dark_fascia"], coll_house)
    create_box("House_Curtain_L", (house_x - 0.3 - facade_w/2 + 0.25, facade_y + 0.15, 0.2 + facade_h/2.0), (0.45, 0.1, facade_h - 0.1), pal["curtain_white"], coll_house)
    create_box("House_Curtain_R", (house_x - 0.3 + facade_w/2 - 0.25, facade_y + 0.15, 0.2 + facade_h/2.0), (0.45, 0.1, facade_h - 0.1), pal["curtain_white"], coll_house)

    # Бежевый деревянный настил перед домом
    terrace_w, terrace_d, terrace_h = 5.8, 1.8, 0.28
    terrace_y = facade_y - terrace_d/2.0
    create_box("House_Front_Deck", (house_x - 0.3, terrace_y, terrace_h/2.0 + 0.06), (terrace_w, terrace_d, terrace_h), pal["beige_deck"], coll_house)
    create_box("House_Deck_Step", (house_x - 0.3, terrace_y - terrace_d/2.0 - 0.15, 0.1), (terrace_w + 0.2, 0.35, 0.14), pal["dark_fascia"], coll_house)

    # =========================================================================
    # 3.3. ТЕХНИЧЕСКИЙ ДВОРИК СПРАВА ОТ ДОМА
    # =========================================================================
    yard_x = house_x + house_w/2.0 + 1.8
    yard_y = house_y
    yard_w, yard_d, yard_h = 3.2, 5.8, 2.2

    create_box("Yard_Wall_E", (yard_x + yard_w/2.0 - 0.1, yard_y, yard_h/2.0), (0.2, yard_d, yard_h), pal["concrete_wall"], coll_house)
    create_box("Yard_Wall_N", (yard_x, yard_y + yard_d/2.0 - 0.1, yard_h/2.0), (yard_w, 0.2, yard_h), pal["concrete_wall"], coll_house)
    create_box("Yard_Wall_S", (yard_x, yard_y - yard_d/2.0 + 0.1, 0.9), (yard_w, 0.2, 1.8), pal["concrete_wall"], coll_house)
    create_box("Yard_Floor", (yard_x, yard_y, 0.05), (yard_w, yard_d, 0.08), pal["paving_tile_dark"], coll_house)

    create_slatted_wall("Yard_Timber_Screen", (yard_x - 0.3, yard_y - yard_d/2.0 + 0.22, 1.0), 2.2, 1.8, depth=0.04, slat_w=0.05, slat_gap=0.02, material=pal["teak_slats"], collection=coll_house, vertical=True)

    for p_idx, p_x in enumerate([yard_x - 0.9, yard_x + 0.2]):
        create_box(f"Yard_Planter_{p_idx}", (p_x, yard_y - yard_d/2.0 - 0.3, 0.28), (0.6, 0.5, 0.5), pal["wood_planter"], coll_house)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.25, location=(p_x, yard_y - yard_d/2.0 - 0.3, 0.65), segments=16, ring_count=12)
        p_bush = bpy.context.active_object
        p_bush.name = f"Yard_Planter_Plant_{p_idx}"
        set_smooth_shading(p_bush)
        p_bush.data.materials.append(pal["bush_green"])
        link_to_collection(p_bush, coll_house)

    create_cylinder("Yard_Water_Heater_Tank", (yard_x + 0.5, yard_y + 1.2, 1.0), radius=0.35, depth=1.6, material=pal["metal_hvac"], collection=coll_house)
    create_box("Yard_HVAC_Unit", (yard_x - 0.6, yard_y + 1.4, 0.5), (0.8, 0.6, 0.9), pal["metal_hvac"], coll_house)
    create_box("Yard_Utility_Cabinet", (yard_x + 0.4, yard_y - 1.0, 0.8), (0.7, 1.2, 1.5), pal["dark_utility_box"], coll_house)

    # =========================================================================
    # 3.4. ДВОЙНОЙ ГАРАЖ С БЕЛЫМИ ВОРОТАМИ (Слева вверху)
    # =========================================================================
    gar_x, gar_y = -1.8, 7.5
    gar_w, gar_d, gar_h = 5.8, 5.6, 3.2

    create_box("Garage_Foundation", (gar_x, gar_y, 0.1), (gar_w + 0.2, gar_d + 0.2, 0.2), pal["concrete_wall"], coll_garage)
    create_box("Garage_Walls", (gar_x, gar_y, gar_h/2.0 + 0.15), (gar_w, gar_d, gar_h), pal["white_stucco"], coll_garage)

    # Плоская крыша гаража
    create_box("Garage_Roof_Fascia", (gar_x, gar_y, gar_h + 0.25), (gar_w + 0.3, gar_d + 0.3, 0.20), pal["dark_fascia"], coll_garage)
    create_box("Garage_Roof_Deck", (gar_x, gar_y, gar_h + 0.35), (gar_w + 0.28, gar_d + 0.28, 0.04), pal["dark_roof"], coll_garage)

    # Белые ворота гаража
    door_w, door_h = 2.1, 2.3
    door_y = gar_y - gar_d/2.0 - 0.02
    for d_idx, dx in enumerate([-1.35, 1.35]):
        create_box(f"Garage_Gate_Frame_{d_idx}", (gar_x + dx, door_y, door_h/2.0 + 0.15), (door_w + 0.1, 0.06, door_h + 0.1), pal["dark_fascia"], coll_garage)
        create_box(f"Garage_Gate_Panel_{d_idx}", (gar_x + dx, door_y - 0.02, door_h/2.0 + 0.15), (door_w, 0.04, door_h), pal["garage_door_white"], coll_garage)
        for stripe_i in range(5):
            create_box(f"Garage_Stripe_{d_idx}_{stripe_i}", (gar_x + dx, door_y - 0.045, 0.35 + stripe_i * 0.45), (door_w - 0.06, 0.02, 0.03), pal["dark_fascia"], coll_garage)

    create_box("Garage_Red_Accent_V1", (gar_x + gar_w/2.0 + 0.02, gar_y - 1.2, 1.6), (0.04, 0.08, 2.2), pal["red_accent_frame"], coll_garage)
    create_box("Garage_Red_Accent_V2", (gar_x + gar_w/2.0 + 0.02, gar_y + 1.2, 1.6), (0.04, 0.08, 2.2), pal["red_accent_frame"], coll_garage)
    create_box("Garage_Red_Accent_H1", (gar_x + gar_w/2.0 + 0.02, gar_y, 2.6), (0.04, 2.4, 0.08), pal["red_accent_frame"], coll_garage)
    create_box("Garage_Red_Accent_H2", (gar_x + gar_w/2.0 + 0.02, gar_y, 0.6), (0.04, 2.4, 0.08), pal["red_accent_frame"], coll_garage)
    create_box("Garage_Red_Accent_Diag", (gar_x + gar_w/2.0 + 0.02, gar_y, 1.6), (0.03, 2.6, 0.06), pal["red_accent_frame"], coll_garage)

    # =========================================================================
    # 3.5. СТЕКЛЯННЫЙ ПАВИЛЬОН С ПЕРГОЛОЙ ИЗ СЕРОГО МЕТАЛЛА (Слева)
    # =========================================================================
    pav_x, pav_y = -7.5, 1.8
    pav_w, pav_d, pav_h = 5.2, 5.2, 3.2

    create_box("Pavilion_Base_Plinth", (pav_x, pav_y, 0.1), (pav_w + 0.4, pav_d + 0.4, 0.2), pal["concrete_wall"], coll_pavilion)
    create_box("Pavilion_Interior_Floor", (pav_x, pav_y, 0.22), (pav_w - 0.2, pav_d - 0.2, 0.04), pal["interior_wood"], coll_pavilion)

    create_box("Pavilion_Back_Wall", (pav_x, pav_y + pav_d/2.0 - 0.1, pav_h/2.0 + 0.2), (pav_w, 0.2, pav_h), pal["white_stucco"], coll_pavilion)
    create_box("Pavilion_Corner_Wall", (pav_x - pav_w/2.0 + 0.1, pav_y + pav_d/2.0 - 0.8, pav_h/2.0 + 0.2), (0.2, 1.6, pav_h), pal["white_stucco"], coll_pavilion)

    create_glass_facade("Pavilion_South_Glass", (pav_x, pav_y - pav_d/2.0 + 0.02, pav_h/2.0 + 0.2), pav_w, pav_h, cols=3, rows=1, frame_mat=pal["black_frames"], glass_mat=pal["clear_glass"], collection=coll_pavilion)
    create_glass_facade("Pavilion_East_Glass", (pav_x + pav_w/2.0 - 0.02, pav_y, pav_h/2.0 + 0.2), pav_d, pav_h, cols=3, rows=1, frame_mat=pal["black_frames"], glass_mat=pal["clear_glass"], collection=coll_pavilion)

    # Плоская темно-серая кровля павильона
    create_box("Pavilion_Roof_Fascia", (pav_x, pav_y, pav_h + 0.28), (pav_w + 0.3, pav_d + 0.3, 0.20), pal["dark_fascia"], coll_pavilion)
    create_box("Pavilion_Roof_Deck", (pav_x, pav_y, pav_h + 0.38), (pav_w + 0.28, pav_d + 0.28, 0.04), pal["dark_roof"], coll_pavilion)

    # Пергола из серого металла перед павильоном
    perg_x = pav_x + pav_w/2.0 + 0.8
    perg_y = pav_y - pav_d/2.0 + 0.4
    create_box("Pavilion_Pergola_Beam_1", (perg_x, perg_y, pav_h + 0.15), (0.08, 2.2, 0.12), pal["pergola_metal"], coll_pavilion)
    create_box("Pavilion_Pergola_Beam_2", (perg_x + 1.2, perg_y, pav_h + 0.15), (0.08, 2.2, 0.12), pal["pergola_metal"], coll_pavilion)
    create_cylinder("Pavilion_Pergola_Post", (perg_x + 1.2, perg_y - 1.0, (pav_h + 0.15)/2), radius=0.06, depth=pav_h + 0.15, material=pal["pergola_metal"], collection=coll_pavilion)

    # Интерьер павильона
    create_box("Pavilion_Sofa_Back", (pav_x - 1.2, pav_y + 1.2, 0.7), (2.2, 0.6, 0.7), pal["sofa_fabric"], coll_pavilion)
    create_box("Pavilion_Sofa_Seat", (pav_x - 1.2, pav_y + 0.7, 0.45), (2.2, 0.8, 0.4), pal["sofa_fabric"], coll_pavilion)
    create_box("Pavilion_Armchair", (pav_x + 0.6, pav_y + 0.7, 0.45), (0.9, 0.8, 0.4), pal["sofa_fabric"], coll_pavilion)
    create_box("Pavilion_Coffee_Table", (pav_x - 0.4, pav_y - 0.3, 0.32), (1.2, 0.7, 0.25), pal["interior_wood"], coll_pavilion)

    # Ступенька у павильона
    create_box("Pavilion_Steps_Front", (pav_x, pav_y - pav_d/2.0 - 0.4, 0.06), (2.5, 0.5, 0.12), pal["paving_tile_light"], coll_pavilion)

    # =========================================================================
    # 3.6. ПРЯМОУГОЛЬНЫЙ БАССЕЙН С БЕЖЕВЫМ КАМЕННЫМ НАСТИЛОМ
    # =========================================================================
    pool_x, pool_y = 2.0, -1.8
    pool_w, pool_d = 8.6, 4.4
    pool_depth = 1.4
    coping_w = 0.55
    coping_h = 0.35

    # Бежевые каменные бортики бассейна
    create_box("Pool_Rim_North", (pool_x, pool_y + pool_d/2.0 + coping_w/2.0, coping_h/2.0 + 0.05), (pool_w + coping_w*2.0, coping_w, coping_h), pal["pool_coping_beige"], coll_pool)
    create_box("Pool_Rim_South", (pool_x, pool_y - pool_d/2.0 - coping_w/2.0, coping_h/2.0 + 0.05), (pool_w + coping_w*2.0, coping_w, coping_h), pal["pool_coping_beige"], coll_pool)
    create_box("Pool_Rim_West", (pool_x - pool_w/2.0 - coping_w/2.0, pool_y, coping_h/2.0 + 0.05), (coping_w, pool_d, coping_h), pal["pool_coping_beige"], coll_pool)
    create_box("Pool_Rim_East", (pool_x + pool_w/2.0 + coping_w/2.0, pool_y, coping_h/2.0 + 0.05), (coping_w, pool_d, coping_h), pal["pool_coping_beige"], coll_pool)

    # Чаша бассейна
    create_box("Pool_Floor", (pool_x, pool_y, -pool_depth + 0.05), (pool_w, pool_d, 0.1), pal["pool_tile_cyan"], coll_pool)
    create_box("Pool_Wall_N", (pool_x, pool_y + pool_d/2.0 - 0.05, -pool_depth/2.0 + 0.1), (pool_w, 0.1, pool_depth), pal["pool_tile_cyan"], coll_pool)
    create_box("Pool_Wall_S", (pool_x, pool_y - pool_d/2.0 + 0.05, -pool_depth/2.0 + 0.1), (pool_w, 0.1, pool_depth), pal["pool_tile_cyan"], coll_pool)
    create_box("Pool_Wall_W", (pool_x - pool_w/2.0 + 0.05, pool_y, -pool_depth/2.0 + 0.1), (0.1, pool_d, pool_depth), pal["pool_tile_cyan"], coll_pool)
    create_box("Pool_Wall_E", (pool_x + pool_w/2.0 - 0.05, pool_y, -pool_depth/2.0 + 0.1), (0.1, pool_d, pool_depth), pal["pool_tile_cyan"], coll_pool)

    # Римские ступени спуска в воду
    for s_i in range(3):
        st_z = -0.32 * (s_i + 1)
        create_box(f"Pool_Step_{s_i}", (pool_x - pool_w/2.0 + 0.45 + s_i * 0.35, pool_y, st_z), (0.4, pool_d * 0.7, 0.25), pal["pool_tile_cyan"], coll_pool)

    # Голубая вода в бассейне
    create_box("Pool_Water_Surface", (pool_x, pool_y, 0.18), (pool_w - 0.02, pool_d - 0.02, 0.02), pal["pool_water"], coll_pool)

    # Бежевый каменный настил справа от бассейна
    deck_x, deck_y = 8.5, -2.4
    deck_w, deck_d = 4.2, 3.8
    create_box("Sunbathing_Beige_Deck", (deck_x, deck_y, 0.04), (deck_w, deck_d, 0.06), pal["beige_deck"], coll_pool)

    # =========================================================================
    # 3.7. КРУГЛЫЙ КАМЕННЫЙ ФОНТАН (Перед павильоном)
    # =========================================================================
    fountain_x, fountain_y = -2.8, 1.6
    create_tiered_fountain("Garden_Fountain", (fountain_x, fountain_y, 0.0), pal=pal, coll=coll_pool)

    # =========================================================================
    # 3.8. ЛАНДШАФТ И ШАРОВИДНЫЕ ДЕРЕВЬЯ
    # =========================================================================
    # Ровный ряд из 4 деревьев перед бассейном
    tree_row_y = -5.5
    tree_xs = [-4.6, -1.8, 1.0, 3.8]
    for idx, tx in enumerate(tree_xs):
        create_fluffy_spherical_tree(f"Tree_Front_Row_{idx}", (tx, tree_row_y, 0.04), radius=0.92, trunk_h=1.1, pal=pal, coll=coll_landscape)

    create_fluffy_spherical_tree("Tree_Right_Garden", (6.8, -4.8, 0.04), radius=1.05, trunk_h=1.2, pal=pal, coll=coll_landscape)
    create_fluffy_spherical_tree("Tree_Left_Corner", (-10.5, 0.8, 0.04), radius=0.95, trunk_h=1.1, pal=pal, coll=coll_landscape)
    create_fluffy_spherical_tree("Tree_Behind_Garage", (-0.8, 11.2, 0.04), radius=1.1, trunk_h=1.3, pal=pal, coll=coll_landscape)
    create_box("Hedge_Behind_Pavilion", (-7.5, 4.8, 0.55), (3.8, 0.6, 1.1), pal["bush_green"], coll_landscape)

    # =========================================================================
    # 3.9. КАМЕРЫ И СТУДИЙНОЕ ИЗОМЕТРИЧЕСКОЕ ОСВЕЩЕНИЕ
    # =========================================================================
    target_pos = mathutils.Vector((0.0, 0.0, 1.5))
    
    # Изометрическая камера
    bpy.ops.object.camera_add(location=(25.0, -25.0, 26.0))
    cam_iso = bpy.context.active_object
    cam_iso.name = "Cam_01_Exact_Isometric"
    cam_iso.data.type = 'ORTHO'
    cam_iso.data.ortho_scale = 32.0
    
    direction = target_pos - cam_iso.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_iso.rotation_euler = rot_quat.to_euler()
    link_to_collection(cam_iso, coll_lighting)
    bpy.context.scene.camera = cam_iso

    # Солнечный свет
    bpy.ops.object.light_add(type='SUN', location=(15.0, 10.0, 30.0), rotation=(math.radians(48), math.radians(15), math.radians(-55)))
    sun = bpy.context.active_object
    sun.name = "Studio_Sun"
    sun.data.energy = 4.8
    sun.data.color = (1.0, 0.97, 0.92)
    sun.data.angle = math.radians(2.0)
    link_to_collection(sun, coll_lighting)

    # Белое студийное окружение
    world = bpy.context.scene.world or bpy.data.worlds.new("Studio_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.95, 0.95, 0.96, 1.0)
        bg.inputs["Strength"].default_value = 0.95

    # Настройки рендера
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.device = 'CPU'
    bpy.context.scene.cycles.samples = 24
    bpy.context.scene.render.resolution_x = 1600
    bpy.context.scene.render.resolution_y = 1000
    bpy.context.scene.render.film_transparent = False

    # Сохранение файлов во все папки проекта
    os.makedirs("public/models", exist_ok=True)
    
    blend_path1 = os.path.abspath("public/models/designer_house_plan.blend")
    blend_path2 = os.path.abspath("public/designer_house_plan.blend")
    blend_path3 = os.path.abspath("designer_house_plan.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path1)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path2)
    bpy.ops.wm.save_as_mainfile(filepath=blend_path3)
    print(f"💾 Файл .blend сохранен во все папки!")

    glb_path1 = os.path.abspath("public/models/designer_house_plan.glb")
    glb_path2 = os.path.abspath("public/designer_house_plan.glb")
    glb_path3 = os.path.abspath("designer_house_plan.glb")
    bpy.ops.export_scene.gltf(filepath=glb_path1, export_format='GLB', use_selection=False)
    bpy.ops.export_scene.gltf(filepath=glb_path2, export_format='GLB', use_selection=False)
    bpy.ops.export_scene.gltf(filepath=glb_path3, export_format='GLB', use_selection=False)
    print(f"📦 GLTF/GLB экспортирован во все папки!")

    print("✅ 3D макет по точному описанию успешно построен!")


if __name__ == "__main__":
    build_exact_reference_estate()
