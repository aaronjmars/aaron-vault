---
name: aaron-vault-animations
description: Recreate, adapt, or assemble any or all motion studies from aaronjmars/aaron-vault, including its 53 gallery animations and seven additional demos. Use when a user asks for a vault animation, a matching motion effect, or the complete collection.
---

# Aaron Vault animations

Use the source repository at `https://github.com/aaronjmars/aaron-vault`. In this checkout, the repository root is three directories above this file (`.agents/skills/aaron-vault-animations/SKILL.md`). If the skill was copied elsewhere, find an existing clone with that Git remote or clone it into the task workspace. The source code is the implementation; the catalog below is a routing and visual specification, not a substitute for reading the chosen files.

The repository is a Next.js 16, React 19, TypeScript, Tailwind 4 gallery. It has **53 entries in `app/page.tsx`** and **seven additional usable demos** in `components/`, for **60 animations total**. `components/swirl/controls.tsx` is a shared helper, not an animation. The gallery says “fifty-three”; do not infer that the extra demos are on the page.

## Generate an animation

1. Match the request to the catalog. For an exact recreation, read the listed entry and its whole component directory. Follow relative imports into `components/` and `lib/`; inspect relevant rules in `app/globals.css`, font variables in `app/layout.tsx`, and referenced files in `public/`. Read `params.ts`, scene data, masks, shaders, and timing functions before changing motion. Several studies use a separate `engine.ts` plus a React lifecycle wrapper; copying only the entry component is incomplete.
2. Preserve the effect's defining motion, interaction, composition, type, timing, and color roles. Expose requested words, colors, speed, or dimensions through existing props or parameters when possible. For a new variation, make a coherent variation of the chosen effect rather than mixing unrelated techniques. Use DOM/CSS, Canvas 2D, SVG, WebGL, or Three.js according to the source implementation and target environment.
3. Bring over the dependency closure and required assets. The gallery's **Copy code** button, backed by `app/api/component-source/route.ts`, bundles the selected entry, its directory, local source imports, and shared app files. Its binary media list is only a hint: copy actual referenced media separately. For the seven unlisted demos, trace imports manually. Preserve `lib/animation-theme.ts` if retaining global foreground/background/accent overrides; `lib/video-sources.ts` resolves local video and image URLs, optionally through `NEXT_PUBLIC_MEDIA_BASE`.
4. In React, keep browser-only rendering in client components. Size canvases for their displayed dimensions and device pixel ratio; resize when the host changes. Start rendering while visible, pause when offscreen or the tab is hidden, provide a still frame for reduced motion, and clean up animation frames, timers, observers, media, and GPU resources on unmount. These behaviors are part of the source effects. If rendering many WebGL cards together, use the gallery's `components/gl-guard.tsx` pattern to recover lost contexts. Keep the accessible label or equivalent description.
5. Verify the actual result in the target app at desktop and narrow widths. Check one complete loop, pointer or keyboard behavior where applicable, reduced motion, tab hiding, resize, missing assets, and console errors. For work in this checkout, run `npm ci` if dependencies are absent, `npm run dev` for visual inspection, and `npm run build` after code changes. If asked for **all**, account for all 60 catalog entries (or explicitly the 53 gallery entries when the user says gallery only); verify the count and that every rendered card works.

The gallery layout, global CSS, `FitStage`, `GLGuard`, haptics, sound, and theme are shared conveniences. Include each only when the selected effect needs it. The original page credits `arlan.me/vault`; retain that credit when recreating the collection.

## Gallery catalog — 53 entries

The **entry** column is relative to the repository root. Its parent directory contains the effect's engine, parameters, shaders, scene data, or other local dependencies.

