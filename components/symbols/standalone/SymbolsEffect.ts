import * as THREE from "three";
import { SANDBOX_VERT, SANDBOX_FRAG } from "../shaders";
import { glyphCanvas } from "../glyphs";

export interface SymbolsParams {
  cell: number;
  bandColors: string[];
  bandStops: number[];
  bandGlyphs: number[];
  zoom?: number;
  bg?: string;
}

export class SymbolsEffect {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private uniforms: Record<string, { value: unknown }>;
  private canvas: HTMLCanvasElement;
  private srcAspect = 1;
  private video: HTMLVideoElement | null = null;
  private raf = 0;
  private reqCell: number;

  constructor(canvas: HTMLCanvasElement, p: SymbolsParams) {
    this.canvas = canvas;
    this.reqCell = p.cell;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(new THREE.Color(p.bg ?? "#ffffff"), 1);

    const glyph = (i: number) => {
      const t = new THREE.CanvasTexture(glyphCanvas(i));
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    };
    const col = p.bandColors.map((h) => new THREE.Color(h));

    this.uniforms = {
      src: { value: new THREE.Texture() },
      resolution: { value: new THREE.Vector2(1, 1) },
      srcScale: { value: new THREE.Vector2(1, 1) },
      zoom: { value: p.zoom ?? 1 },
      bgColor: { value: new THREE.Color(p.bg ?? "#ffffff") },
      cell: { value: p.cell },
      bandColor: { value: col },
      bandColorB: { value: col.map((c) => c.clone()) },
      bandLo: { value: [p.bandStops[0], p.bandStops[1], p.bandStops[2], p.bandStops[3]] },
      bandHi: { value: [p.bandStops[1], p.bandStops[2], p.bandStops[3], p.bandStops[4]] },
      glyph: { value: p.bandGlyphs.map(glyph) },
      glyphB: { value: p.bandGlyphs.map(glyph) },
      morphT: { value: 1 },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: SANDBOX_VERT,
      fragmentShader: SANDBOX_FRAG,
      uniforms: this.uniforms,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    this.resize();
  }

  private fit() {
    const r = this.canvas.getBoundingClientRect();
    const ca = r.width / Math.max(1, r.height);
    let ux = 1;
    let uy = 1;
    if (this.srcAspect > ca) ux = ca / this.srcAspect;
    else uy = this.srcAspect / ca;
    (this.uniforms.srcScale.value as THREE.Vector2).set(ux, uy);
  }

  resize = () => {
    const r = this.canvas.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    (this.uniforms.resolution.value as THREE.Vector2).set(w, h);

    this.uniforms.cell.value = Math.max(2, this.reqCell * (w / 600));
    this.fit();
    this.render();
  };

  render = () => this.renderer.render(this.scene, this.camera);

  setImage(url: string) {
    new THREE.TextureLoader().load(url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      this.uniforms.src.value = tex;
      this.srcAspect = tex.image.width / tex.image.height;
      this.video = null;
      this.fit();
      this.render();
    });
  }

  setVideo(url: string) {
    const v = document.createElement("video");
    v.src = url;
    v.loop = v.muted = v.playsInline = true;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    v.addEventListener("loadeddata", () => {
      this.uniforms.src.value = tex;
      this.srcAspect = v.videoWidth / v.videoHeight || 1;
      this.video = v;
      this.fit();
      v.play();
      this.loop();
    });
    v.load();
  }

  private loop = () => {
    if (!this.video) return;
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    this.video?.pause();
    this.renderer.dispose();
  }
}
