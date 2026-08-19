"""
Lego Diorama Utilities for Blender Generator (High Performance BMesh)
Builds Lego baseplates with studs and milestone towers in milliseconds as single combined meshes.
"""
import bpy
import bmesh
import math
from mathutils import Matrix

def create_box(name, location, size, material=None, parent=None):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj

def create_cylinder(name, location, radius, depth, rotation=(0, 0, 0), material=None, parent=None, vertices=16):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=location, rotation=rotation, vertices=vertices)
    obj = bpy.context.active_object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent
    return obj

def create_lego_baseplate(name, center_x, center_y, width, length, height=0.4, material=None, parent=None, stud_step=4.0):
    """Creates a Lego baseplate with a grid of cylindrical studs as a single optimized mesh."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm = bmesh.new()

    # Add base slab
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.LocRotScale((0, 0, height/2), None, (width, length, height)))

    # Add studs
    nx = max(2, int(width / stud_step))
    ny = max(2, int(length / stud_step))
    stud_r = stud_step * 0.28
    stud_h = height * 0.65

    for ix in range(nx):
        sx = -width/2 + (ix + 0.5) * (width / nx)
        for iy in range(ny):
            sy = -length/2 + (iy + 0.5) * (length / ny)
            bmesh.ops.create_cone(
                bm,
                cap_ends=True,
                cap_tris=False,
                segments=12,
                radius1=stud_r,
                radius2=stud_r,
                depth=stud_h,
                matrix=Matrix.Translation((sx, sy, height + stud_h/2))
            )

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = (center_x, center_y, 0)
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent

    bpy.context.scene.collection.objects.link(obj)
    return obj

def create_lego_brick_tower(name, location, width, length, height, num_studs_x=2, num_studs_y=2, material=None, parent=None):
    """Creates a Lego brick or stack of bricks with top studs as a single optimized mesh."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm = bmesh.new()

    # Main brick body
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.LocRotScale((0, 0, height/2), None, (width, length, height)))

    # Top studs
    stud_h = 0.6
    stud_r = min(width/num_studs_x, length/num_studs_y) * 0.28
    for ix in range(num_studs_x):
        sx = -width/2 + (ix + 0.5) * (width / num_studs_x)
        for iy in range(num_studs_y):
            sy = -length/2 + (iy + 0.5) * (length / num_studs_y)
            bmesh.ops.create_cone(
                bm,
                cap_ends=True,
                cap_tris=False,
                segments=12,
                radius1=stud_r,
                radius2=stud_r,
                depth=stud_h,
                matrix=Matrix.Translation((sx, sy, height + stud_h/2))
            )

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent

    bpy.context.scene.collection.objects.link(obj)
    return obj