| Effect | Entry | Motion and visual signature |
| --- | --- | --- |
| Warp | `components/warp-type/WarpTypeCard.tsx` | Six hard-cut phrases; each verb deforms its own letters. |
| Flip | `components/flip-type/FlipTypeCard.tsx` | One word flips into the next. |
| Drift into focus | `components/cloud-type/CloudTypeCard.tsx` | Type emerges from a dithered, cloudy field. |
| Eclipse | `components/eclipse-grid/EclipseGridCard.tsx` | Array of rings and discs makes an eclipse pattern. |
| Shutter | `components/shutter-type/ShutterTypeCard.tsx` | Rolling shutter reveals and distorts type. |
| Pop | `components/pop-type/PopTypeCard.tsx` | Letters drop, swell, and pop. |
| Misprint | `components/misprint-type/MisprintTypeCard.tsx` | Two offset prints of the same word. |
| Verbs | `components/verb-type/VerbTypeCard.tsx` | Five words each perform a different motion. |
| Ripple | `components/ripple-grid/RippleGridCard.tsx` | A thresholded scalar field ripples across a grid. |
| Flood | `components/flood-type/FloodTypeCard.tsx` | Oversized type overruns the frame. |
| Phase table | `components/phase-table/PhaseTableCard.tsx` | Metallic Lissajous motion. |
| Swing | `components/swing-type/SwingTypeCard.tsx` | Letters turn on a shared linear angle. |
| Spray | `components/spray-burst/SprayBurstCard.tsx` | Press-triggered burst cycles six drawings with a 24 fps boil. |
| Rush | `components/rush-type/RushTypeCard.tsx` | Fast type tears color away. |
| Ink flood | `components/ink-flood/InkFloodCard.tsx` | A scribble spreads until it fills the scene. |
| Bond | `components/bond-type/BondTypeCard.tsx` | A name folds into a molecular structure. |
| Dash cascade | `components/dash-cascade/DashCascadeCard.tsx` | Words unfold from a dotted line. |
| Wild | `components/wild-type/WildTypeCard.tsx` | Type appears, warps dramatically, then disappears. |
| Loud burst | `components/loud-burst/LoudBurstCard.tsx` | A sentence explodes into drawn strokes. |
| Stamp | `components/stamptype/StampTypeCard.tsx` | Kinetic poster compositions move on a conveyor. |
| Flower lattice | `components/flower-lattice/FlowerLatticeCard.tsx` | Flowers blink together behind a frame. |
| Reality split | `components/reality-split/RealitySplitCard.tsx` | Design-tool shapes and handles animate autonomously. |
| Checker conveyor | `components/checker-conveyor/CheckerConveyorCard.tsx` | Checkerboard scenes ride a moving seam. |
| Glass | `components/glass-type/GlassTypeCard.tsx` | A ripple lens refracts type. |
| Sunset slam | `components/sunset-slam/SunsetSlamCard.tsx` | A logo slams forward from a dawn backdrop. |
| Orbit | `components/orbit/OrbitCard.tsx` | Cursor-like marks orbit an invisible sphere. |
| Word carousel | `components/word-carousel/WordCarouselCard.tsx` | Four nouns rotate along a rail. |
| Slide stack | `components/slide-stack/SlideStackCard.tsx` | Five blocks move as one wave. |
| Spike | `components/spiketype/SpikeTypeCard.tsx` | Spikes grow from a word's outline. |
| Dot globes | `components/dotglobe/DotGlobeCard.tsx` | Three dotted solids pass a mark along a row. |
| Arcade pixel | `components/arcade/playground.tsx` | Tiny type enlarged into textured pixels. |
| Code trail | `components/code-trail/CodeTrailCard.tsx` | Code fragments chase the pointer in a staircase. |
| Glitch word | `components/glitch-word/GlitchWordCard.tsx` | A typographic badge tears into glitch fragments. |
| Datamosh | `components/datamosh/DatamoshCard.tsx` | Vertical corrupted-decode displacement. |
| Siri glow | `components/siri-wave/SiriWaveCard.tsx` | Audio-driven prism ribbon and glow. |
| Fade motion | `components/smear/SmearCard.tsx` | Hundreds of word copies create a motion smear. |
| Dotcut | `components/dotcut/DotCutCard.tsx` | A glyph is cut out of a touching dot mesh. |
| Badge trail | `components/badge-trail/BadgeTrailCard.tsx` | Typography badges trail the cursor. |
| Blur glow | `components/blur-glow/BlurGlowCard.tsx` | A word shines through a bloom halo. |
| Text reveal | `components/text-reveal/TextRevealCard.tsx` | Corner copy appears through a cloudy mask. |
| Blur reveal | `components/blur-reveal/BlurRevealCard.tsx` | Panels dissolve from blur into focus. |
| Word stickers | `components/word-stickers/WordStickersCard.tsx` | Die-cut vinyl words can be flung around. |
| Kinetic A | `components/kinetic-a/KineticACard.tsx` | A letter ripples like a water surface. |
| Ransom note | `components/ransom/playground.tsx` | Magazine-cut glyph images assemble into movable text. |
| Chromatic glow | `components/chroma/playground.tsx` | Light separates into chromatic fringes. |
| Emboss | `components/emboss/playground.tsx` | Type appears pressed into textured plaster. |
| Design tiles | `components/design-tiles/DesignTilesCard.tsx` | A sentence becomes one moving color bar. |
| ASCII wordmark | `components/ascii-wordmark/AsciiWordmarkCard.tsx` | A word is rebuilt from live ASCII glyphs. |
| Pixel scan | `components/pixel-scan/PixelScanCard.tsx` | Blocks scan into a word. |
| Tile field | `components/tile-field/TileFieldCard.tsx` | Wandering light forms a tiled wordmark. |
| Figma vector editor | `components/svg-editor/playground.tsx` | Blue selection boxes and editable vector points move. |
| Symbols | `components/symbols/playground.tsx` | A picture is stamped out of glyph marks. |
| The typer | `components/typer/playground.tsx` | Headlines type themselves in. |

