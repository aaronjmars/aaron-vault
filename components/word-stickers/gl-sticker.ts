/**
 * StickerGL - the support module the engine expects but the source didn't ship.
 * WebGL1 textured-quad renderer: one program, one quad per sticker, with a
 * grab-corner peel (foreshortening + lift + shading) and a soft contact shadow
 * drawn from the sticker's own alpha.
 */

const VERT = `
attribute vec2 aPos;
uniform vec2 uRes;
uniform vec4 uRect;
uniform float uScale;
uniform vec2 uAnchor;
uniform vec2 uGrab;
uniform float uPeel;
uniform float uElevation;
uniform float uPullback;
varying vec2 vUV;
varying float vZ;

void main() {
  vUV = aPos * 0.5 + 0.5;

  vec2 dir = uGrab - uAnchor;
  float dm = max(length(dir), 1e-4);
  dir /= dm;

  vec2 p = aPos * 0.5 * uScale;

  float theta = uPeel * 0.95;
  float s = dot(p, dir);
  float z = max(s, 0.0) * sin(theta);
  vec2 laid = p - dir * s + dir * (s * cos(theta));
  vec2 q = p * (1.0 - uPeel * uPullback) + laid * (uPeel * uPullback);
  q -= dir * z * uPullback * uPeel;
  vZ = z;

  vec2 center = uRect.xy + uRect.zw * 0.5;
  vec2 px = center + q * uRect.zw;
  px.y -= z * uRect.w * uElevation * uPeel;

  vec2 clip = (px / uRes) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform float uMode;
uniform float uShade;
varying vec2 vUV;
varying float vZ;

void main() {
  vec4 t = texture2D(uTex, vUV);
  if (t.a < 0.02) discard;
  if (uMode > 0.5) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, t.a * 0.32 * uShade);
  } else {
    float light = 1.0 + vZ * 0.55 - max(-vZ, 0.0) * 0.2;
    gl_FragColor = vec4(t.rgb * clamp(light, 0.0, 1.4), t.a);
  }
}
`;

export interface DrawStickerOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  scale: number;
  grabU: number;
  grabV: number;
  anchorU: number;
  anchorV: number;
  fraction: number;
  elevation: number;
  pullback: number;
  dragOffX: number;
  dragOffY: number;
  tex: WebGLTexture;
}

export class StickerGL {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private quad: WebGLBuffer | null = null;
  private loc: Record<string, WebGLUniformLocation | null> = {};
  private ok = false;
  private w = 1;
  private h = 1;

  constructor() {
    this.canvas = document.createElement("canvas");
    Object.assign(this.canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    const gl = this.canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    this.gl = gl;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(sh) || "compile failed");
      }
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      return;
    }
    this.prog = prog;
    gl.useProgram(prog);
    for (const u of [
      "uRes", "uRect", "uScale", "uAnchor", "uGrab", "uPeel", "uElevation",
      "uPullback", "uTex", "uMode", "uShade",
    ]) {
      this.loc[u] = gl.getUniformLocation(prog, u);
    }
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.ok = true;
  }

  get available() {
    return this.ok;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = Math.max(1, Math.round(w * dpr));
    this.h = Math.max(1, Math.round(h * dpr));
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    if (this.ok) this.gl!.viewport(0, 0, this.w, this.h);
  }

  makeTexture(art: HTMLCanvasElement, _cssW: number, _cssH: number): { tex: WebGLTexture } {
    void _cssW;
    void _cssH;
    const gl = this.gl!;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return { tex };
  }

  beginFrame() {
    if (!this.ok) return;
    const gl = this.gl!;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  drawSticker(o: DrawStickerOpts) {
    if (!this.ok) return;
    const gl = this.gl!;
    gl.useProgram(this.prog!);
    gl.uniform2f(this.loc.uRes, this.w, this.h);

    // contact shadow first (offset, no peel geometry)
    const shadowOff = 3 + o.fraction * 6;
    gl.uniform1f(this.loc.uMode, 1);
    gl.uniform1f(this.loc.uShade, 0.6 + o.fraction * 0.8);
    gl.uniform4f(this.loc.uRect, o.x + shadowOff, o.y + shadowOff, o.w * o.scale, o.h * o.scale);
    gl.uniform1f(this.loc.uScale, 1);
    gl.uniform2f(this.loc.uAnchor, 0, 0);
    gl.uniform2f(this.loc.uGrab, 0, 0);
    gl.uniform1f(this.loc.uPeel, 0);
    gl.uniform1f(this.loc.uElevation, 0);
    gl.uniform1f(this.loc.uPullback, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, o.tex);
    gl.uniform1i(this.loc.uTex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // the sticker itself
    gl.uniform1f(this.loc.uMode, 0);
    gl.uniform4f(this.loc.uRect, o.x + o.dragOffX, o.y + o.dragOffY, o.w * o.scale, o.h * o.scale);
    gl.uniform2f(this.loc.uAnchor, o.anchorU - 0.5, 0.5 - o.anchorV);
    gl.uniform2f(this.loc.uGrab, o.grabU - 0.5, 0.5 - o.grabV);
    gl.uniform1f(this.loc.uPeel, o.fraction);
    gl.uniform1f(this.loc.uElevation, o.elevation);
    gl.uniform1f(this.loc.uPullback, o.pullback);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  destroy() {
    if (!this.ok) return;
    this.gl!.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
