"""
Blender PBR Materials Helper for Cybervillage Lego-Isometric Diorama Style
"""
import bpy

def create_pbr_material(name, base_color=(0.8, 0.8, 0.8, 1.0), roughness=0.18, metallic=0.0, 
                        emission_color=(0.0, 0.0, 0.0, 1.0), emission_strength=0.0, 
                        transmission=0.0, ior=1.52, alpha=1.0):
    """
    Creates or returns a high-quality Principled BSDF material with authentic Lego ABS plastic properties.
    """
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

    # Signature Lego ABS Plastic Clearcoat & Specular Highlights
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.75
    elif "Clearcoat" in bsdf.inputs:
        bsdf.inputs["Clearcoat"].default_value = 0.75

    if "Coat Roughness" in bsdf.inputs:
        bsdf.inputs["Coat Roughness"].default_value = 0.08
    elif "Clearcoat Roughness" in bsdf.inputs:
        bsdf.inputs["Clearcoat Roughness"].default_value = 0.08

    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.75
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.75

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

def get_materials_dict():
    """
    Returns the curated Lego-Isometric Masterplan palette with authentic ABS gloss.
    """
    return {
        # Lego Baseplates & Earth (Vibrant, glossy ABS finish)
        "lego_green": create_pbr_material("LegoGreenBase", (0.05, 0.62, 0.22, 1.0), roughness=0.16, metallic=0.0),
        "soil_brown": create_pbr_material("LegoSoilBrown", (0.38, 0.20, 0.09, 1.0), roughness=0.35, metallic=0.0),
        "crop_green": create_pbr_material("LegoCropGreen", (0.15, 0.82, 0.28, 1.0), roughness=0.18, metallic=0.0),
        "asphalt_gray": create_pbr_material("LegoAsphaltPlate", (0.16, 0.18, 0.22, 1.0), roughness=0.20, metallic=0.05),
        "road_stripe_yellow": create_pbr_material("LegoStripeYellow", (0.98, 0.78, 0.04, 1.0), roughness=0.18, metallic=0.0),
        
        # Architectural Lego Bricks & Walls (Clean ABS plastic)
        "white_wall": create_pbr_material("LegoLightStoneGray", (0.82, 0.84, 0.88, 1.0), roughness=0.18, metallic=0.0),
        "road_curb": create_pbr_material("LegoCurbGray", (0.58, 0.62, 0.66, 1.0), roughness=0.22, metallic=0.02),
        "gray_industrial": create_pbr_material("LegoMediumStoneGray", (0.46, 0.50, 0.56, 1.0), roughness=0.22, metallic=0.05),
        "dark_slate_roof": create_pbr_material("LegoDarkStoneGray", (0.20, 0.22, 0.28, 1.0), roughness=0.20, metallic=0.05),
        "lego_red_brick": create_pbr_material("LegoBrightRed", (0.85, 0.08, 0.10, 1.0), roughness=0.16, metallic=0.0),
        "factory_blue": create_pbr_material("LegoBrightBlue", (0.04, 0.38, 0.82, 1.0), roughness=0.16, metallic=0.0),
        "canopy_blue": create_pbr_material("LegoMediumAzure", (0.08, 0.56, 0.88, 1.0), roughness=0.16, metallic=0.0),
        "gantry_yellow": create_pbr_material("LegoBrightYellow", (0.98, 0.76, 0.05, 1.0), roughness=0.16, metallic=0.0),
        "steel_dark": create_pbr_material("LegoTitaniumMetallic", (0.18, 0.22, 0.26, 1.0), roughness=0.24, metallic=0.75),

        # Pipes & Infrastructure
        "thermal_pipe_blue": create_pbr_material("LegoThermalPipe", (0.04, 0.65, 0.98, 1.0), roughness=0.14, metallic=0.20),
        "pipe_joint_silver": create_pbr_material("LegoSilverMetallic", (0.88, 0.90, 0.94, 1.0), roughness=0.15, metallic=0.88),

        # Transparent Lego Elements (Glossy transparent plastic)
        "glass_greenhouse": create_pbr_material("LegoTransClearGreen", (0.50, 0.95, 0.85, 0.40), roughness=0.02, metallic=0.02, transmission=0.92, ior=1.52, alpha=0.40),
        "glass_window": create_pbr_material("LegoTransLightBlue", (0.20, 0.65, 0.95, 0.65), roughness=0.03, metallic=0.05, transmission=0.80, ior=1.52, alpha=0.65),
        "solar_pv_panel": create_pbr_material("LegoSolarBlueTile", (0.04, 0.18, 0.62, 1.0), roughness=0.08, metallic=0.85),

        # Emissive & Signs
        "sign_blue": create_pbr_material("LegoSignBlueNeon", (0.02, 0.55, 0.98, 1.0), roughness=0.12, emission_color=(0.0, 0.75, 1.0, 1.0), emission_strength=2.2),
        "red_cross": create_pbr_material("LegoMedicalRedNeon", (0.98, 0.05, 0.08, 1.0), roughness=0.12, emission_color=(1.0, 0.05, 0.08, 1.0), emission_strength=2.5),
        "smoke_puff": create_pbr_material("WhiteSmokePuff", (0.98, 0.98, 1.0, 0.80), roughness=0.85, alpha=0.80),
        
        # Minifigures & Drone / Truck Details
        "minifig_yellow": create_pbr_material("LegoMinifigYellow", (0.98, 0.82, 0.08, 1.0), roughness=0.15, metallic=0.0),
        "uniform_orange": create_pbr_material("LegoUniformOrange", (0.98, 0.42, 0.05, 1.0), roughness=0.18, metallic=0.0),
        "drone_body_white": create_pbr_material("LegoDroneWhite", (0.92, 0.94, 0.98, 1.0), roughness=0.14, metallic=0.05),
        "neon_cyan": create_pbr_material("LegoNeonCyan", (0.0, 0.95, 1.0, 1.0), roughness=0.1, emission_color=(0.0, 0.95, 1.0, 1.0), emission_strength=3.0),
        "neon_orange": create_pbr_material("LegoNeonOrange", (1.0, 0.45, 0.0, 1.0), roughness=0.1, emission_color=(1.0, 0.45, 0.0, 1.0), emission_strength=2.8),
    }