## Additional usable demos — seven entries

These exist in the checkout but are not rendered by `app/page.tsx`. Treat their entry as the starting component and inspect its local files and shared imports before use.

| Effect | Entry | Motion and visual signature |
| --- | --- | --- |
| AI lights | `components/ai-lights/AiLightsCard.tsx` | Morphing control variants pulse with masked rim light. |
| Embroidery | `components/embroidery/EmbroideryCard.tsx` | Stitched word patches catch a pointer-driven light; uses `public/vault/embroidery-weave.webp`. |
| Holographic card | `components/holo/HoloCard.tsx` | Pointer tilt drives foil, glare, grain, and portrait layers; uses `public/holo/kamila.webp`. |
| Hover video buttons | `components/hover-video/playground.tsx` | Buttons reveal a video mascot on hover; uses `public/vault/amo/amo-puff.*`. |
| Liquid | `components/liquid/playground.tsx` | Metaball-like liquid forms and transitions; core renderer is `LiquidCard.tsx` plus its engine. |
| Pixel brush | `components/pixel-brush/PixelBrushCard.tsx` | Three colorful procedural brush strokes draw in sequence. |
| Squircle | `components/squircle/playground.tsx` | Superellipse controls demonstrate shape, hover, and state transitions. |

## Source and asset notes

- The full source for an effect is often larger than one file. The code-copy API gathers source files, but it does **not** include the bytes of images or videos. Use `rg '/vault/|/holo/|mediaUrl|ransomUrl|videoSources' components/<effect> app/globals.css` to find asset references, including dynamic paths. `public/vault/ransom/manifest.json` and the glyph images belong together.
- `public/vault/arcade-*.webp`, `emboss-*.webp`, and `embroidery-weave.webp` supply textures. The shipped hover video has VP9 WebM and MP4 fallbacks; its optional alpha-video sources are not present in this checkout.
- Font variables in `app/globals.css` map source font names to the locally loaded Inter font or system fallbacks. When porting, preserve the intended metrics or remeasure glyph geometry after changing fonts.
- The source's `themeColor`, `themePaint`, and `themeRgb` helpers change renderer input colors, rather than applying a CSS filter to finished cards. Preserve that distinction when global recoloring is requested.
