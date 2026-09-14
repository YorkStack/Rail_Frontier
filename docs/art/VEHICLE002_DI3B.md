# VEHICLE-002 — Nord Di 3B

Date: 2026-09-14. Status: complete.

The first future-era Norway locomotive is an original `nord-di-3b` Blender asset inspired by NSB Di 3.642. The [Norwegian Railway Museum record](https://jernbanemuseet.no/desember-2014-diesellokomotiv-di-3642/) identifies that locomotive as the longer B subtype, built in 1959 and acquired by NSB in 1960. It records 18.9 m over buffers, 103 t service mass, 1,305 kW engine output, A1A′ A1A′ running gear and 143 km/h maximum speed. Those measured values drive the content record. The 240 kN tractive force and all currency values are explicit game-balance choices because the museum page does not supply starting tractive effort or comparable game prices.

The mesh uses the subtype's rounded double-cab silhouette, six visible axles, divided front windows, cab-side doors, portholes, dark cooling grilles, three roof fans, exhaust housing, headlights, handrails, buffer beams and ploughs. The fictional Nord early-service finish uses a deep green body and pale stripe, informed by the museum's documented green/white first livery. Yellow safety accents are an original operator treatment rather than a claim about the exact 1960 paint specification. No real logo, number plate or photographic texture is copied.

Blender 4.0.2 exports two GLBs through `tools/blender/generate_norway_pack.py`. LOD0 is 207,912 bytes, 2,652 triangles and seven materials; LOD1 is 64,848 bytes, 756 triangles and five materials. Runtime dimensions are 3.25 × 5.05 × 19.03 m. Both levels preserve front/rear couplers and axis probes, use the shared rolling-metal PBR maps, and remain below the established 12,000/3,000-triangle and 350/140 KB budgets.

The vehicle catalogue unlocks the diesel in 1960 at NOK 320,000, with lower simulated running and daily maintenance costs than the original steam locomotive but a higher capital price and mass. The Railway Office exposes it automatically when `currentYear` reaches 1960. Purchase remains atomic, station platform length still applies, and no electrification is required for diesel traction.

Validation:

- Asset validator checks 33 asset types / 66 GLBs, four vehicles, marker equality, axes, bounds, UVs, detail nodes, LOD reduction and byte/triangle/material budgets.
- Node tests check catalogue visibility in 1959/1960, measured content fields, unavailable-purchase atomicity and successful 1960 purchase.
- Real Chrome loads the asset through GLTFLoader and captures front, left, right and roof views under production lighting at `artifacts/evidence/gfx-006b/nord-di-3b-*.png`.

The next electric vehicle requires route electrification before it can enter the purchase catalogue. Di 4 and El 18 remain later, separately authored eras; they do not reuse this rounded body.
