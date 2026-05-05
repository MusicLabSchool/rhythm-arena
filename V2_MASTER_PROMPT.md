# V2 MASTER PROMPT — MUSO.AI / MUSIC LAB RHYTHM ARENA

Copy/paste this into Replit / AI builder.

```txt
Build a complete browser-based rhythm game web app called:

Muso.ai / Music Lab Rhythm Arena

This is a first-person POV drum-learning rhythm game for web/mobile/desktop.

The goal is to create a playable, polished MVP that feels like:
- Rock Band / Guitar Hero rhythm highway
- Realistic POV acoustic drum kit
- Music Lab learning environment
- Proper rhythm education tool
- Smooth game-like feedback
- Browser playable on Replit

This must not feel like a generic education app.
This must not feel like a slideshow.
This must feel like a real rhythm game.

Use:
- Vite
- React
- TypeScript
- Tailwind CSS
- Zustand
- Three.js / React Three Fiber
- Tone.js or native Web Audio API
- Framer Motion for UI transitions if useful

The final app must be playable as a website/web app.

---

# 1. CORE GAME VISION

The player is seated behind a realistic acoustic drum kit in first-person view.

The player sees:
- their hands holding drumsticks
- their legs
- left foot resting on the hi-hat pedal
- right foot resting on the bass drum pedal
- snare, kick, toms, hi-hat, crash/ride cymbals
- a rhythm note highway floating above the kit
- a clear hit line above the drums
- notes travelling toward the hit line
- clean HUD showing score, combo, accuracy, BPM, lesson progress

The rhythm highway should not cover the drums.
The drums, feet and pedals must stay clearly visible.

---

# 2. NON-NEGOTIABLE DRUM ERGONOMICS

The drum set must use a real ergonomic right-handed drum kit layout.

Coordinate system:
- X = left/right from player perspective
- Y = height
- Z = forward away from player

Camera:
- seated first-person POV behind the kit
- position: [0, 1.25, -2.4]
- lookAt: [0, 0.65, 0.75]
- FOV: 60–70

Feet:
- Left foot must be on the hi-hat pedal on the viewer/player’s LEFT side.
- Right foot must be on the bass drum pedal in the centre-right, aligned with the kick drum beater.
- Feet must not be swapped.
- Feet must not be mirrored.
- Feet must not float.
- Feet must physically touch their pedal plates.
- Both shoes should point mostly forward.
- Left foot angles slightly outward left, around -10 to -20 degrees.
- Right foot points toward the kick pedal, around 0 to +8 degrees.

Pedals:
hiHatPedal:
  position: [-0.75, 0.03, -0.35]
  rotationY: -12 degrees
  controlled by leftFoot only

kickPedal:
  position: [0.18, 0.03, -0.28]
  rotationY: 4 degrees
  controlled by rightFoot only
  aligned with kick drum beater

Feet:
leftFoot:
  position: [-0.75, 0.09, -0.38]
  rotationY: -12 degrees
  rests on hiHatPedal

rightFoot:
  position: [0.18, 0.09, -0.31]
  rotationY: 4 degrees
  rests on kickPedal

Drums:
kick:
  position: [0.18, 0.48, 0.12]
  large central bass drum
  front head faces camera

snare:
  position: [-0.38, 0.62, -0.18]
  slightly left of centre, between legs

rackTomLeft:
  position: [-0.28, 0.9, 0.35]

rackTomRight:
  position: [0.32, 0.9, 0.35]

floorTom:
  position: [0.82, 0.62, -0.02]

hiHatCymbal:
  position: [-0.98, 0.95, -0.05]
  directly above hi-hat pedal line

crashLeft:
  position: [-1.15, 1.32, 0.38]

rideOrCrashRight:
  position: [1.18, 1.22, 0.22]

Non-negotiable:
- Do not swap feet.
- Do not mirror the kit.
- Do not put the left foot on the kick pedal.
- Do not put the right foot on the hi-hat pedal.
- Do not make pedals decorative only.
- Pedals must line up visually with the correct feet.
- If the kit is accidentally mirrored, treat this as a failed build.

---

# 3. VISUAL STYLE

Style:
- Premium realistic music studio
- Warm, modern, cinematic
- Not cyberpunk
- Not fantasy clutter
- Not full of characters
- Not too busy
- Not cartoonish for the core game scene
- Real drum kit must be the hero
- UI should feel polished, black glass, minimal, high contrast

Environment:
- Music Lab rhythm studio
- warm wood floor
- acoustic panels
- soft lamps
- music posters
- guitar/bass on wall
- subtle Music Lab sign
- premium modern music school feel

Avoid:
- giant magical creatures
- crowded room
- random band members
- too much neon
- fake-looking instruments
- text covering gameplay

---

# 4. RHYTHM HIGHWAY LAYOUT

The rhythm highway must float above the drum kit and end at the hit line.

It must not extend down over the drums.

Correct layout:
- Top area: HUD / lesson info
- Middle area: rhythm highway
- Hit line: just above the toms/snare area
- Bottom area: visible drums, hands, feet, pedals
- Bottom overlay: input buttons/settings only if needed

The highway should be semi-transparent and elegant.
No thick black strip covering the kit.

Mobile layout:
- Lane starts around 15–18% from top
- Lane ends around 62–68% from top
- Drums visible from 62–68% downward
- Touch buttons at bottom
- No lane plane over drum kit

Desktop landscape layout:
- Wider field of view
- Full drum kit visible
- Feet/pedals visible
- HUD distributed left/right/top
- Do not cover kit with huge panels

Implement responsive layout config.

---

# 5. LAYOUT CONFIG CODE

Create a file:

`src/game/layout/gameLayout.ts`

export type GameLayoutConfig = {
  laneStartY: number;
  laneEndY: number;
  hitLineY: number;
  drumVisibleStartY: number;
  mobileControlsStartY: number;
  laneOpacity: number;
};

export function getGameLayoutConfig(isMobile: boolean): GameLayoutConfig {
  if (isMobile) {
    return {
      laneStartY: 0.16,
      laneEndY: 0.64,
      hitLineY: 0.65,
      drumVisibleStartY: 0.64,
      mobileControlsStartY: 0.88,
      laneOpacity: 0.18,
    };
  }

  return {
    laneStartY: 0.12,
    laneEndY: 0.68,
    hitLineY: 0.68,
    drumVisibleStartY: 0.68,
    mobileControlsStartY: 0.9,
    laneOpacity: 0.22,
  };
}

---

# 6–27. (Paste the remaining sections exactly as in your full V2 prompt.)

Important final line:

This is not a generic rhythm lane game with a drum background; it is a POV drum-learning simulator where the kit ergonomics, audio timing and simultaneous limb/audio behaviour are the product.
```

