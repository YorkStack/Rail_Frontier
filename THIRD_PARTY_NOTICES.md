# Third-party notices

Rail Frontier remains MIT licensed under the existing LICENSE, copyright 2026 York. All game source and generated wagon geometry/materials introduced in this milestone are original project work under that license. No external art, audio, fonts or textures have been imported.

| Dependency | Version | License | Use |
|---|---|---|---|
| zod | 4.6.4 | MIT | Runtime save validation |
| typescript | 7.0.2 | Apache-2.0 | Development compiler |
| tsx | 4.23.13 | MIT | Development TS runner |
| @types/node | 22.20.2 | MIT | Development types |

Transitive packages and platform binaries are pinned in package-lock.json. Their license metadata is inspected during this milestone; redistributed package code must retain its license/copyright notice. See the copied local license texts under `licenses/`. A production bundler must include notices for bundled runtime dependencies (currently Zod); development-only tools need not be included in the game's browser download.

Blender 4.0.2 is an external authoring tool installed on the developer's machine, not shipped with Rail Frontier. No Blender application/source code is incorporated into runtime assets. The exported GLBs contain only original generated geometry and materials. If tooling distribution later bundles Blender or adds third-party exporter extensions, review their own distribution terms before doing so.

No engine license has been reviewed because the intended engine is not yet identified. Review its source/package license and required attribution before integration.
