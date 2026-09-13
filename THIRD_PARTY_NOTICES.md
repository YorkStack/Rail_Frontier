# Third-party notices

Rail Frontier remains MIT licensed under LICENSE, copyright 2026 York. Game code, procedural world, wagon geometry and materials are original project work. No external game art/audio/textures are imported. Two locally bundled font families have their own OFL licenses.

| Dependency | Version | License | Use |
|---|---|---|---|
| three | 0.186.0 | MIT | Runtime renderer and included GLTFLoader/OrbitControls |
| zod | 4.6.4 | MIT | Runtime save validation |
| @fontsource/dm-sans | 5.3.0 | OFL-1.1 | Locally bundled UI font |
| @fontsource/libre-caslon-display | 5.3.0 | OFL-1.1 | Locally bundled display font |
| vite | 8.3.0 | MIT | Development/build tool |
| @types/three | 0.186.0 | MIT | Development types |
| @playwright/test | 1.63.0 | Apache-2.0 | Browser integration testing |
| typescript | 7.0.2 | Apache-2.0 | Development compiler |
| tsx | 4.23.13 | MIT | Development TS runner |
| @types/node | 22.20.2 | MIT | Development types |

Installed package metadata and license files were checked before checkpointing. Exact transitive versions/licenses are in package-lock.json. License/notice texts (line endings normalized only) are copied under licenses/. Third-party code and fonts retain their own licenses; the project's MIT license does not replace those terms. OFL fonts are distributed unmodified alongside their license notices; they are not sold separately.

Production builds include project/runtime dependency/font notices through tools/copy-notices.ts. Development-only licenses remain in the repository; Vite/TypeScript/Playwright are not shipped as browser executable code. Included Three.js addons are part of its MIT distribution. No unrelated example models are copied.

Blender 4.0.2 is an external authoring tool, not bundled. Runtime GLBs contain original generated geometry/materials, not Blender source or application code. Revisit tooling distribution terms if Blender itself or other exporters are later bundled.
