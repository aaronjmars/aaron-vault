export const FULL_VERT = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const TRAIL_FRAG = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uMask;
uniform vec2  uResolution;
uniform float uAspect;

uniform float uEchoes;
uniform float uStep;
uniform float uAlpha;
uniform vec2  uFall;
uniform float uZStep;

uniform vec2  uMagnet;
uniform float uMagnetOn;
uniform float uSwing;

uniform float uTurb;
uniform float uSpread;
uniform float uEdge;
uniform float uFringe;

uniform vec2  uAnchor;
uniform float uYaw;
uniform float uPitch;
uniform float uFocal;

uniform vec3  uTrailHead;
uniform vec3  uTrailTail;
uniform vec3  uBleed;
uniform vec3  uHalo;
uniform vec3  uCore;
uniform vec3  uBg;
uniform vec3  uPoolA;
uniform vec3  uPoolB;
uniform float uPoolAlphaA;
uniform float uPoolAlphaB;
uniform vec3  uVignette;
uniform float uSubtract;
uniform float uSoft;
uniform float uNoise;
uniform float uTime;
uniform vec2  uHaloShift;
uniform vec2  uWordShift;

float maskAt(vec2 uv, float z, float grow) {
  vec2 p = uv - uAnchor;
  p.x *= uAspect;

  float s = (uFocal + z) / uFocal;
  p *= s;

  p /= max(0.001, grow);

  float cy = max(0.001, cos(uYaw));
  float cp = max(0.001, cos(uPitch));
  p.x /= cy;
  p.y /= cp;

  p.x /= uAspect;
  vec2 t = p + uAnchor;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return 0.0;
  return texture2D(uMask, t).a;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  const int SAMPLES = 48;

  float px = 1.0 / 620.0;
  vec2 fall = uFall * uStep * px;
  float perSample = uEchoes / float(SAMPLES);

  float zPer = uZStep * px;

  float dens = 0.0;
  float ramp = 0.0;
  float wsum = 0.0;

  float firstHit = 1e9;

  for (int i = 1; i <= SAMPLES; i++) {
    float fi = float(i) * perSample;
    float t  = fi / max(1.0, uEchoes);

    vec2 off = fall * fi;

    vec2 toCur = uMagnet - uAnchor;
    toCur.x *= uAspect;

    float grip = uMagnetOn / (1.0 + dot(toCur, toCur) * 5.0);
    off += toCur * (t * t * grip * 0.55);

    float z = zPer * fi * (1.0 + uSwing * (1.0 - t));

    float wob = sin(fi * 0.105 + uTime * 1.25)
              * sin(fi * 0.037 - uTime * 0.71 + 2.1);
    off += vec2(wob, wob * 0.35) * (t * t * uTurb * px);

    float grow = 1.0 + t * uSpread;

    float m = maskAt(uv - off, z, grow);
    if (m > 0.0) {

      float k = 1.0 - pow(1.0 - uAlpha * m, perSample);

      dens += k * (1.0 - dens);
      ramp += t * k;
      wsum += k;
      firstHit = min(firstHit, fi);
    }
  }
  float q = wsum > 0.0 ? ramp / wsum : 0.0;

  float edge = firstHit < 1.0e8 ? exp(-firstHit * 0.085) * uEdge : 0.0;

  float bleed = maskAt(uv - uWordShift, 0.0, 1.055);
  float halo  = maskAt(uv - uWordShift * 0.45, 0.0, 1.018);
  float core  = maskAt(uv, 0.0, 1.0);

  vec2 pc = uv - uAnchor - uHaloShift;
  pc.x *= uAspect;
  float pd = length(pc) / 0.52;
  float pool = 1.0 - clamp(pd, 0.0, 1.0);
  pool *= pool;

  float qr = clamp(q + uFringe, 0.0, 1.0);
  float qb = clamp(q - uFringe, 0.0, 1.0);
  vec3 trailCol = vec3(
    mix(uTrailHead.r, uTrailTail.r, qr),
    mix(uTrailHead.g, uTrailTail.g, q),
    mix(uTrailHead.b, uTrailTail.b, qb)
  );

  vec3 add = uBg;
  add += uPoolA * pool * uPoolAlphaA;
  add += uPoolB * pool * uPoolAlphaB;
  add += trailCol * dens;

  add += mix(trailCol, uCore, 0.5) * edge * dens;
  add += uBleed * bleed * 0.16 * uSoft;
  add += uHalo  * halo  * 0.32 * uSoft;
  add += uCore  * core  * 0.95;

  vec3 sub = uBg;
  sub = mix(sub, sub * uPoolA, pool * uPoolAlphaA);
  sub = mix(sub, sub * uPoolB, pool * uPoolAlphaB);
  sub *= mix(vec3(1.0), trailCol, dens);

  sub *= mix(vec3(1.0), trailCol, edge * dens * 0.5);
  sub *= mix(vec3(1.0), uBleed, bleed * 0.16 * uSoft);
  sub *= mix(vec3(1.0), uHalo,  halo  * 0.32 * uSoft);
  sub *= mix(vec3(1.0), uCore,  core  * 0.95);

  vec3 col = mix(add, sub, uSubtract);

  vec2 vc = uv - vec2(0.5, 0.45);
  vc.x *= uAspect;
  float vd = clamp((length(vc) - 0.16) / 0.56, 0.0, 1.0);
  col *= mix(vec3(1.0), uVignette, vd);

  float n = hash(gl_FragCoord.xy + vec2(uTime * 60.0)) - 0.5;
  float grainAmt = uNoise * (0.35 + 1.5 * max(dens, core));
  col += n * grainAmt * mix(1.0, -1.0, uSubtract);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
