export interface WordPoints {
  positions: Float32Array;
  count: number;
  aspect: number;
}

export function buildWordPoints(
  word: string,
  size: number,
): WordPoints {
  const count = size * size;

  const W = 1024;
  const H = 320;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontSize = 240;
  ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  const margin = 80;
  const measured = ctx.measureText(word).width;
  if (measured > W - margin) {
    fontSize = Math.floor(fontSize * ((W - margin) / measured));
    ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
  }
  ctx.fillText(word, W / 2, H / 2);

  const data = ctx.getImageData(0, 0, W, H).data;

  const lit: [number, number][] = [];
  const stride = 2;
  for (let y = 0; y < H; y += stride) {
    for (let x = 0; x < W; x += stride) {
      const a = data[(y * W + x) * 4 + 3];
      if (a > 128) lit.push([x, y]);
    }
  }

  if (lit.length === 0) {
    for (let i = 0; i < 256; i++) lit.push([W / 2, H / 2]);
  }

  // normalise to the ink's own bounds, not the 1024x320 canvas, so the
  // camera frames the letters themselves and the word fills the card
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of lit) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const inkW = Math.max(stride, x1 - x0 + stride);
  const inkH = Math.max(stride, y1 - y0 + stride);
  const cx = (x0 + x1 + stride) / 2;
  const cy = (y0 + y1 + stride) / 2;
  const aspect = inkW / inkH;
  const positions = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // random target on the word's ink, with jitter and a lifetime seed
    const p = lit[(Math.random() * lit.length) | 0];
    const jx = (Math.random() - 0.5) * stride;
    const jy = (Math.random() - 0.5) * stride;
    const nx = ((p[0] + jx - cx) / inkH) * 2;
    const ny = -((p[1] + jy - cy) / inkH) * 2;
    const nz = (Math.random() - 0.5) * 0.08;

    positions[i * 4 + 0] = nx;
    positions[i * 4 + 1] = ny;
    positions[i * 4 + 2] = nz;
    positions[i * 4 + 3] = Math.random();
  }

  return { positions, count, aspect };
}
