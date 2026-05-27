# 3D Noise Machine World -- Design Spec

## Overview

Add two immersive 3D scenes to the existing noise machine, toggled from the current 2D view. Both scenes share the same audio engine and provide the same controls (frequency, volume, noise type, play/pause) through in-world physical metaphors. The aesthetic is inspired by Firewatch -- stylized, warm sunset palette, surreal and peaceful.

## Views

Three views cycle via a toggle button: **2D** (existing) -> **Lake** -> **Garden** -> **2D**.

### 2D View (Existing)

The current p5.js interface. Refactored to consume a shared audio engine instead of owning the audio code directly. Functionally unchanged.

### Scene 1: The Lake

**Environment:** A still mountain lake at sunset. Low-poly terrain silhouettes frame the horizon as layered ridges fading into atmospheric haze. The sky is a banded gradient (orange -> amber -> rose -> purple). The water is a reflective plane mirroring the sky and lantern glow.

**Lantern Control:** A warm glowing orb hovering above the water surface.
- Drag left/right: sweep filter frequency (10 Hz - 22 kHz)
- Drag up/down: control volume (up = louder)
- Leaves a faint light trail that fades
- Casts a pool of light on the water that expands with volume

**Frequency Bars:** Bioluminescent columns rising from the water in a semicircular arc in front of the lantern. Each column is a translucent pillar of light pulsing with its frequency band. Colors shift from warm amber (low) through pink to cool purple (high). Columns reflect in the water surface.

**Noise Totems:** Four floating objects near the right shore:
- White noise: softly glowing white sphere
- Pink noise: rose-colored crystal
- Brown noise: warm amber stone
- Vinyl: dark spinning disc

Active totem glows brighter and floats slightly higher.

### Scene 2: The Garden

**Environment:** A terraced garden at golden hour. Low-poly planters, stone paths, stylized trees/shrubs on gentle slopes. Warm tones: terracotta, sage green, dusty gold. A wire stretches between two wooden posts across the scene.

**Lantern Control:** Same warm glowing orb, suspended from the wire.
- Drag left/right: slide along the wire to control frequency. Wire sags slightly under the lantern.
- Drag up/down: control volume. Pulling down dims, lifting up brightens the garden.
- Lantern illuminates nearby plants and casts soft shadows.

**Frequency Visualization:** Aurora ribbons flowing across the sky. Bands of color ripple and pulse with each frequency range:
- Low frequencies: deep reds and oranges near the horizon
- Mid frequencies: pinks and magentas
- High frequencies: purples and teals higher up

Ribbons undulate gently when quiet, surge and dance when loud. They blend into the sunset gradient.

**Noise Totems:** Four objects on a stone shelf near the left planter:
- White noise: pale ceramic bowl with faint hum glow
- Pink noise: potted flower with softly glowing petals
- Brown noise: rough clay pot with warm inner light
- Vinyl: small vintage gramophone ornament

Same interaction as Lake -- click to switch, active glows and lifts.

## Shared Systems

### Audio Engine (`audio-engine.js`)

Extracted from current `sketch.js`. Owns all audio state and exposes a clean API:

```
AudioEngine.init()           -- async: create Noise, LowPass, FFT, await loadSound for vinyl
AudioEngine.play()           -- start current noise source
AudioEngine.stop()           -- stop current noise source
AudioEngine.switchNoise(type) -- 'white' | 'pink' | 'brown' | 'vinyl'
AudioEngine.setFrequency(f)  -- set LowPass cutoff (10-22000)
AudioEngine.setResonance(r)  -- set LowPass resonance (0-20)
AudioEngine.setVolume(v)     -- set amplitude (0-1)
AudioEngine.getSpectrum()    -- return current FFT analysis array
AudioEngine.isPlaying()      -- return playing state
AudioEngine.currentNoise()   -- return current noise type string
```

p5.js remains loaded globally for the audio (p5.sound depends on it). Three.js loaded from CDN for 3D rendering. Both available in all views.

### Lantern (`lantern.js`)

Shared draggable light source used by both scenes. Encapsulates:
- 3D position tracking
- Pointer raycasting for drag interaction
- Mapping X position to frequency, Y position to volume
- Glow/bloom effect (point light + emissive mesh)
- Light trail particles

Each scene provides its own constraints (Lake: free on water plane; Garden: constrained to wire path).

### Sky (`sky.js`)