def create_detailed_byd_car(name, location, rotation_z=0.0, color_mat=None, mats=None, parent=None):
    """
    Creates a realistic aerodynamic BYD electric sedan with sculpted body,
    slanted hood, panoramic glass cabin, 4 rubber tires with silver alloy rims,
    LED headlights, and full-width rear light bar.
    """
    car_root = bpy.data.objects.new(f"{name}_Root", None)
    car_root.location = location
    car_root.rotation_euler = (0, 0, rotation_z)
    if parent:
        car_root.parent = parent
    bpy.context.scene.collection.objects.link(car_root)

    body_mat = color_mat or mats["factory_blue"]
    dark_mat = mats["steel_dark"]
    glass_mat = mats["glass_window"]
    rim_mat = mats["pipe_joint_silver"]
    headlight_mat = mats["sign_blue"]
    taillight_mat = mats["lego_red_brick"]

    # 1. Нижнее шасси и аэродинамический диффузор
    create_box(f"{name}_Chassis", (0, 0, 0.4), (4.8, 2.0, 0.4), dark_mat, car_root)

    # 2. Основной кузов (аэродинамический профиль)
    create_box(f"{name}_Body_Main", (0, 0, 0.8), (4.6, 2.1, 0.5), body_mat, car_root)
    # Наклонный капот спереди (X = +1.6)
    create_box(f"{name}_Hood_Slope", (1.6, 0, 0.75), (1.4, 1.9, 0.35), body_mat, car_root)
    # Задний спойлер/багажник (X = -1.6)
    create_box(f"{name}_Trunk_Deck", (-1.6, 0, 0.85), (1.2, 1.9, 0.35), body_mat, car_root)

    # 3. Кабина с панорамным остеклением
    create_box(f"{name}_Cabin_Glass", (-0.1, 0, 1.35), (2.4, 1.7, 0.7), glass_mat, car_root)
    create_box(f"{name}_Roof_Top", (-0.1, 0, 1.72), (2.2, 1.6, 0.08), body_mat, car_root)

    # Боковые зеркала
    create_box(f"{name}_Mirror_L", (0.8, 1.05, 1.2), (0.25, 0.3, 0.15), body_mat, car_root)
    create_box(f"{name}_Mirror_R", (0.8, -1.05, 1.2), (0.25, 0.3, 0.15), body_mat, car_root)

    # 4. Светотехника
    # Передние LED фары (X = +2.3)
    create_box(f"{name}_Headlight_L", (2.3, 0.65, 0.8), (0.1, 0.45, 0.18), headlight_mat, car_root)
    create_box(f"{name}_Headlight_R", (2.3, -0.65, 0.8), (0.1, 0.45, 0.18), headlight_mat, car_root)
    # Задняя монобровь LED (X = -2.3)
    create_box(f"{name}_Taillight_Bar", (-2.3, 0, 0.9), (0.1, 1.8, 0.14), taillight_mat, car_root)

    # 5. 4 Реалистичных колеса с легкосплавными дисками (R=0.42)
    wheel_coords = [
        ("FL", 1.4, 1.05),
        ("FR", 1.4, -1.05),
        ("RL", -1.4, 1.05),
        ("RR", -1.4, -1.05)
    ]
    for w_name, wx, wy in wheel_coords:
        # Резиновая шина
        create_cylinder(f"{name}_Tire_{w_name}", (wx, wy, 0.42), radius=0.42, depth=0.35, rotation=(math.pi/2, 0, 0), material=dark_mat, parent=car_root)
        # Серебристый литой диск
        create_cylinder(f"{name}_Rim_{w_name}", (wx, wy + (0.02 if wy > 0 else -0.02), 0.42), radius=0.30, depth=0.36, rotation=(math.pi/2, 0, 0), material=rim_mat, parent=car_root)

    return car_root

