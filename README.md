# FluidGlass — Zero-Dependency WebGL2 SDF Refraction Component

A self-contained, zero-dependency React component implementing real-time 3D **Signed Distance Field (SDF) raymarched glass** with multi-bounce internal refraction, chromatic dispersion, caustic shadows, and 240Hz substepped liquid spring physics — plus an interactive playground demo.

## Quick Start (Interactive Demo)

```bash
npm install --include=dev
npm run dev
```

## Drop-In Component Variants (`src/components/FluidGlass/`)

Copy `src/components/FluidGlass` into any React, Vite, or Next.js project (`react` is the only peer dependency):

- **`FluidGlass.tsx` + `FluidGlass.css`** — TypeScript + CSS (default export via `index.ts`)
- **`FluidGlass.tw.tsx`** — Single-file TypeScript + Tailwind CSS (no `.css` file required)
- **`FluidGlass.jsx` + `FluidGlass.css`** — JavaScript + CSS

### Example Usage

```tsx
import { FluidGlass } from './components/FluidGlass';

export function Example() {
  return (
    <FluidGlass
      preset="rainbow" // 'clear' | 'frosted' | 'amber' | 'ice' | 'rainbow' | 'water' | 'heavy'
      shape="torus"    // 'lens' | 'blob' | 'cube' | 'pill' | 'torus' | 'prism' | 'diamond'
      interaction="follow" // 'follow' | 'drag' | 'static'
      text={"Look\ncloser."}
      src="/assets/demo/night-sky.webp"
      size={280}
      morphOnClick
      style={{ width: '100%', height: '560px', borderRadius: '20px' }}
    />
  );
}
```

### Custom 2D Canvas Backdrop (`renderBackdrop`)

In addition to `text` and `src` (images or `.mp4`/`.webm` videos), you can draw custom 2D canvas scenes behind the glass via `renderBackdrop`:

```tsx
<FluidGlass
  preset="ice"
  shape="lens"
  interaction="drag"
  text=""
  renderBackdrop={(ctx, width, height, dpr) => {
    // Anything drawn onto ctx is uploaded with mipmaps and refracted in 3D
  }}
/>
```

## How It Works Under the Hood

1. **Offscreen Backdrop Texture Pipeline (`uMedia` + `uText`)**: Because browser security prevents WebGL shaders from reading live DOM pixels underneath a `<canvas>`, `FluidGlass` renders headline typography (`drawText`) and optional custom 2D canvas content (`renderBackdrop`) into a mipmapped WebGL texture (`uText`) and composites it with an optional image/video texture (`uMedia`).
2. **Analytical 3D SDF Shapes & Morphing**: 7 analytical 3D signed distance fields (`lens`, `blob`, `cube`, `pill`, `torus`, `prism`, `diamond`) are morphed via `mix(shapeA(p), shapeB(p), uMorph)` with a transient sinusoidal surface ripple (`uRipple`). Shaders are compiled per shape-pair on the background thread using `KHR_parallel_shader_compile`.
3. **Two-Pass Raymarching**:
   - **Pass 1 (`160×160` FBO)**: Raymarches toward the directional light to compute soft shadow occlusion (`.r`) and focused interior refractive caustics (`.g`).
   - **Pass 2 (Full-Screen Triangle)**: Raymarches up to 96 steps to hit the front surface, then traces up to **3 internal bounces** (`refract` + total internal `reflect`), splits R/G/B exit rays by shifted IOR (`uDispersion`) for rainbow edge fringes, applies Beer-Lambert exponential color absorption (`uTint`), and layers Schlick Fresnel studio reflections.
4. **240Hz Substepped Spring Physics**: Integrates cursor follow, drag-and-throw wall bounces, and idle drift at `>= 240Hz` substeps with volume-preserving velocity stretch (`sx`) and perpendicular squash (`1 / sqrt(sx)`).
