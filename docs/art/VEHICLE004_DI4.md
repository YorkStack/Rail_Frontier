# VEHICLE-004 — Nord Di 4

Date: 2026-09-14. Status: complete.

## Reference boundary

The [Norske tog Di4 fleet page](https://www.norsketog.no/tog/lokomotiver/di4) is the primary dimensional and performance source. It records a 20,800 mm long, 3,176 mm wide and 4,350 mm high diesel-electric locomotive with 120 t net mass, 2,450 kW engine power, 360 kN maximum tractive force, 140 km/h permitted speed and Co′Co′ running gear. The page labels production as 1980 and separately says five locomotives were produced and delivered in 1981. Rail Frontier uses the delivery year, 1981, as the catalogue boundary.

The official photographs establish the visual family: an angular, sloping twin-windscreen cab at both ends, long high radiator banks, a dark roof with fan housings and exhaust, six driven axles, cream side striping and a large yellow-orange snowplough. The game model is an original low-poly interpretation. The red/cream `Nord` finish studies the visible fleet appearance without reproducing logos, operator marks or a claimed delivery-day livery.

Purchase cost of NOK 480,000, NOK 38/km running cost and NOK 150/day maintenance are balance choices. They place the much stronger Di 4 above the Di 3B in capital and upkeep while retaining unrestricted diesel route access.

## Authored result

Local Blender 4.0.2 generates `nord-di-4` independently from the rounded Di 3B. A dedicated wedge mesh forms each sloping cab and carries its own UVs. The near LOD includes cream-framed V-set front glazing, four lamps per end, number plates, end rails, cab doors and door glazing, side windows, twin cream waist stripes, fourteen upper radiator panels, two three-axle bogies, three roof fans, exhaust, buffers and snowploughs. The far LOD retains the angular cab, front windows and lamps, side doors/windows, radiator rhythm, stripes, all six axles, roof equipment and plough silhouette.

| LOD | Triangles | Bytes | Materials | Purpose |
|---|---:|---:|---:|---|
| 0 | 2,260 | 207,668 | 7 | follow and inspection cameras |
| 1 | 1,380 | 137,048 | 7 | regional camera |

Both LODs preserve the common coupler, forward and up markers, complete texture coordinates and the existing 12,000/3,000 triangle and 350,000/140,000 byte limits. The Norway pack now contains 35 asset types, 70 GLBs and 12 shared PNGs, totalling 2,319,609 bytes (2.21 MiB).

## Gameplay and verification

`nord-di-4` unlocks in 1981 with the official length, mass, power, tractive force and speed values. The 1980 purchase rejects without state mutation; the 1981 purchase succeeds through the ordinary locomotive catalogue and finance path.

The asset validator checks axes, bounds, UVs, markers, LOD reduction, budgets and the angular cab, front windows, doors, radiator panels, roof fans and plough. Chrome renders the front, both sides and roof with no console errors; evidence is stored under `artifacts/evidence/gfx-006b/nord-di-4-*.png`.