def create_cnc_stamping_machine(name, location, mats, parent=None):
    """Lego-style heavy hydraulic stamping press with pistons, die, control panel and Lego studs."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    # 1. Base frame & bed
    create_box(f"{name}_Base", (0, 0, 0.6), (4.5, 4.0, 1.2), mats["gantry_yellow"], root)
    create_box(f"{name}_Bed_Plate", (0, 0, 1.3), (3.8, 3.2, 0.2), mats["steel_dark"], root)
    # Stamped metal door panel on the bed
    create_box(f"{name}_Metal_Part", (0, 0, 1.45), (2.2, 1.6, 0.1), mats["lego_red_brick"], root)

    # 2. Heavy side support pillars with Lego studs
    create_box(f"{name}_Pillar_L", (-1.8, 0, 3.2), (0.9, 3.8, 4.0), mats["gantry_yellow"], root)
    create_box(f"{name}_Pillar_R", (1.8, 0, 3.2), (0.9, 3.8, 4.0), mats["gantry_yellow"], root)
    create_box(f"{name}_Crown_Beam", (0, 0, 5.5), (4.6, 4.0, 1.0), mats["gantry_yellow"], root)

    # 3. Dual hydraulic chrome pistons & Press Die Head
    create_cylinder(f"{name}_Piston_L", (-0.9, 0, 4.4), radius=0.25, depth=1.8, material=mats["pipe_joint_silver"], parent=root)
    create_cylinder(f"{name}_Piston_R", (0.9, 0, 4.4), radius=0.25, depth=1.8, material=mats["pipe_joint_silver"], parent=root)
    create_box(f"{name}_Press_Die", (0, 0, 3.2), (2.8, 2.6, 0.8), mats["steel_dark"], root)

    # 4. Operator CNC terminal (Lego style console with green display and red button)
    create_box(f"{name}_Console_Arm", (2.4, 1.4, 2.2), (0.2, 0.8, 1.6), mats["steel_dark"], root)
    create_box(f"{name}_Console_Box", (2.4, 1.4, 3.0), (0.8, 1.0, 0.8), mats["white_wall"], root)
    create_box(f"{name}_Screen", (2.45, 1.4, 3.0), (0.1, 0.7, 0.5), mats["sign_blue"], root)
    create_cylinder(f"{name}_EStop_Button", (2.4, 1.0, 3.5), radius=0.12, depth=0.15, material=mats["lego_red_brick"], parent=root)

    return root

def create_blade_battery_bench(name, location, mats, parent=None):
    """Lego-style Blade Battery pack assembly station with diagnostic tester."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    # Table workbench
    create_box(f"{name}_Table_Top", (0, 0, 1.1), (5.0, 2.6, 0.2), mats["white_wall"], root)
    create_box(f"{name}_Leg_1", (-2.2, -1.1, 0.5), (0.3, 0.3, 1.0), mats["steel_dark"], root)
    create_box(f"{name}_Leg_2", (2.2, -1.1, 0.5), (0.3, 0.3, 1.0), mats["steel_dark"], root)
    create_box(f"{name}_Leg_3", (-2.2, 1.1, 0.5), (0.3, 0.3, 1.0), mats["steel_dark"], root)
    create_box(f"{name}_Leg_4", (2.2, 1.1, 0.5), (0.3, 0.3, 1.0), mats["steel_dark"], root)

    # Blade Battery Pack (Aluminium casing with individual cell lines)
    create_box(f"{name}_Battery_Tray", (0, 0, 1.3), (3.6, 1.8, 0.25), mats["steel_dark"], root)
    for bi in range(8):
        bx = -1.4 + bi * 0.4
        create_box(f"{name}_Cell_{bi}", (bx, 0, 1.48), (0.28, 1.6, 0.18), mats["canopy_blue"], root)

    # Overhead laser testing probe
    create_box(f"{name}_Probe_Gantry", (0, -0.9, 2.2), (4.2, 0.2, 2.0), mats["gantry_yellow"], root)
    create_cylinder(f"{name}_Laser_Head", (0, 0, 2.0), radius=0.2, depth=0.6, material=mats["sign_blue"], parent=root)

    return root

def create_laser_inspection_tunnel(name, location, mats, parent=None):
    """Quality Control inspection arch with laser scanners."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    # Yellow Inspection Arch
    create_box(f"{name}_Arch_L", (-3.2, 0, 2.4), (0.6, 1.6, 4.8), mats["gantry_yellow"], root)
    create_box(f"{name}_Arch_R", (3.2, 0, 2.4), (0.6, 1.6, 4.8), mats["gantry_yellow"], root)
    create_box(f"{name}_Arch_Top", (0, 0, 4.8), (7.0, 1.6, 0.6), mats["gantry_yellow"], root)

    # Laser scanner heads pointing inward
    create_box(f"{name}_Scanner_Top", (0, 0, 4.4), (1.4, 0.6, 0.3), mats["sign_blue"], root)
    create_box(f"{name}_Scanner_L", (-2.8, 0, 2.5), (0.3, 0.6, 1.2), mats["sign_blue"], root)
    create_box(f"{name}_Scanner_R", (2.8, 0, 2.5), (0.3, 0.6, 1.2), mats["sign_blue"], root)

    return root

def create_agv_transport_robot(name, location, mats, parent=None):
    """Autonomous mobile logistics cart carrying Lego part boxes."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    # Low chassis
    create_box(f"{name}_Chassis", (0, 0, 0.35), (2.2, 1.4, 0.4), mats["road_stripe_yellow"], root)
    # Flashing beacon
    create_cylinder(f"{name}_Beacon", (0.8, 0.5, 0.65), radius=0.12, depth=0.25, material=mats["lego_red_brick"], parent=root)
    # Cargo box on top
    create_box(f"{name}_Cargo_Box", (-0.2, 0, 0.8), (1.4, 1.1, 0.6), mats["factory_blue"], root)

    return root

