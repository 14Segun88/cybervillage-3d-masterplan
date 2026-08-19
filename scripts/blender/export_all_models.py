"""
Blender Master Exporter: Compiles all sectors into optimized GLB models & creates Master .blend file.
"""
import bpy
import math
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
MODELS_DIR = os.path.join(PROJECT_ROOT, "public", "models")
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")

sys.path.append(SCRIPT_DIR)
from build_energy_agro import build_energy_agro_sector
from build_dom_taxi_hub import build_dom_taxi_hub_sector
from build_skd_factory import build_skd_factory_sector
from build_tech_center import build_tech_center_sector
from build_drone_port import build_drone_port_sector

def clear_all():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    # Remove all existing objects
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat, do_unlink=True)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

def export_glb(filepath):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    print(f"[Blender Exporter] Exporting GLB to {filepath}...")
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        export_apply=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False
    )
    print(f"[Blender Exporter] ✅ Exported: {filepath} ({os.path.getsize(filepath):,} bytes)")

def build_and_export_individual_assets():
    # 1. Energy & Agro Complex
    clear_all()
    build_energy_agro_sector()
    export_glb(os.path.join(MODELS_DIR, "agro_power_complex.glb"))

    # 2. Dom Taxi & Vityaz Hub
    clear_all()
    build_dom_taxi_hub_sector()
    export_glb(os.path.join(MODELS_DIR, "vityaz_taxi_hub.glb"))

    # 3. SKD BYD Factory Complex
    clear_all()
    build_skd_factory_sector()
    export_glb(os.path.join(MODELS_DIR, "skd_factory_complex.glb"))

    # 4. Tech Center Skyscraper
    clear_all()
    build_tech_center_sector()
    export_glb(os.path.join(MODELS_DIR, "tech_skyscraper.glb"))

    # 5. Autonomous Drone Port
    clear_all()
    build_drone_port_sector()
    export_glb(os.path.join(MODELS_DIR, "drone_port_complex.glb"))