Firewatch gradient sky shader. A large sphere or dome with a custom fragment shader that renders the banded sunset gradient. Shared between both scenes with minor per-scene parameter tweaks.

### Camera (`camera.js`)

Ambient drift controller:
- Slow continuous orbit around the scene focal point (the lantern)
- Slight vertical bob
- ~60 second full orbit
- Pauses drift while user is dragging the lantern
- Resumes after pointer release

### Transitions (`transition.js`)

Manages view switching:
- **2D -> 3D:** Camera zooms into the noise area rectangle. 2D content fades. 3D scene materializes within the rectangle, then camera pushes through into the full 3D world.
- **3D -> 2D:** Reverse -- scene pulls back and flattens into the noise area rectangle.
- **Lake <-> Garden:** Gentle crossfade with camera drifting through fog/light.

### Controls (`controls.js`)

**Noise Totems:** 3D objects in the scene. Each scene defines its own totem meshes and positions. Shared logic for:
- Click/tap detection via raycasting
- Active state (glow + float animation)
- Switching noise type via AudioEngine

**Glass Overlay UI:** HTML/CSS overlay on top of the Three.js canvas:
- Translucent bar along bottom edge
- Four rounded buttons for noise types (matching totem colors)
- Play/pause button
- `backdrop-filter: blur(12px)` frosted glass effect
- Auto-hides after 3 seconds of inactivity on desktop, reappears on mouse move
- Always visible on mobile (no hover available)
- Mirrors totem state -- clicking either updates both

**View Toggle:** Small circular button in bottom-right corner:
- Shows icon hinting at the next view (flat square for 2D, wave for Lake, leaf for Garden)
- Cycles: 2D -> Lake -> Garden -> 2D
- Always visible in all views

## Color Palette

| Role | Hex |
|------|-----|
| Sky horizon | `#FF6B35` |
| Sky mid | `#F7931E` |
| Sky upper | `#C1456C` |
| Sky zenith | `#4A2545` |
| Water | `#1A3A4A` |
| Lantern glow | `#FFD685` |
| Fog/atmosphere | `#D4886B` |
| Low freq bars/aurora | `#E8632B` |
| Mid freq bars/aurora | `#E84B8A` |
| High freq bars/aurora | `#7B4BB0` |
| Totem active glow | `#FFE0A0` |
| Glass UI background | `rgba(255,255,255,0.1)` |

## File Structure

```
js/
  audio-engine.js       -- extracted shared audio API
  icons.js              -- existing SVG icons
  classes.js            -- existing 2D Marker/NoiseBox classes
  sketch.js             -- 2D view (refactored to use audio-engine)
  scenes/
    lake.js             -- Three.js Lake scene
    garden.js           -- Three.js Garden scene
    shared/
      lantern.js        -- draggable lantern with glow/bloom
      sky.js            -- Firewatch gradient sky shader
      controls.js       -- noise type totems + glass overlay UI
      transition.js     -- cinematic view transition manager
      camera.js         -- ambient drift camera controller
```

## Technology

- **p5.js 2.2.3** (CDN) -- audio engine, 2D view rendering
- **p5.sound 0.3.0** (CDN) -- Noise, LowPass, FFT, SoundFile
- **Three.js** (CDN, latest stable) -- 3D scene rendering
- **Vanilla JS** -- no frameworks, consistent with existing project
- **Sass** -- existing SCSS pipeline for glass overlay styles

## Mobile

- Touch drag for lantern interaction (pointer events, same as desktop)
- Glass overlay always visible (no auto-hide since no hover)
- Totems are slightly larger tap targets
- Scenes should target 30+ FPS on mid-range mobile devices
- Low-poly geometry and simple shaders keep GPU load reasonable

## Build Approach

Start stylized but simple (v1), design for polish (v2+):

**v1 (this spec):**
- Flat-shaded low-poly geometry
- Gradient sky with 3-4 Firewatch color bands (shader)
- Simple water plane with basic reflection
- Lantern as emissive sphere + point light
- Frequency bars as simple glowing columns / aurora as ribbon geometry
- Basic totems as primitive shapes with emissive materials

**v2+ (future iteration):**
- Layered cloud geometry in sky shader
- Volumetric fog
- God rays from lantern
- Fresnel water reflections
- Particle effects (fireflies, dust motes)
- Improved totem models
- Sound-reactive ambient environment details