def create_tire_service_changer(name, location, mats, parent=None):
    """Lego tire mounting and balancing machine."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    create_box(f"{name}_Cabinet", (0, 0, 0.9), (1.4, 1.4, 1.8), mats["lego_red_brick"], root)
    create_cylinder(f"{name}_Turntable", (0, 0, 1.85), radius=0.6, depth=0.15, material=mats["steel_dark"], parent=root)
    create_box(f"{name}_Mount_Arm", (-0.5, 0, 2.4), (0.2, 0.2, 1.2), mats["steel_dark"], root)
    create_box(f"{name}_Tool_Claw", (-0.2, 0, 2.9), (0.6, 0.2, 0.2), mats["pipe_joint_silver"], parent=root)

    return root

def create_quantum_server_rack(name, location, mats, parent=None):
    """Tall high-tech server rack cabinet with glowing blade indicators."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    create_box(f"{name}_Frame", (0, 0, 2.4), (1.4, 1.2, 4.8), mats["steel_dark"], root)
    for bi in range(6):
        create_box(f"{name}_Blade_{bi}", (0, 0.55, 0.8 + bi * 0.65), (1.1, 0.1, 0.45), mats["white_wall"], root)
        create_box(f"{name}_Led_{bi}", (0.35, 0.62, 0.8 + bi * 0.65), (0.2, 0.05, 0.15), mats["sign_blue"], root)

    return root

def create_lego_pine_tree(name, location, height=6.5, mats=None, parent=None):
    """Iconic stepped Lego pine tree made of brown trunk and stacked green cone disks with top stud."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    trunk_mat = mats["soil_brown"]
    leaf_mat = mats["crop_green"]

    # Brown Trunk
    create_cylinder(f"{name}_Trunk", (0, 0, height * 0.2), radius=height * 0.07, depth=height * 0.4, material=trunk_mat, parent=root)

    # 3 Stepped Cones
    tiers = [
        (height * 0.45, height * 0.42, height * 0.35),
        (height * 0.70, height * 0.32, height * 0.30),
        (height * 0.92, height * 0.20, height * 0.25)
    ]
    for idx, (cz, r, depth) in enumerate(tiers):
        create_cylinder(f"{name}_Tier_{idx}", (0, 0, cz), radius=r, depth=depth, material=leaf_mat, parent=root, vertices=12)

    # Top Lego Stud
    create_cylinder(f"{name}_Top_Stud", (0, 0, height + 0.12), radius=height * 0.055, depth=0.25, material=leaf_mat, parent=root, vertices=10)
    return root

def create_lego_street_light(name, location, height=5.5, mats=None, parent=None):
    """Lego streetlight with round baseplate stud, dark pole, bracket, and glowing trans-blue stud."""
    root = bpy.data.objects.new(name, None)
    root.location = location
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    pole_mat = mats["steel_dark"]
    light_mat = mats["sign_blue"]

    # Base stud
    create_cylinder(f"{name}_Base", (0, 0, 0.2), radius=0.55, depth=0.4, material=pole_mat, parent=root)
    # Vertical Pole
    create_cylinder(f"{name}_Pole", (0, 0, height * 0.5), radius=0.16, depth=height, material=pole_mat, parent=root)
    # Horizontal Overhang Arm
    create_box(f"{name}_Arm", (0.7, 0, height), (1.4, 0.25, 0.25), pole_mat, root)
    # Luminous Lamp Stud
    create_cylinder(f"{name}_Lamp", (1.3, 0, height - 0.25), radius=0.32, depth=0.25, material=light_mat, parent=root)
    return root

def create_lego_stud_roof(name, location, width, length, height=0.35, stud_step=3.0, material=None, parent=None):
    """Creates a Lego roof plate with a matrix of raised Lego studs."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    bm = bmesh.new()

    # Plate base
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.LocRotScale((0, 0, height/2), None, (width, length, height)))

    # Grid of studs
    nx = max(1, int(width / stud_step))
    ny = max(1, int(length / stud_step))
    stud_r = stud_step * 0.26
    stud_h = 0.35

    for ix in range(nx):
        sx = -width/2 + (ix + 0.5) * (width / nx)
        for iy in range(ny):
            sy = -length/2 + (iy + 0.5) * (length / ny)
            bmesh.ops.create_cone(
                bm,
                cap_ends=True,
                cap_tris=False,
                segments=12,
                radius1=stud_r,
                radius2=stud_r,
                depth=stud_h,
                matrix=Matrix.Translation((sx, sy, height + stud_h/2))
            )

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    if material:
        obj.data.materials.append(material)
    if parent:
        obj.parent = parent

    bpy.context.scene.collection.objects.link(obj)
    return obj

