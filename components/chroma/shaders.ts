export const FULL_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const BLUR_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;

void main() {
  // separable 9-tap gaussian
  float w0 = 0.2270270270;
  float w1 = 0.1945945946;
  float w2 = 0.1216216216;
  float w3 = 0.0540540541;
  float w4 = 0.0162162162;
  vec4 c = texture2D(uTex, vUv) * w0;
  c += texture2D(uTex, vUv + uDir * 1.0) * w1;
  c += texture2D(uTex, vUv - uDir * 1.0) * w1;
  c += texture2D(uTex, vUv + uDir * 2.0) * w2;
  c += texture2D(uTex, vUv - uDir * 2.0) * w2;
  c += texture2D(uTex, vUv + uDir * 3.0) * w3;
  c += texture2D(uTex, vUv - uDir * 3.0) * w3;
  c += texture2D(uTex, vUv + uDir * 4.0) * w4;
  c += texture2D(uTex, vUv - uDir * 4.0) * w4;
  gl_FragColor = c;
}
`;

export const COMPOSITE_FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uMask;
uniform sampler2D uB0;
uniform sampler2D uB1;
uniform sampler2D uB2;
uniform sampler2D uB3;
uniform vec2  uSplit;
uniform float uBloom;
uniform vec3  uWarm;
uniform vec3  uCool;
uniform vec3  uRed;
uniform float uCore;
uniform vec3  uBg;
uniform float uThemed;
uniform float uInvert;
uniform float uNoise;
uniform float uTime;
uniform float uAspect;
uniform vec2  uResolution;
uniform float uSpectral;
uniform vec2  uCursor;
uniform float uCursorOn;
uniform float uDisperse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float wallTex(vec2 uv, vec2 res) {
  vec2 p = uv * vec2(res.x / res.y, 1.0);
  float fbm =
      vnoise(p * 2.4) * 0.55 +
      vnoise(p * 5.1 + 11.0) * 0.30 +
      vnoise(p * 11.7 + 3.0) * 0.15;

  float sheen = vnoise(p * 0.9 + 5.0);
  return (fbm - 0.5) * 0.8 + (sheen - 0.5) * 0.5;
}

float bloomAt(vec2 uv) {
  float b = 0.0;
  b += texture2D(uB0, uv).r * 0.85;
  b += texture2D(uB1, uv).r * 0.55;
  b += texture2D(uB2, uv).r * 0.22;
  b += texture2D(uB3, uv).r * 0.10;
  return b;
}

vec3 spectralTint(float u) {
  u = clamp(u, 0.0, 1.0);
  if (u < 0.5) return mix(uWarm, uRed, u * 2.0);
  return mix(uRed, uCool, (u - 0.5) * 2.0);
}

vec3 spectralFringe(vec2 uv, vec2 split) {
  // sample the bloom at several offsets across the split and tint each stop
  vec2 fromC = (uv - 0.5) * vec2(uAspect, 1.0);
  float disp = 0.6 + 0.9 * clamp(length(fromC), 0.0, 1.0);
  vec2 step = split * disp;
  vec3 acc = vec3(0.0);

  const int N = 5;
  for (int i = 0; i < N; i++) {
    float f = float(i) / float(N - 1);
    float off = (f - 0.5) * 2.0;
    float b = bloomAt(uv + step * off);
    acc += spectralTint(f) * b;
  }
  return acc / float(N);
}

void main() {
  // subtle refraction wobble
  vec2 uv = vUv;
  float wx = vnoise(uv * 4.0 + vec2(uTime * 0.13, uTime * 0.05));
  float wy = vnoise(uv * 4.0 + vec2(7.0 - uTime * 0.06, 3.0 + uTime * 0.11));
  uv += (vec2(wx, wy) - 0.5) * 0.0016;

  vec2 s = uSplit;
  float disp = uDisperse;

  // during a disperse the split gains a radial+swirl component
  vec2 fromMid = (uv - 0.5) * vec2(uAspect, 1.0);
  float rr = length(fromMid) + 0.0001;
  vec2 radial = fromMid / rr;
  float ang = uTime * 0.6;
  vec2 swirl = vec2(radial.x * cos(ang) - radial.y * sin(ang),
                    radial.x * sin(ang) + radial.y * cos(ang));

  s += mix(radial, swirl, 0.5) * disp * 0.022;
  s *= 1.0 + disp * 0.9;

  vec2 tearW = vec2(0.0), tearC = vec2(0.0), tearR = vec2(0.0);

  // cursor pool: local ripple + extra split lean
  vec2 cAsp = vec2(uAspect, 1.0);
  vec2 toCur = uv * cAsp - uCursor * cAsp;
  float cd = length(toCur);
  float pool = smoothstep(0.34, 0.0, cd) * uCursorOn;

  if (pool > 0.001) {
    vec2 rdir = toCur / max(cd, 0.0001);
    float ripple = sin(cd * 46.0 - uTime * 5.0) * pool * 0.0022;
    uv += (rdir / cAsp) * ripple;
    s += (rdir / cAsp) * pool * 0.010;
  }

  float bw = bloomAt(uv + s + tearW);
  float bc = bloomAt(uv - s + tearC);
  float br = bloomAt(uv + vec2(-s.y, s.x) * 0.6 + tearR);

  vec3 baseRaw = (uWarm * bw + uCool * bc + uRed * br);

  float specAmt = clamp(uSpectral + pool * 0.4 + disp * 0.25, 0.0, 1.0);
  vec3 raw = mix(baseRaw, spectralFringe(uv, s), specAmt * 0.55) * uBloom * (1.0 + pool * 0.9 + disp * 0.45);
  vec3 glow = vec3(1.0) - exp(-raw);

  float core = texture2D(uMask, uv).r * (1.0 - disp * 0.75);

  vec2 vc = (uv - 0.5) * vec2(uAspect, 1.0);
  float vig = smoothstep(1.05, 0.35, length(vc));
  float tex = wallTex(uv, uResolution);
  float g = hash(uv * uResolution * 0.5 + uTime);

  float ca = vnoise(uv * vec2(uAspect, 1.0) * 2.3 + vec2(uTime * 0.012, uTime * 0.008));
  float cb = vnoise(uv * vec2(uAspect, 1.0) * 3.7 - vec2(uTime * 0.009, uTime * 0.014));
  float caustic = (ca * cb - 0.25);

  vec3 rimC = vec3(uCore) * smoothstep(0.35, 0.55, core) * (1.0 - smoothstep(0.6, 0.9, core));
  vec3 glowD = glow;
  glowD += rimC;
  glowD += (g - 0.5) * uNoise * (0.4 + 0.6 * length(glowD));
  glowD *= mix(0.82, 1.0, vig);

  vec3 wallD = uBg * mix(0.82, 1.08, vig) * (1.0 + tex * 0.35) + uBg * max(tex, 0.0) * 0.25;

  vec3 causticTint = normalize(uWarm + uCool + 0.0001);
  wallD += causticTint * caustic * 0.09 * (1.0 - vig * 0.4);
  vec3 outD = wallD + glowD;

  // light mode: pressed-into-paper look
  vec3 wallL = uBg * mix(1.0, 0.94, 1.0 - vig);
  wallL += tex * 0.018;

  vec3 rawL = mix(baseRaw, spectralFringe(uv, s), specAmt * 0.55) * uBloom * (1.0 + pool * 0.9);
  vec3 glowL = vec3(1.0) - exp(-rawL);

  vec3 pressed = wallL * (vec3(1.0) - glowL * 0.9);

  float ink = smoothstep(0.4, 0.62, core);
  pressed *= mix(1.0, 0.1, ink);
  pressed += (g - 0.5) * uNoise * 0.4;
  vec3 outL = pressed;

  vec3 outc = mix(outD, outL, uInvert);
  if (uThemed > 0.5) {
    // Rebuild the chrome material from the chosen paint colors. Keep the
    // displaced bloom as a colored fringe and shade the actual letter mask.
    float splitGlow = max(max(bw, bc), br) * uBloom;
    float fringe = (abs(bw - bc) + abs(bc - br)) * uBloom;
    float halo = clamp(splitGlow * 0.7 + fringe * 0.35, 0.0, 0.86);
    vec3 paper = uBg * (0.97 + tex * 0.05);
    vec3 litPaper = mix(paper, uCool, halo);

    float sheen = 0.5 + 0.5 * sin(uv.y * 24.0 + uv.x * 4.0 + uTime * 0.55);
    float metal = 0.66 + 0.34 * smoothstep(0.2, 0.85, sheen);
    vec3 letter = uWarm * metal;
    float rim = smoothstep(0.2, 0.55, core) * (1.0 - smoothstep(0.7, 0.96, core));
    letter = mix(letter, uRed, rim * 0.38);
    outc = mix(litPaper, letter, smoothstep(0.04, 0.9, core));
  }
  gl_FragColor = vec4(outc, 1.0);
}
`;
