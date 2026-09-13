"""Blender 4.0+: original 10 m wagon probe, glTF coordinates and two LODs."""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'assets/runtime/models/core'
SOURCE = ROOT / 'assets/source/blender'
OUTPUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*color, 1)
    mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .65
    return mat

red = material('RF_Painted_Red', (.35, .045, .035))
iron = material('RF_Iron', (.06, .075, .08))
marker = material('RF_Forward_Marker', (.85, .6, .13))

def box(name, location, dimensions, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj

# Source +Y forward, Z up. glTF exporter maps +Y to -Z, +Z to +Y.
box('RF_Wagon_Body', (0, 0, 2.0), (2.8, 10, 2.4), red)
box('RF_Chassis', (0, 0, .65), (2.6, 9.6, .3), iron)
box('RF_Forward', (0, 5.05, 2), (.6, .1, .6), marker)
for y in (-3.1, 3.1):
    for x in (-1.1, 1.1):
        box('RF_Wheel_Proxy', (x, y, .35), (.3, .7, .7), iron)
for name, location in [('coupler_front', (0, 5.2, .7)), ('coupler_rear', (0, -5.2, .7)), ('forward_probe', (0, 6, 0)), ('up_probe', (0, 0, 2))]:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE / 'wagon_probe.blend'))
for lod in (0, 1):
    if lod == 1:
        for obj in list(bpy.data.objects):
            if obj.name.startswith('RF_Wheel_Proxy'):
                bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.export_scene.gltf(filepath=str(OUTPUT / f'wagon_probe_lod{lod}.glb'), export_format='GLB', export_yup=True, export_animations=False, export_cameras=False, export_lights=False)
print('RF_ASSET_EXPORT', json.dumps({'blender': bpy.app.version_string, 'output': str(OUTPUT), 'units': 'metres', 'runtime_up': '+Y', 'runtime_forward': '-Z'}))
