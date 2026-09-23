export type Content = {
  word: string;
  svg: string | null;
};

export async function makeContentField(
  content: Content,
  blurPx: number,
  w: number,
  h: number,
  fontFamily: string,
): Promise<HTMLCanvasElement> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));

  const crisp = document.createElement("canvas");
  crisp.width = W;
  crisp.height = H;
  const cx = crisp.getContext("2d")!;
  cx.clearRect(0, 0, W, H);

  if (content.svg && content.svg.trim()) {
    await drawSvg(cx, content.svg, W, H, 0.5, 0.5, 0.52);
  } else if (content.word.trim()) {
    drawWord(cx, content, W, H, fontFamily, 0.5, 0.36);
  }

  const soft = document.createElement("canvas");
  soft.width = W;
  soft.height = H;
  const sx = soft.getContext("2d")!;
  sx.filter = `blur(${Math.max(0.5, blurPx).toFixed(2)}px)`;
  sx.drawImage(crisp, 0, 0);
  sx.filter = "none";

  // pack: R = crisp coverage (the pressed face), G = blurred coverage (the bevel ramp)
  const out = document.createElement("canvas");
  out.width = W;
  out.height = H;
  const ox = out.getContext("2d")!;
  const c = cx.getImageData(0, 0, W, H).data;
  const s = sx.getImageData(0, 0, W, H).data;
  const packed = ox.createImageData(W, H);
  const p = packed.data;
  for (let i = 0; i < p.length; i += 4) {
    p[i] = c[i + 3];
    p[i + 1] = s[i + 3];
    p[i + 2] = 0;
    p[i + 3] = 255;
  }
  ox.putImageData(packed, 0, 0);
  return out;
}

function drawWord(
  ctx: CanvasRenderingContext2D,
  content: Content,
  W: number,
  H: number,
  fontFamily: string,
  cyFrac: number,
  capFrac: number,
) {
  const text = content.word;
  if (!text) return;
  const cx = W / 2;
  const cy = H * cyFrac;
  const maxW = W * 0.82;

  let size = H * capFrac;
  ctx.font = `800 ${size}px ${fontFamily}`;
  const wWidth = ctx.measureText(text).width;
  if (wWidth > maxW) {
    size *= maxW / wWidth;
    ctx.font = `800 ${size}px ${fontFamily}`;
  }
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

async function drawSvg(
  ctx: CanvasRenderingContext2D,
  svg: string,
  W: number,
  H: number,
  cxFrac: number,
  cyFrac: number,
  sizeFrac: number,
): Promise<void> {
  // force everything white so the mask is pure coverage
  const forced = svg.replace(
    /<svg([^>]*)>/i,
    `<svg$1><style>*{fill:#fff!important;stroke:#fff!important}</style>`,
  );
  const blob = new Blob([forced], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const target = H * sizeFrac;
    const ar = img.width / Math.max(1, img.height);
    let dh = target;
    let dw = target * ar;
    const maxW = W * 0.82;
    if (dw > maxW) {
      dw = maxW;
      dh = dw / ar;
    }
    ctx.drawImage(img, W * cxFrac - dw / 2, H * cyFrac - dh / 2, dw, dh);
  } catch {
    // a broken SVG just contributes nothing
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

export const BUILTIN_SVGS: { id: string; name: string; svg: string }[] = [
  {
    id: "sparkle",
    name: "Sparkle",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 2 L58 40 L96 50 L58 60 L50 98 L42 60 L4 50 L42 40 Z" fill="#000"/><path d="M78 8 L82 22 L96 26 L82 30 L78 44 L74 30 L60 26 L74 22 Z" fill="#000"/></svg>`,
  },
  {
    id: "star",
    name: "Star",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 L61 37 L96 38 L68 59 L78 93 L50 72 L22 93 L32 59 L4 38 L39 37 Z" fill="#000"/></svg>`,
  },
  {
    id: "heart",
    name: "Heart",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 88 C18 64 6 46 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 46 82 64 50 88 Z" fill="#000"/></svg>`,
  },
  {
    id: "bolt",
    name: "Bolt",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M58 4 L20 56 L44 56 L38 96 L80 40 L54 40 Z" fill="#000"/></svg>`,
  },
  {
    id: "flower",
    name: "Flower",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#000"><ellipse cx="50" cy="20" rx="14" ry="20"/><ellipse cx="50" cy="80" rx="14" ry="20"/><ellipse cx="20" cy="50" rx="20" ry="14"/><ellipse cx="80" cy="50" rx="20" ry="14"/><ellipse cx="29" cy="29" rx="13" ry="18" transform="rotate(-45 29 29)"/><ellipse cx="71" cy="29" rx="13" ry="18" transform="rotate(45 71 29)"/><ellipse cx="29" cy="71" rx="13" ry="18" transform="rotate(45 29 71)"/><ellipse cx="71" cy="71" rx="13" ry="18" transform="rotate(-45 71 71)"/><circle cx="50" cy="50" r="14"/></g></svg>`,
  },
  {
    id: "sun",
    name: "Sun",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="#000"><circle cx="50" cy="50" r="24"/><g stroke="#000" stroke-width="7" stroke-linecap="round"><line x1="50" y1="4" x2="50" y2="18"/><line x1="50" y1="82" x2="50" y2="96"/><line x1="4" y1="50" x2="18" y2="50"/><line x1="82" y1="50" x2="96" y2="50"/><line x1="17" y1="17" x2="27" y2="27"/><line x1="73" y1="73" x2="83" y2="83"/><line x1="17" y1="83" x2="27" y2="73"/><line x1="73" y1="27" x2="83" y2="17"/></g></g></svg>`,
  },
  {
    id: "flame",
    name: "Flame",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 4 C56 22 74 30 74 50 C74 64 66 72 62 76 C66 64 62 58 56 54 C58 68 50 74 50 84 C50 92 44 96 38 96 C30 96 24 90 24 80 C24 66 34 62 36 48 C28 54 26 60 26 66 C20 58 18 50 20 42 C24 26 44 22 50 4 Z" fill="#000"/></svg>`,
  },
  {
    id: "blob",
    name: "Blob",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M46 6 C70 2 96 20 94 48 C92 74 72 96 46 94 C20 92 4 72 6 46 C8 22 24 10 46 6 Z" fill="#000"/></svg>`,
  },
  {
    id: "moon",
    name: "Moon",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M62 4 C36 10 20 30 20 52 C20 76 38 94 62 96 C40 86 30 70 30 50 C30 30 42 14 62 4 Z" fill="#000"/></svg>`,
  },
  {
    id: "arrow",
    name: "Arrow",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M6 42 L60 42 L60 20 L96 50 L60 80 L60 58 L6 58 Z" fill="#000"/></svg>`,
  },
  {
    id: "target",
    name: "Target",
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="#000"><circle cx="50" cy="50" r="44" stroke-width="10"/><circle cx="50" cy="50" r="24" stroke-width="10"/></g><circle cx="50" cy="50" r="8" fill="#000"/></svg>`,
  },
];
