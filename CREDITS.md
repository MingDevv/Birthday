# Credits and licenses

- **Prompt** and **Outfit** web fonts: Google Fonts; both typefaces are distributed under the SIL Open Font License. The project loads them from Google Fonts at runtime.
- **Three.js**, **GSAP**, **Vite**, **lil-gui**, **stats.js**, **Playwright**, **pngjs**, and **canvas-confetti**: third-party packages; see each package's license in `node_modules/<package>/LICENSE` and the dependency lockfile.
- Memory-card placeholder photographs: Unsplash source URLs are listed in `src/config/memoriesData.js`. Keep them as temporary placeholders and replace with owner-selected photos before public publishing.
- `public/audio/velika-official-audio.mp3`: supplied by the project owner. Usage rights have not been independently verified.
- **Planet texture maps** in `public/textures/planets/` (Earth day/clouds, Venus atmosphere, Moon, Mars, Jupiter, Saturn and Saturn's rings): Solar System Scope, [Solar Textures](https://www.solarsystemscope.com/textures/). The pack states that textures are based on NASA elevation/imagery data and is distributed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution: “Planet texture maps by Solar System Scope, based on NASA data, CC BY 4.0.”
- `public/models/khaohom.svg`: Thai letter outlines generated from Prompt Regular by Cadson Demak; the Prompt OFL 1.1 license is included beside the SVG as `public/models/Prompt-OFL.txt`.
- Galaxy, star, orbit, wormhole, and glow graphics are generated procedurally in project code.

## Birth sky (round 14)
- Star positions, magnitudes, colours and constellation lines: [d3-celestial](https://github.com/ofrohn/d3-celestial) by Olaf Frohn, BSD-3-Clause, derived from the Hipparcos / HYG catalogues. Stored in `public/data/birth-sky.json`.
- Moon, Sun and planet positions for 13 Jan 2011, Chiang Rai: computed with [astronomy-engine](https://github.com/cosinekitty/astronomy) by Don Cross, MIT. Regenerate with `scripts/build-birth-sky.mjs`.
- Moon texture: the existing `2k_moon.jpg` (Solar System Scope, CC BY 4.0).
