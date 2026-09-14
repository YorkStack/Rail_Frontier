# VEHICLE-003 — Nord El 1

Date: 2026-09-14. Status: complete.

## Reference boundary

The asset is an original, game-scaled interpretation of the 1922 El 1a rather than a copied museum mesh or photographed texture. The [Norsk Jernbanemuseum display guide](https://jernbanemuseet.no/wp-content/uploads/2024/07/Utstilt-materiell-sommer.pdf) records El 1 no. 2001 as a 1922 Thune/Per Kure locomotive with B′B′ running gear, 15 kV 16⅔ Hz supply, two 470 hp motors, 12,700 mm length, 61.3 t service mass and 70 km/h maximum speed. The same museum material records 24 units and preservation of nos. 2001 and 2011. The [museum object photograph](https://digitaltmuseum.no/011023074230/lokomotiv) supplies the visible preserved form: a central green cab, short hoods, red running gear, coupled rods, side pipe loops, louvres and paired diamond pantographs. Its observed finish is used as an undated visual study, not claimed as the 1922 delivery livery.

The catalogue uses 690 kW, the metric equivalent published with the class specifications, and 157 kN starting tractive force. The latter is cross-checked against the class reference assembled by [Jernbane.net](https://jernbane.net/bo/subpage.php?s=3&t=1). Purchase price, NOK 24/km running cost and NOK 105/day maintenance are game balance values. The in-game name `Nord El 1` keeps the class reference while using the fictional operator.

## Authored result

Local Blender 4.0.2 reproducibly generates `nord-el-1` with two LODs. The near model contains the central steeple cab, short bevelled hoods, four visible coupled axles on each side, hubs and simplified spokes, rods and crank pins, three characteristic side pipe runs, louvres, cab doors and glazing, front windows, lamps, number plates, buffers, ploughs and end rails. Both LODs retain two diamond pantographs, insulators, roof conductor and 6.82 m local contact bars. With the renderer's 0.12 m rail offset, the derived catenary meets them at 6.94 m above the track sample.

The fictional finish separates dark green painted bodywork, dark roof and frames, red running gear, brass-toned external fittings, copper conductor and brown insulators. It reuses the shared rolling-metal base/normal/roughness maps rather than shipping copied photographic paint.

| LOD | Triangles | Bytes | Materials | Purpose |
|---|---:|---:|---:|---|
| 0 | 3,860 | 337,756 | 7 | follow and inspection cameras |
| 1 | 1,388 | 120,996 | 6 | regional camera |

Both exports preserve the common coupler, forward and up markers. They remain below the existing 12,000/3,000 triangle and 350,000/140,000 byte limits. The Norway pack now contains 34 asset types, 68 GLBs and 12 shared PNGs, totalling 1,974,893 bytes (1.88 MiB).

## Gameplay and verification

`nord-el-1` unlocks in 1922 with 12.7 m length, 61,300 kg mass, 690 kW power, 157 kN tractive force and 70 km/h maximum speed. Purchase requires electrified track at the selected station. Route assignment requires every resolved route edge to be electrified, and the station-service recalculation blocks departure if a changed path lacks power.

The asset validator checks axes, bounds, markers, material budget, LOD reduction and the El 1 windows, doors, louvres, pipes, rods and pantograph nodes. Chrome renders front, both sides and roof without console errors; evidence is stored under `artifacts/evidence/gfx-006b/nord-el-1-*.png`. Catalogue and command tests cover the 1921/1922 boundary, atomic purchase rejection and full-route power gate.