def create_lego_minifigure(name, location, rotation_z=0.0, shirt_mat=None, pants_mat=None, mats=None, parent=None, is_walking=False):
    """
    Creates an authentic Lego Minifigure with head stud, trapezoid torso,
    arms, C-hands, and dual legs.
    """
    root = bpy.data.objects.new(f"{name}_Root", None)
    root.location = location
    root.rotation_euler = (0, 0, rotation_z)
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    head_mat = mats["minifig_yellow"]
    body_mat = shirt_mat or mats["uniform_orange"]
    legs_mat = pants_mat or mats["factory_blue"]
    dark_mat = mats["steel_dark"]

    # 1. Legs & Hips (Z: 0 to 1.1)
    leg_rot_l = 0.35 if is_walking else 0.0
    leg_rot_r = -0.35 if is_walking else 0.0
    create_box(f"{name}_Hips", (0, 0, 1.0), (0.75, 0.45, 0.2), legs_mat, root)
    create_box(f"{name}_Leg_L", (-0.18, 0, 0.5), (0.32, 0.42, 0.9), legs_mat, root)
    create_box(f"{name}_Leg_R", (0.18, 0, 0.5), (0.32, 0.42, 0.9), legs_mat, root)

    # 2. Torso (Z: 1.1 to 1.9)
    create_box(f"{name}_Torso", (0, 0, 1.5), (0.78, 0.45, 0.8), body_mat, root)

    # 3. Arms & C-Hands
    create_box(f"{name}_Arm_L", (-0.48, 0, 1.5), (0.18, 0.3, 0.65), body_mat, root)
    create_box(f"{name}_Arm_R", (0.48, 0, 1.5), (0.18, 0.3, 0.65), body_mat, root)
    create_cylinder(f"{name}_Hand_L", (-0.48, 0.1, 1.1), radius=0.1, depth=0.18, material=head_mat, parent=root)
    create_cylinder(f"{name}_Hand_R", (0.48, 0.1, 1.1), radius=0.1, depth=0.18, material=head_mat, parent=root)

    # 4. Head & Top Stud (Z: 1.9 to 2.5)
    create_cylinder(f"{name}_Head", (0, 0, 2.15), radius=0.26, depth=0.45, material=head_mat, parent=root)
    create_cylinder(f"{name}_Head_Stud", (0, 0, 2.45), radius=0.15, depth=0.16, material=head_mat, parent=root)

    # Cap / Hat (Optional style)
    create_cylinder(f"{name}_Cap", (0, 0.05, 2.48), radius=0.29, depth=0.14, material=body_mat, parent=root)
    create_box(f"{name}_Cap_Visor", (0, 0.28, 2.45), (0.42, 0.25, 0.06), body_mat, root)
    return root