def build_and_save_master_blend():
    clear_all()
    print("[Blender Exporter] Building combined Masterplan Scene for .blend project...")
    
    # Create Collections for each sector
    col_agro = bpy.data.collections.new("01_Energy_and_Agro")
    bpy.context.scene.collection.children.link(col_agro)
    
    col_drone = bpy.data.collections.new("02_Autonomous_Drone_Port")
    bpy.context.scene.collection.children.link(col_drone)

    col_hub = bpy.data.collections.new("03_Dom_Taxi_and_Vityaz_Hub")
    bpy.context.scene.collection.children.link(col_hub)
    
    col_factory = bpy.data.collections.new("04_SKD_BYD_Factory")
    bpy.context.scene.collection.children.link(col_factory)
    
    col_tech = bpy.data.collections.new("05_Tech_Center_Skyscraper")
    bpy.context.scene.collection.children.link(col_tech)

    # Build and organize with neat interconnected placement around the central cybervillage
    agro = build_energy_agro_sector()
    agro.location = (-190, 0, 0) # Западный агро-энергетический кластер

    hub = build_dom_taxi_hub_sector()
    hub.location = (0, 0, 0) # Центральный хаб «Витязь» и Дом Такси

    factory = build_skd_factory_sector()
    factory.location = (0, -115, 0) # Главный сборочный завод SKD

    drone_port = build_drone_port_sector()
    drone_port.location = (130, -50, 0) # Дронопорт размещен вплотную к Башне Кибердеревни (Техноцентру)!

    tech = build_tech_center_sector()
    tech.location = (130, 20, 0) # Главная Башня Кибердеревни (Техноцентр)

    # Setup warm studio sun & isometric camera for Blender 5.2 viewport
    bpy.ops.object.light_add(type='SUN', location=(140, 200, 160))
    sun = bpy.context.active_object
    sun.name = "Studio_Sun_Light"
    sun.data.energy = 4.5
    sun.data.color = (1.0, 0.98, 0.94)
    if hasattr(sun.data, "angle"):
        sun.data.angle = 0.12 # Soft shadow edges for authentic miniature Lego feel

    # Fill light from opposite side
    bpy.ops.object.light_add(type='SUN', location=(-140, -140, 110))
    fill_sun = bpy.context.active_object
    fill_sun.name = "Fill_Sun_Light"
    fill_sun.data.energy = 2.0
    fill_sun.data.color = (0.85, 0.92, 1.0)
    if hasattr(fill_sun.data, "angle"):
        fill_sun.data.angle = 0.25

    bpy.ops.object.camera_add(location=(180, 240, 190), rotation=(1.0, 0.0, 2.35))
    cam = bpy.context.active_object
    cam.name = "Isometric_Master_Camera"
    cam.data.lens = 55 # Wide cinematic isometric view framing all sectors
    bpy.context.scene.camera = cam

    # Enable EEVEE Ambient Occlusion and Shadows
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 250
    scene.frame_current = 1

    if hasattr(scene, "render"):
        scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in scene.render.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'

    # =========================================================================
    # BLENDER KEYFRAME ANIMATIONS (Нажмите ПРОБЕЛ в Blender для воспроизведения!)
    # =========================================================================
    # 1. Анимация взлета и полета дронов
    drone_alpha = bpy.data.objects.get("Drone_Pad_Alpha_Root")
    if drone_alpha:
        drone_alpha.animation_data_clear()
        drone_alpha.location = (-18, -18, 1.4)
        drone_alpha.keyframe_insert(data_path="location", frame=1)
        drone_alpha.location = (-18, -18, 18.0)
        drone_alpha.keyframe_insert(data_path="location", frame=60)
        drone_alpha.location = (15, 10, 22.0)
        drone_alpha.keyframe_insert(data_path="location", frame=130)
        drone_alpha.location = (-18, -18, 18.0)
        drone_alpha.keyframe_insert(data_path="location", frame=200)
        drone_alpha.location = (-18, -18, 1.4)
        drone_alpha.keyframe_insert(data_path="location", frame=250)

    # 2. Вращение радара диспетчерской вышки
    radar = bpy.data.objects.get("Tower_Radar_Dish")
    if radar:
        radar.animation_data_clear()
        radar.rotation_euler = (0.5, 0, 0)
        radar.keyframe_insert(data_path="rotation_euler", frame=1)
        radar.rotation_euler = (0.5, 0, math.pi * 8)
        radar.keyframe_insert(data_path="rotation_euler", frame=250)

    # 3. Движение фуры-автовоза с завода
    hauler = bpy.data.objects.get("Hauler_Truck_Departing_Root")
    if hauler:
        hauler.animation_data_clear()
        hauler.location = (-24, 42, 0.4)
        hauler.keyframe_insert(data_path="location", frame=1)
        hauler.location = (-75, 42, 0.4)
        hauler.keyframe_insert(data_path="location", frame=180)
        hauler.location = (-95, 60, 0.4)
        hauler.keyframe_insert(data_path="location", frame=250)

    # 4. Движение выезжающего такси
    departing_taxi = bpy.data.objects.get("Departing_Taxi_1_Root")
    if departing_taxi:
        departing_taxi.animation_data_clear()
        departing_taxi.location = (18, -26, 0.4)
        departing_taxi.keyframe_insert(data_path="location", frame=1)
        departing_taxi.location = (45, -26, 0.4)
        departing_taxi.keyframe_insert(data_path="location", frame=120)
        departing_taxi.location = (85, -10, 0.4)
        departing_taxi.keyframe_insert(data_path="location", frame=250)

    # 5. Шагающие фигурки таксистов
    walk_driver = bpy.data.objects.get("Driver_Arriving_Walk_Root")
    if walk_driver:
        walk_driver.animation_data_clear()
        walk_driver.location = (-12, -22, 0.4)
        walk_driver.keyframe_insert(data_path="location", frame=1)
        walk_driver.location = (-4, -18, 0.4)
        walk_driver.keyframe_insert(data_path="location", frame=140)

    # Save .blend
    blend_path = os.path.join(PUBLIC_DIR, "cybervillage_masterplan.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[Blender Exporter] ✅ Saved master Blender project to: {blend_path}")

    # Also save direct copy to Windows D:\Blender\Cybervillage and Documents for easy opening
    win_sync_dirs = [
        "/mnt/d/Blender/Cybervillage",
        "/mnt/c/Users/123/Documents/Cybervillage"
    ]
    for wdir in win_sync_dirs:
        try:
            if os.path.exists(os.path.dirname(wdir)):
                os.makedirs(wdir, exist_ok=True)
                wblend = os.path.join(wdir, "cybervillage_masterplan.blend")
                import shutil
                shutil.copy2(blend_path, wblend)
                print(f"[Blender Exporter] 💾 Synced Windows copy to: {wblend}")
        except Exception as e:
            pass

if __name__ == "__main__":
    print("[Blender Exporter] Starting automated 3D build pipeline...")
    build_and_export_individual_assets()
    build_and_save_master_blend()
    print("[Blender Exporter] 🎉 All Blender assets compiled successfully!")
