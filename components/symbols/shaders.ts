export const SANDBOX_VERT = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const SANDBOX_FRAG = `
precision highp float;
varying vec2 vUv;

uniform sampler2D src;
uniform vec2 resolution;
uniform vec2 srcScale;
uniform float zoom;
uniform vec3 bgColor;
uniform float cell;

uniform vec3 bandColor[4];
uniform vec3 bandColorB[4];
uniform float bandLo[4];
uniform float bandHi[4];
uniform sampler2D glyph[4];
uniform sampler2D glyphB[4];
uniform float morphT;

float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

vec2 cover(vec2 uv) {
  return (uv - 0.5) * srcScale / zoom + 0.5;
}

vec2 cellUV(vec2 step) {
  return floor(vUv / step) * step + step * 0.5;
}

vec4 sampleGlyph(int i, vec2 uv) {
  if (i == 0) return texture2D(glyph[0], uv);
  if (i == 1) return texture2D(glyph[1], uv);
  if (i == 2) return texture2D(glyph[2], uv);
  return texture2D(glyph[3], uv);
}
vec4 sampleGlyphB(int i, vec2 uv) {
  if (i == 0) return texture2D(glyphB[0], uv);
  if (i == 1) return texture2D(glyphB[1], uv);
  if (i == 2) return texture2D(glyphB[2], uv);
  return texture2D(glyphB[3], uv);
}

void main() {
  vec3 paper = bgColor;
  vec2 step = vec2(cell) / resolution;

  vec2 suv = cover(cellUV(step));
  vec2 inset = 1.0 / resolution;
  if (suv.x < inset.x || suv.x > 1.0 - inset.x ||
      suv.y < inset.y || suv.y > 1.0 - inset.y) {
    gl_FragColor = vec4(bgColor, 1.0);
    return;
  }
  float l = lum(texture2D(src, suv).rgb);

  gl_FragColor = vec4(paper, 1.0);
  for (int i = 0; i < 4; i++) {
    if (l >= bandLo[i] && l <= bandHi[i]) {
      vec2 gUv = mod(vUv / step, vec2(1.0));

      vec4 gA = sampleGlyph(i, gUv);
      vec4 gB = sampleGlyphB(i, gUv);
      float a = mix(gB.a, gA.a, morphT);
      vec3 gcol = mix(gB.rgb, gA.rgb, morphT);
      vec3 col = mix(bandColorB[i], bandColor[i], morphT);
      vec3 sym = mix(vec3(1.0), gcol, a);
      float k = smoothstep(0.0, 1.0, lum(sym));
      gl_FragColor = vec4(mix(col, paper, k), 1.0);
    }
  }
}
`;