def create_lego_car_hauler_truck(name, location, rotation_z=0.0, mats=None, parent=None, loaded_cars=2):
    """
    Creates a heavy-duty Lego Car Carrier / Hauler Truck (Фура-автовоз)
    with tractor cabin, double-decker open truss steel ramp, and loaded BYD cars!
    """
    root = bpy.data.objects.new(f"{name}_Root", None)
    root.location = location
    root.rotation_euler = (0, 0, rotation_z)
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    truck_cab_mat = mats["lego_red_brick"]
    truss_mat = mats["gantry_yellow"]
    steel_mat = mats["steel_dark"]
    glass_mat = mats["glass_window"]

    # 1. ТЯГАЧ (Tractor Cab)
    # Шасси тягача
    create_box(f"{name}_Cab_Chassis", (8.0, 0, 0.6), (5.5, 2.5, 0.5), steel_mat, root)
    # Кабина водителя
    create_box(f"{name}_Cab_Body", (8.8, 0, 2.2), (3.6, 2.4, 2.6), truck_cab_mat, root)
    create_box(f"{name}_Cab_Windshield", (10.2, 0, 2.6), (0.4, 2.2, 1.2), glass_mat, root)
    create_box(f"{name}_Cab_Grille", (10.6, 0, 1.4), (0.2, 2.0, 0.9), steel_mat, root)
    create_box(f"{name}_Cab_Bumper", (10.6, 0, 0.6), (0.3, 2.6, 0.5), truck_cab_mat, root)
    # Выхлопные трубы
    create_cylinder(f"{name}_Exhaust_L", (7.0, 1.15, 3.2), radius=0.15, depth=3.2, material=steel_mat, parent=root)
    create_cylinder(f"{name}_Exhaust_R", (7.0, -1.15, 3.2), radius=0.15, depth=3.2, material=steel_mat, parent=root)
    # Колеса тягача (3 пары)
    for wx, wid in [(10.0, "F"), (6.8, "M"), (5.3, "R")]:
        create_cylinder(f"{name}_Cab_Wheel_L_{wid}", (wx, 1.3, 0.55), radius=0.55, depth=0.45, rotation=(math.pi/2, 0, 0), material=steel_mat, parent=root)
        create_cylinder(f"{name}_Cab_Wheel_R_{wid}", (wx, -1.3, 0.55), radius=0.55, depth=0.45, rotation=(math.pi/2, 0, 0), material=steel_mat, parent=root)

    # 2. ДВУХЭТАЖНЫЙ ПРИЦЕП-АВТОВОЗ (Double-Decker Trailer)
    # Нижняя палуба
    create_box(f"{name}_Trailer_Lower_Deck", (-2.0, 0, 1.0), (14.5, 2.6, 0.35), truss_mat, root)
    # Верхняя наклонная палуба
    create_box(f"{name}_Trailer_Upper_Deck", (-2.0, 0, 3.5), (14.5, 2.6, 0.35), truss_mat, root)
    # Фермы и стойки жесткости
    for fx in [-8.5, -4.5, -0.5, 3.5]:
        create_box(f"{name}_Truss_L_{fx}", (fx, 1.25, 2.25), (0.35, 0.2, 2.5), truss_mat, root)
        create_box(f"{name}_Truss_R_{fx}", (fx, -1.25, 2.25), (0.35, 0.2, 2.5), truss_mat, root)
    # Задний погрузочный пандус
    create_box(f"{name}_Rear_Ramp", (-10.2, 0, 0.5), (2.4, 2.4, 0.18), steel_mat, root)
    # Колеса прицепа (2 спаренные оси)
    for tx in [-6.5, -4.8]:
        create_cylinder(f"{name}_Tr_Wheel_L_{tx}", (tx, 1.3, 0.55), radius=0.55, depth=0.45, rotation=(math.pi/2, 0, 0), material=steel_mat, parent=root)
        create_cylinder(f"{name}_Tr_Wheel_R_{tx}", (tx, -1.3, 0.55), radius=0.55, depth=0.45, rotation=(math.pi/2, 0, 0), material=steel_mat, parent=root)

    # 3. ПОГРУЖЕННЫЕ АВТОМОБИЛИ BYD НА АВТОВОЗЕ
    if loaded_cars >= 1:
        # Верхний ярус (спереди)
        create_detailed_byd_car(f"{name}_BYD_Upper_Front", (1.2, 0, 3.7), rotation_z=0, color_mat=mats["factory_blue"], mats=mats, parent=root)
    if loaded_cars >= 2:
        # Верхний ярус (сзади)
        create_detailed_byd_car(f"{name}_BYD_Upper_Rear", (-5.0, 0, 3.7), rotation_z=0, color_mat=mats["lego_red_brick"], mats=mats, parent=root)
    if loaded_cars >= 3:
        # Нижний ярус
        create_detailed_byd_car(f"{name}_BYD_Lower", (-3.5, 0, 1.2), rotation_z=0, color_mat=mats["canopy_blue"], mats=mats, parent=root)

    return root

