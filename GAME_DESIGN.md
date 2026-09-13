# Rail Frontier game design

Product target: a single-player railroad strategy game in a living model railway landscape. Current deliverable is an interactive 3D Norway architecture study; the complete economic game remains the implementation milestone.

The Norwegian Fjords campaign proves the complete loop before other environments receive production work. The player connects shoreline settlements, earns passenger fares, then builds a timber/lumber chain. Network decisions should balance construction expense, terrain, demand, running costs and future expansion. The original fictional settlements Sundvik, Granli and Fjellhavn are provisional content; their positions must be fitted to the future generated terrain.

First player journey: choose campaign → inspect towns/demand → preview rail and engineering cost → confirm affordable alignment → build two connected stations → buy locomotive and passenger coaches → create shuttle route → observe station dwell/boarding → travel and unloading → receive fare and incur operating costs → expand → save/reload and continue. Every step needs visible feedback and error recovery.

Construction preview shows acceptable, expensive and invalid spans with text/icons as well as color. Show total cost, length, maximum grade and bridge/tunnel breakdown before spending. The current prototype certifies 4% maximum grade and 100 m minimum radius conservatively; traction equations and operating costs are defined for implementation. Valleyside routes should be longer and cheaper; mountain tunnels shorter and costly. Terrain must drive this choice.

Passenger demand will be destination-specific and population-based, regenerate on economic days, and respect storage/capacity. Income occurs only on destination delivery. The first freight system has three cargo types: passengers, timber, lumber. A sawmill consumes timber and produces lumber for a town. Every inventory and transfer must be inspectable. Operating reports distinguish revenue, running costs and capital expenditure.

Visual goal: deep blue water, steep green and rocky slopes, high-altitude snow, dense forest, small original Norwegian-style buildings, moving trains, waterfall mist, bridges and tunnel portals. Strategic camera must smoothly pan, zoom, rotate and tilt, focus selected objects and follow trains. Tool cancellation and strategic-view reset must be accessible by keyboard.

Planned UI: main menu (new/continue/load/campaigns/settings/credits), cash/date/speed/objective HUD, primary rail/station/train/route tools, contextual selection panels and finance reports. Avoid covering the world with permanent panels. The study establishes a forest-green field-survey UI with warm pale type and brass accents, locally bundled DM Sans/Libre Caslon Display, a lightweight DOM layer and Three.js/Vite. The planned production menu and management panels remain to be implemented.

Deferred: competitors, multiplayer, stocks, advanced signals, large vehicle catalogue, full weather physics. Steam/diesel/electric content architecture is planned, but only one original early-era locomotive and passenger coach are needed first.
