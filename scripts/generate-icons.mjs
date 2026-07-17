// Generates PWA icon PNGs into public/icons/ using a neon synthwave design
import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Background — deep purple-black
  ctx.fillStyle = '#030008';
  ctx.fillRect(0, 0, size, size);

  // Neon grid lines (floor effect)
  const gridLines = 6;
  ctx.strokeStyle = '#ff007f';
  ctx.lineWidth = Math.max(1, size / 128);
  ctx.globalAlpha = 0.4;
  for (let i = 0; i <= gridLines; i++) {
    const y = cy + (i / gridLines) * cy;
    const xOff = (i / gridLines) * cx * 0.8;
    ctx.beginPath();
    ctx.moveTo(cx - xOff, y);
    ctx.lineTo(cx + xOff, y);
    ctx.stroke();
  }
  for (let i = -gridLines; i <= gridLines; i++) {
    const x = cx + (i / gridLines) * cx;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(cx, size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  // Outer ring glow
  const ringGrad = ctx.createRadialGradient(cx, cy, r * 0.72, cx, cy, r * 0.92);
  ringGrad.addColorStop(0, 'rgba(255,51,0,0.0)');
  ringGrad.addColorStop(0.5, 'rgba(255,51,0,0.55)');
  ringGrad.addColorStop(1, 'rgba(255,0,127,0.0)');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Center orb gradient (sphere illusion)
  const orbGrad = ctx.createRadialGradient(cx * 0.85, cy * 0.75, r * 0.05, cx, cy, r * 0.6);
  orbGrad.addColorStop(0, '#ffffff');
  orbGrad.addColorStop(0.15, '#ff9966');
  orbGrad.addColorStop(0.5, '#ff3300');
  orbGrad.addColorStop(0.85, '#330011');
  orbGrad.addColorStop(1, '#0a0003');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
  ctx.fill();

  // Equatorial neon ring around the orb
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = Math.max(2, size / 64);
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = size / 14;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.6, r * 0.12, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // "NP" text label at bottom
  if (size >= 96) {
    const fontSize = Math.round(size / 7);
    ctx.font = `900 ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ff3300';
    ctx.shadowColor = '#ff3300';
    ctx.shadowBlur = size / 18;
    ctx.fillText('NP', cx, size - size / 20);
    ctx.shadowBlur = 0;
  }

  writeFileSync(join(outDir, `icon-${size}.png`), canvas.toBuffer('image/png'));
  console.log(`icon-${size}.png`);
}
console.log('Done — icons in public/icons/');
