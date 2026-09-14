# GFX-006B — Norway rolling-stock detail

Completed 2026-09-14 with local Blender 4.0.2 and the existing Three.js renderer.

## Delivered assets

`tools/blender/generate_norway_pack.py` now builds the current steam consist with separate painted-metal, exposed-metal and timber surfaces. The Nord 2-6-0 has three-dimensional boiler pipes, drop pipes, handrails, boiler bands, cab windows and doors, steps, motion rods, front lamp and buffer beam. Its smoke box faces source +Y and runtime −Z, matching `forward_probe`; couplers and the wheel-contact origin remain unchanged.

The 48-seat passenger coach retains its content length and capacity while adding side/end doors, door glazing, repeated windows, platforms and roof seams. The freight wagon adds a timber deck/load, side stakes, buffers and separate wood/steel roughness. No vehicle catalogue, physics, finance or save data changed.

Six original tileable runtime maps cover rolling metal and rolling wood: base colour, tangent-space normal and roughness. Metal is 512 px; wood is 256 px. The manifest owns colour space, material-prefix binding and repeat values, and both Blender generators merge their own texture records so either generator can be rerun without deleting the other set.

## Verification

- Asset validation checks all 12 shared PNGs, UVs, budgets, unchanged marker coordinates and named close-detail meshes. It also rejects a backwards locomotive body.
- Real Chrome loads all 64 GLBs and 12 shared maps. A test purchases a freight consist and renders the locomotive, passenger coach and freight wagon from the front, left, right and roof, with other consists and nearby scenery isolated for an unobstructed inspection.
- Reviewed local evidence: `artifacts/evidence/gfx-006b/contact-sheet.png` and the 12 source captures in the same ignored directory. The front view shows the smokebox rather than the cab, both steam-pipe runs are readable, coach windows/doors remain distinct, and the freight wood/steel split is visible.

| Asset | LOD0 triangles | LOD1 triangles |
|---|---:|---:|
| Nord 2-6-0 | 1,204 | 236 |
| Passenger coach | 536 | 36 |
| Freight wagon | 452 | 72 |

The complete Norway art payload is 32 asset types / 64 GLBs plus 12 PNGs, 1,243,381 bytes (1.19 MiB). All three vehicles remain comfortably below the existing 12,000/3,000 triangle gates. El 1, Di 3, Di 4 and El 18 remain research briefs for later technology/content tasks and are not enabled by this graphics pass.
