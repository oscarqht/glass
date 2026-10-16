import { useCallback, useId, useState, type CSSProperties } from 'react';
import {
  FluidGlass,
  FLUID_GLASS_PRESETS,
  FLUID_GLASS_SHAPES,
  type FluidGlassInteraction,
  type FluidGlassPreset,
  type FluidGlassShape
} from './components/FluidGlass';

type DemoScene = 'headline' | 'photo-night' | 'photo-day' | 'video' | 'canvas-ui';

const SCENE_OPTIONS: { value: DemoScene; label: string }[] = [
  { value: 'headline', label: 'Headline' },
  { value: 'photo-night', label: 'Night Sky' },
  { value: 'photo-day', label: 'Day Sky' },
  { value: 'video', label: 'Cloud Video' },
  { value: 'canvas-ui', label: '2D UI Grid' }
];

const PRESET_LIST = Object.keys(FLUID_GLASS_PRESETS) as FluidGlassPreset[];
const INTERACTIONS: FluidGlassInteraction[] = ['follow', 'drag', 'static'];

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (next: number) => void;
}

function SliderField({ label, value, min, max, step, unit = '', onChange }: SliderFieldProps) {
  const id = useId();
  const style = {
    '--attr-min': min,
    '--attr-max': max,
    '--control-value': value
  } as CSSProperties;

  return (
    <div className="control-row">
      <div className="control-label-line">
        <label htmlFor={id}>{label}</label>
        <span className="control-value">
          {Number.isInteger(step) ? value : value.toFixed(2)}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="demo-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${value}${unit}`}
        style={style}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function App() {
  const [remountKey, setRemountKey] = useState(0);
  const [scene, setScene] = useState<DemoScene>('headline');
  const [preset, setPreset] = useState<FluidGlassPreset>('clear');
  const [shape, setShape] = useState<FluidGlassShape>('torus');
  const [interaction, setInteraction] = useState<FluidGlassInteraction>('follow');
  const [text, setText] = useState('Look closer.');
  const [size, setSize] = useState(260);
  const [refraction, setRefraction] = useState(1);
  const [dispersion, setDispersion] = useState(0.35);
  const [frost, setFrost] = useState(0);
  const [color, setColor] = useState('#ffffff');
  const [tint, setTint] = useState(0);
  const [reflection, setReflection] = useState(1);
  const [shadow, setShadow] = useState(0.5);
  const [elevation, setElevation] = useState(0.4);
  const [smoothness, setSmoothness] = useState(0.5);
  const [wobble, setWobble] = useState(0.5);
  const [spin, setSpin] = useState(0.3);
  const [idle, setIdle] = useState(true);
  const [morphOnClick, setMorphOnClick] = useState(true);
  const [intro, setIntro] = useState(true);
  const [copied, setCopied] = useState(false);

  const applyPreset = (nextPreset: FluidGlassPreset) => {
    const p = FLUID_GLASS_PRESETS[nextPreset];
    setPreset(nextPreset);
    setRefraction(p.refraction);
    setDispersion(p.dispersion);
    setReflection(p.reflection);
    setFrost(p.frost);
    setColor(p.color);
    setTint(p.tint);
    setShadow(p.shadow);
    if (nextPreset === 'water') {
      setWobble(1);
      setSmoothness(0.75);
    } else if (nextPreset === 'heavy') {
      setElevation(1.1);
    } else {
      setWobble(0.5);
      setSmoothness(0.5);
      setElevation(0.4);
    }
  };

  const resetAll = () => {
    setScene('headline');
    setShape('torus');
    setInteraction('follow');
    setText('Look closer.');
    setSize(260);
    setSpin(0.3);
    setIdle(true);
    setMorphOnClick(true);
    setIntro(true);
    applyPreset('clear');
    setRemountKey(k => k + 1);
  };

  const renderGridBackdrop = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) => {
      // Subtle radial glow + technical grid + feature cards drawn in 2D canvas so WebGL refracts them
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        20 * dpr,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.65
      );
      grad.addColorStop(0, '#231042');
      grad.addColorStop(0.55, '#0b0418');
      grad.addColorStop(1, '#05010c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const step = 44 * dpr;
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.13)';
      ctx.lineWidth = 1 * dpr;
      for (let x = (width % step) / 2; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = (height % step) / 2; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw decorative metric pills around the canvas
      const badges = [
        { x: 0.22, y: 0.24, title: 'IOR 1.50', sub: '3-Bounce Refraction', accent: '#38bdf8' },
        { x: 0.78, y: 0.24, title: '240 Hz', sub: 'Substepped Spring', accent: '#a78bfa' },
        { x: 0.22, y: 0.78, title: 'GLSL 300 ES', sub: 'Analytical 3D SDF', accent: '#34d399' },
        { x: 0.78, y: 0.78, title: '160×160 FBO', sub: 'Caustic Shadow Pass', accent: '#fbbf24' }
      ];
      badges.forEach(b => {
        const bw = 180 * dpr;
        const bh = 64 * dpr;
        const bx = width * b.x - bw / 2;
        const by = height * b.y - bh / 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 14 * dpr);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = b.accent;
        ctx.font = `700 ${15 * dpr}px Figtree, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(b.title, bx + 16 * dpr, by + 26 * dpr);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = `500 ${12 * dpr}px Figtree, sans-serif`;
        ctx.fillText(b.sub, bx + 16 * dpr, by + 46 * dpr);
      });
    },
    []
  );

  const src =
    scene === 'photo-night'
      ? '/assets/demo/night-sky.webp'
      : scene === 'photo-day'
        ? '/assets/demo/day-sky.webp'
        : scene === 'video'
          ? '/assets/demo/cloud-flight.mp4'
          : undefined;

  const background =
    scene === 'photo-day' ? '#dbeafe' : scene === 'headline' ? '#060010' : '#05010c';
  const textColor = scene === 'photo-day' ? '#ffffff' : '#ffffff';

  const jsxSnippet = `<FluidGlass
  preset="${preset}"
  shape="${shape}"
  interaction="${interaction}"${text !== 'Look closer.' ? `\n  text=${JSON.stringify(text)}` : ''}${src ? `\n  src="${src}"` : ''}
  size={${size}}
  refraction={${refraction}}
  dispersion={${dispersion}}
  frost={${frost}}
  reflection={${reflection}}
  shadow={${shadow}}
  elevation={${elevation}}
  smoothness={${smoothness}}
  wobble={${wobble}}
  spin={${spin}}${tint > 0 ? `\n  color="${color}"\n  tint={${tint}}` : ''}${!idle ? '\n  idle={false}' : ''}${!morphOnClick ? '\n  morphOnClick={false}' : ''}
/>`;

  const copySnippet = () => {
    navigator.clipboard.writeText(jsxSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="demo-shell">
      <header className="demo-header">
        <div className="demo-title-group">
          <h1>
            FluidGlass
            <span className="demo-badge">WebGL2 SDF Raymarcher</span>
          </h1>
          <p className="demo-subtitle">
            Move your cursor inside the stage, click the glass to morph shapes, or switch to{' '}
            <strong>Drag</strong> mode to throw &amp; bounce it off the walls.
          </p>
        </div>
        <div className="demo-header-actions">
          <button
            type="button"
            className="demo-btn"
            onClick={() => setRemountKey(k => k + 1)}
            title="Replay intro animation"
          >
            Replay Intro
          </button>
          <button type="button" className="demo-btn demo-btn--primary" onClick={resetAll}>
            Reset Defaults
          </button>
        </div>
      </header>

      <div className="demo-layout">
        <div>
          <div className="stage-card">
            <div className="stage-viewport">
              <FluidGlass
                key={remountKey}
                preset={preset}
                text={text}
                textColor={textColor}
                src={src}
                background={background}
                renderBackdrop={scene === 'canvas-ui' ? renderGridBackdrop : undefined}
                backdropKey={scene}
                shape={shape}
                onShapeChange={setShape}
                interaction={interaction}
                size={size}
                refraction={refraction}
                dispersion={dispersion}
                frost={frost}
                color={color}
                tint={tint}
                reflection={reflection}
                shadow={shadow}
                elevation={elevation}
                smoothness={smoothness}
                wobble={wobble}
                spin={spin}
                idle={idle}
                morphOnClick={morphOnClick}
                intro={intro}
              >
                <div className="stage-hud">
                  <span className="stage-pill">
                    <span className="stage-dot" />
                    Shape: <strong>{shape}</strong> · Preset: <strong>{preset}</strong>
                  </span>
                  <span className="stage-pill">
                    {interaction === 'follow'
                      ? 'Cursor Follow'
                      : interaction === 'drag'
                        ? 'Drag & Throw Enabled'
                        : 'Static Anchor'}
                  </span>
                </div>
              </FluidGlass>
            </div>
          </div>

          <div className="code-card">
            <div className="code-card-header">
              <span className="section-heading">Live Component Usage</span>
              <button type="button" className="demo-btn" onClick={copySnippet}>
                {copied ? 'Copied!' : 'Copy JSX'}
              </button>
            </div>
            <pre className="code-pre">
              <code>{jsxSnippet}</code>
            </pre>
          </div>
        </div>

        <aside className="controls-panel" aria-label="FluidGlass Controls">
          <div className="control-section">
            <h2 className="section-heading">Backdrop Scene</h2>
            <div className="chip-grid">
              {SCENE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className="chip-btn"
                  aria-pressed={scene === opt.value}
                  onClick={() => setScene(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="control-row">
              <label htmlFor="headline-input" className="control-label-line">
                <span>Backdrop Text (supports \n)</span>
              </label>
              <input
                id="headline-input"
                type="text"
                className="text-input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Look closer."
              />
            </div>
          </div>

          <div className="control-section">
            <h2 className="section-heading">Material Preset</h2>
            <div className="chip-grid">
              {PRESET_LIST.map(name => (
                <button
                  key={name}
                  type="button"
                  className="chip-btn"
                  aria-pressed={preset === name}
                  onClick={() => applyPreset(name)}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h2 className="section-heading">3D SDF Shape</h2>
            <div className="chip-grid">
              {FLUID_GLASS_SHAPES.map(s => (
                <button
                  key={s}
                  type="button"
                  className="chip-btn"
                  aria-pressed={shape === s}
                  onClick={() => setShape(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h2 className="section-heading">Interaction Mode</h2>
            <div className="chip-grid">
              {INTERACTIONS.map(mode => (
                <button
                  key={mode}
                  type="button"
                  className="chip-btn"
                  aria-pressed={interaction === mode}
                  onClick={() => setInteraction(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <h2 className="section-heading">Optics &amp; Shader</h2>
            <SliderField
              label="Size"
              value={size}
              min={120}
              max={420}
              step={10}
              unit="px"
              onChange={setSize}
            />
            <SliderField
              label="Refraction"
              value={refraction}
              min={0}
              max={2}
              step={0.05}
              onChange={setRefraction}
            />
            <SliderField
              label="Dispersion (Rainbow)"
              value={dispersion}
              min={0}
              max={1}
              step={0.05}
              onChange={setDispersion}
            />
            <SliderField
              label="Frost (Blur)"
              value={frost}
              min={0}
              max={1}
              step={0.05}
              onChange={setFrost}
            />
            <SliderField
              label="Reflection"
              value={reflection}
              min={0}
              max={2}
              step={0.05}
              onChange={setReflection}
            />
            <SliderField
              label="Caustic Shadow"
              value={shadow}
              min={0}
              max={1}
              step={0.05}
              onChange={setShadow}
            />
            <SliderField
              label="Elevation"
              value={elevation}
              min={0}
              max={1.5}
              step={0.05}
              onChange={setElevation}
            />
            <div className="color-row">
              <span className="control-label-line">Glass Color</span>
              <label className="color-picker-wrap">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                <span className="control-value">{color}</span>
              </label>
            </div>
            <SliderField
              label="Tint Absorption"
              value={tint}
              min={0}
              max={1}
              step={0.05}
              onChange={setTint}
            />
          </div>

          <div className="control-section">
            <h2 className="section-heading">Physics &amp; Motion</h2>
            <SliderField
              label="Smoothness"
              value={smoothness}
              min={0}
              max={1}
              step={0.05}
              onChange={setSmoothness}
            />
            <SliderField
              label="Liquid Wobble"
              value={wobble}
              min={0}
              max={1}
              step={0.05}
              onChange={setWobble}
            />
            <SliderField
              label="Spin Speed"
              value={spin}
              min={-1.5}
              max={1.5}
              step={0.05}
              onChange={setSpin}
            />
            <div className="toggle-grid">
              <label className="toggle-item">
                <span>Idle</span>
                <input type="checkbox" checked={idle} onChange={e => setIdle(e.target.checked)} />
              </label>
              <label className="toggle-item">
                <span>Click Morph</span>
                <input
                  type="checkbox"
                  checked={morphOnClick}
                  onChange={e => setMorphOnClick(e.target.checked)}
                />
              </label>
              <label className="toggle-item">
                <span>Intro</span>
                <input type="checkbox" checked={intro} onChange={e => setIntro(e.target.checked)} />
              </label>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