def create_lego_quadcopter_drone(name, location, rotation=(0, 0, 0), mats=None, parent=None, has_cargo=True):
    """
    Creates a high-tech Delivery Quadcopter Drone with fuselage, 4 rotor arms,
    spinning propellers, navigation LED beacons, and an underslung cargo container.
    """
    root = bpy.data.objects.new(f"{name}_Root", None)
    root.location = location
    root.rotation_euler = rotation
    if parent: root.parent = parent
    bpy.context.scene.collection.objects.link(root)

    body_mat = mats["drone_body_white"]
    arm_mat = mats["steel_dark"]
    rotor_mat = mats["sign_blue"]
    cargo_mat = mats["uniform_orange"]
    led_mat = mats["neon_cyan"]

    # 1. Центральный аэродинамический корпус
    create_box(f"{name}_Fuselage", (0, 0, 0), (1.4, 1.4, 0.5), body_mat, root)
    create_cylinder(f"{name}_Top_Dome", (0, 0, 0.3), radius=0.45, depth=0.25, material=led_mat, parent=root)

    # 2. 4 Луча и роторные моторы
    offsets = [(0.9, 0.9), (-0.9, 0.9), (-0.9, -0.9), (0.9, -0.9)]
    for idx, (ox, oy) in enumerate(offsets):
        # Луч X-рамы
        create_box(f"{name}_Arm_{idx}", (ox * 0.5, oy * 0.5, 0), (1.1, 0.18, 0.18), arm_mat, root)
        # Мотор ротора
        create_cylinder(f"{name}_Motor_{idx}", (ox, oy, 0.15), radius=0.25, depth=0.35, material=arm_mat, parent=root)
        # 3-лопастной пропеллер (Lego-пропеллер)
        create_cylinder(f"{name}_Prop_{idx}", (ox, oy, 0.35), radius=0.7, depth=0.06, material=rotor_mat, parent=root, vertices=6)

    # 3. Посадочные полозья
    create_box(f"{name}_Skid_L", (0, 0.6, -0.45), (1.6, 0.12, 0.4), arm_mat, root)
    create_box(f"{name}_Skid_R", (0, -0.6, -0.45), (1.6, 0.12, 0.4), arm_mat, root)

    # 4. Подвесной грузовой контейнер
    if has_cargo:
        create_box(f"{name}_Cargo_Box", (0, 0, -0.4), (0.9, 0.9, 0.65), cargo_mat, root)
        create_box(f"{name}_Cargo_Logo", (0, 0.46, -0.4), (0.5, 0.05, 0.35), mats["white_wall"], root)

    return root



