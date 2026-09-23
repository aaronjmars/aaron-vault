/**
 * Asset URL resolver. In the source project this pointed at a media CDN;
 * here the referenced plates do not exist as files, so known paths resolve
 * to procedurally generated data URLs (cached) with the right tileability.
 * Unknown paths pass through unchanged.
 */

const cache = new Map<string, string>();

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  return [c, ctx];
}

function moirePlate(): string {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = -256; i < 512; i += 4) {
    const k = (i / 4) % 8;
    ctx.strokeStyle = k < 4 ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 256, 256);
    ctx.stroke();
  }
  return c.toDataURL("image/png");
}

function grainPlate(): string {
  const [c, ctx] = makeCanvas(256);
  const img = ctx.createImageData(256, 256);
  const d = img.data;
  let seed = 0x9e3779b9;
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const v = 40 + ((seed >>> 24) % 176);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

function dustPlate(): string {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 256, 256);
  let seed = 0x1234abcD;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed >>> 8) / 16777216;
  };
  for (let i = 0; i < 900; i++) {
    const v = Math.floor(rnd() * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    const s = rnd() < 0.9 ? 1 : 2;
    ctx.fillRect(Math.floor(rnd() * 256), Math.floor(rnd() * 256), s, s);
  }
  return c.toDataURL("image/png");
}

function portraitPlate(): string {
  const [c, ctx] = makeCanvas(256);
  c.height = 320;
  const g = ctx.createLinearGradient(0, 0, 0, 320);
  g.addColorStop(0, "#f3c7b6");
  g.addColorStop(0.45, "#d9907a");
  g.addColorStop(0.55, "#8a5f9e");
  g.addColorStop(1, "#3b3350");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = "#f6d9c8";
  ctx.beginPath();
  ctx.ellipse(128, 130, 46, 58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d2438";
  ctx.beginPath();
  ctx.ellipse(128, 84, 52, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  return c.toDataURL("image/png");
}

/** Ransom-note scrap: a torn-paper square with one big dark letter.
 *  Filenames look like /vault/ransom/A-1.png (variant index drives the tint). */
function ransomScrap(path: string): string {
  const m = /([A-Za-z0-9()\].,'!?-])-(\d)\.png$/.exec(path);
  const ch = m ? m[1] : "A";
  const variant = m ? parseInt(m[2], 10) : 0;
  let seed = 0;
  for (const c of path) seed = (seed * 31 + c.charCodeAt(0)) | 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return ((seed >>> 8) & 0xffff) / 0x10000;
  };
  const S = 96;
  const [c, ctx] = makeCanvas(S);
  const paper = [
    "#efe6d2", "#e8ddc8", "#f2ead6", "#dcd2ba", "#f5efdf", "#e2d9c4",
  ][variant % 6];
  ctx.save();
  // irregular torn edge
  ctx.beginPath();
  const pts = 14;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const r = S * 0.44 * (0.9 + rnd() * 0.14);
    const x = S / 2 + Math.cos(a) * r;
    const y = S / 2 + Math.sin(a) * r * (0.92 + rnd() * 0.12);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = paper;
  ctx.shadowColor = "rgba(30,25,20,0.35)";
  ctx.shadowBlur = 6;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.clip();
  // mottling
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = `rgba(${120 + rnd() * 80 | 0},${100 + rnd() * 70 | 0},${70 + rnd() * 50 | 0},0.06)`;
    ctx.fillRect(rnd() * S, rnd() * S, 4 + rnd() * 22, 3 + rnd() * 14);
  }
  // the letter, marker-ish
  const ink = ["#26221c", "#2e2a24", "#1e2a30"][variant % 3];
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${S * 0.62}px var(--font-mondwest), Georgia, serif`;
  ctx.save();
  ctx.translate(S / 2, S * 0.54);
  ctx.rotate((rnd() - 0.5) * 0.18);
  ctx.fillText(ch, 0, 0);
  ctx.restore();
  ctx.restore();
  return c.toDataURL("image/png");
}

/** Emboss surfaces: a soft plaster bump plate and a grunge overlay. */
function plasterPlate(): string {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  const img = ctx.createImageData(S, S);
  const d = img.data;
  const val = (x: number, y: number) => {
    // tileable value noise, two octaves
    const h = (ix: number, iy: number) => {
      const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const vn = (fx: number, fy: number) => {
      const ix = Math.floor(fx), iy = Math.floor(fy);
      const tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      return (
        h(ix, iy) * (1 - sx) * (1 - sy) + h(ix + 1, iy) * sx * (1 - sy) +
        h(ix, iy + 1) * (1 - sx) * sy + h(ix + 1, iy + 1) * sx * sy
      );
    };
    const a = vn(x / 18, y / 18) * 0.65 + vn(x / 6 + 40, y / 6 + 9) * 0.35;
    return Math.round(a * 255);
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const v = val(x % S, y % S);
      const i = (y * S + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

function grungePlate(): string {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  const img = ctx.createImageData(S, S);
  const d = img.data;
  let seed = 0x51ab3f;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return ((seed >>> 9) & 0x7fffff) / 0x800000;
  };
  const grid: number[] = [];
  for (let i = 0; i < 64 * 64; i++) grid.push(rnd());
  const at = (x: number, y: number) => grid[((y & 63) * 64 + (x & 63)) % 4096];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const v = at(x >> 2, y >> 2) * 0.6 + at(x, y) * 0.4;
      const i = (y * S + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = Math.round(v * 255);
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

const GENERATORS: Record<string, () => string> = {
  "/vault/arcade-moire.webp": moirePlate,
  "/vault/arcade-grain.webp": grainPlate,
  "/vault/arcade-dust.webp": dustPlate,
  "/holo/kamila.webp": portraitPlate,
  "/vault/emboss-plaster.webp": plasterPlate,
  "/vault/emboss-grunge.webp": grungePlate,
};

export function mediaUrl(path: string): string {
  if (typeof document === "undefined") return path;
  let gen = GENERATORS[path];
  if (!gen && path.startsWith("/vault/ransom/")) gen = () => ransomScrap(path);
  if (!gen) return path;
  let hit = cache.get(path);
  if (!hit) {
    hit = gen();
    cache.set(path, hit);
  }
  return hit;
}

export function ransomUrl(file: string): string {
  return mediaUrl(`/vault/ransom/${file}`);
}

export interface VideoSource {
  src: string;
  type: string;
}

export function videoSources(base: string): VideoSource[] {
  return [
    { src: mediaUrl(`${base}.vp9.webm`), type: 'video/webm; codecs="vp9"' },
    { src: mediaUrl(`${base}.mp4`), type: "video/mp4" },
  ];
}
