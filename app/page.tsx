"use client";

import { useState } from "react";
import { setAnimationTheme, type AnimationTheme } from "../lib/animation-theme";

import WarpTypeCard from "../components/warp-type/WarpTypeCard";
import FlipTypeCard from "../components/flip-type/FlipTypeCard";
import CloudTypeCard from "../components/cloud-type/CloudTypeCard";
import EclipseGridCard from "../components/eclipse-grid/EclipseGridCard";
import ShutterTypeCard from "../components/shutter-type/ShutterTypeCard";
import PopTypeCard from "../components/pop-type/PopTypeCard";
import MisprintTypeCard from "../components/misprint-type/MisprintTypeCard";
import VerbTypeCard from "../components/verb-type/VerbTypeCard";
import RippleGridCard from "../components/ripple-grid/RippleGridCard";
import FloodTypeCard from "../components/flood-type/FloodTypeCard";
import PhaseTableCard from "../components/phase-table/PhaseTableCard";
import SwingTypeCard from "../components/swing-type/SwingTypeCard";
import SprayBurstCard from "../components/spray-burst/SprayBurstCard";
import RushTypeCard from "../components/rush-type/RushTypeCard";
import InkFloodCard from "../components/ink-flood/InkFloodCard";
import BondTypeCard from "../components/bond-type/BondTypeCard";
import DashCascadeCard from "../components/dash-cascade/DashCascadeCard";
import WildTypeCard from "../components/wild-type/WildTypeCard";
import LoudBurstCard from "../components/loud-burst/LoudBurstCard";
import StampTypeCard from "../components/stamptype/StampTypeCard";
import FlowerLatticeCard from "../components/flower-lattice/FlowerLatticeCard";
import RealitySplitCard from "../components/reality-split/RealitySplitCard";
import CheckerConveyorCard from "../components/checker-conveyor/CheckerConveyorCard";
import GlassTypeCard from "../components/glass-type/GlassTypeCard";
import SunsetSlamCard from "../components/sunset-slam/SunsetSlamCard";
import OrbitCard from "../components/orbit/OrbitCard";
import WordCarouselCard from "../components/word-carousel/WordCarouselCard";
import SlideStackCard from "../components/slide-stack/SlideStackCard";
import SpikeTypeCard from "../components/spiketype/SpikeTypeCard";
import DotGlobeCard from "../components/dotglobe/DotGlobeCard";
import ArcadePlayground from "../components/arcade/playground";
import CodeTrailCard from "../components/code-trail/CodeTrailCard";
import GlitchWordCard from "../components/glitch-word/GlitchWordCard";
import DatamoshCard from "../components/datamosh/DatamoshCard";
import SiriWaveCard from "../components/siri-wave/SiriWaveCard";
import SmearCard from "../components/smear/SmearCard";
import DotCutCard from "../components/dotcut/DotCutCard";
import BadgeTrailCard from "../components/badge-trail/BadgeTrailCard";
import BlurGlowCard from "../components/blur-glow/BlurGlowCard";
import TextRevealCard from "../components/text-reveal/TextRevealCard";
import BlurRevealCard from "../components/blur-reveal/BlurRevealCard";
import WordStickersCard from "../components/word-stickers/WordStickersCard";
import KineticACard from "../components/kinetic-a/KineticACard";
import RansomNotePlayground from "../components/ransom/playground";
import ChromaGlowPlayground from "../components/chroma/playground";
import EmbossPlayground from "../components/emboss/playground";
import DesignTilesCard from "../components/design-tiles/DesignTilesCard";
import AsciiWordmarkCard from "../components/ascii-wordmark/AsciiWordmarkCard";
import PixelScanCard from "../components/pixel-scan/PixelScanCard";
import TileFieldCard from "../components/tile-field/TileFieldCard";
import SvgEditorPlayground from "../components/svg-editor/playground";
import SymbolsPlayground from "../components/symbols/playground";
import TyperPlayground from "../components/typer/playground";
import GLGuard from "../components/gl-guard";
import CopySourceButton from "../components/copy-source-button";

const SECTIONS: { title: string; node: React.ReactNode; entry: string }[] = [
  { title: "Warp - six cuts, the verb does the work", node: <WarpTypeCard />, entry: "components/warp-type/WarpTypeCard.tsx" },
  { title: "Flip - one word becoming the next", node: <FlipTypeCard />, entry: "components/flip-type/FlipTypeCard.tsx" },
  { title: "Drift into focus - one field, cut once, dithered", node: <CloudTypeCard />, entry: "components/cloud-type/CloudTypeCard.tsx" },
  { title: "Eclipse - eighty rings and their discs", node: <EclipseGridCard />, entry: "components/eclipse-grid/EclipseGridCard.tsx" },
  { title: "Shutter - type through a rolling shutter", node: <ShutterTypeCard />, entry: "components/shutter-type/ShutterTypeCard.tsx" },
  { title: "Pop - drop, swell, pop", node: <PopTypeCard />, entry: "components/pop-type/PopTypeCard.tsx" },
  { title: "Misprint - two prints, one word", node: <MisprintTypeCard />, entry: "components/misprint-type/MisprintTypeCard.tsx" },
  { title: "Verbs - five words, five behaviours", node: <VerbTypeCard />, entry: "components/verb-type/VerbTypeCard.tsx" },
  { title: "Ripple - one scalar field, thresholded", node: <RippleGridCard />, entry: "components/ripple-grid/RippleGridCard.tsx" },
  { title: "Flood - the word overruns the frame", node: <FloodTypeCard />, entry: "components/flood-type/FloodTypeCard.tsx" },
  { title: "Phase table - Lissajous in metal", node: <PhaseTableCard />, entry: "components/phase-table/PhaseTableCard.tsx" },
  { title: "Swing - letters turning on a linear angle", node: <SwingTypeCard />, entry: "components/swing-type/SwingTypeCard.tsx" },
  { title: "Spray - one press, six drawings, 24fps boil", node: <SprayBurstCard />, entry: "components/spray-burst/SprayBurstCard.tsx" },
  { title: "Rush - speed tears the colour out", node: <RushTypeCard />, entry: "components/rush-type/RushTypeCard.tsx" },
  { title: "Ink flood - the scribble becomes the room", node: <InkFloodCard />, entry: "components/ink-flood/InkFloodCard.tsx" },
  { title: "Bond - a name folds into a molecule", node: <BondTypeCard />, entry: "components/bond-type/BondTypeCard.tsx" },
  { title: "Dash cascade - words unfurling from a dotted line", node: <DashCascadeCard />, entry: "components/dash-cascade/DashCascadeCard.tsx" },
  { title: "Wild - type, warp huge, un-type", node: <WildTypeCard />, entry: "components/wild-type/WildTypeCard.tsx" },
  { title: "Loud burst - a sentence that explodes", node: <LoudBurstCard />, entry: "components/loud-burst/LoudBurstCard.tsx" },
  { title: "Stamp - kinetic posters on a conveyor", node: <StampTypeCard />, entry: "components/stamptype/StampTypeCard.tsx" },
  { title: "Flower lattice - blink in unison behind a frame", node: <FlowerLatticeCard />, entry: "components/flower-lattice/FlowerLatticeCard.tsx" },
  { title: "Reality split - a design tool thinking for itself", node: <RealitySplitCard />, entry: "components/reality-split/RealitySplitCard.tsx" },
  { title: "Checker conveyor - scenes riding the seam", node: <CheckerConveyorCard />, entry: "components/checker-conveyor/CheckerConveyorCard.tsx" },
  { title: "Glass - type under one ripple lens", node: <GlassTypeCard />, entry: "components/glass-type/GlassTypeCard.tsx" },
  { title: "Sunset slam - a logo slams out of the dawn", node: <SunsetSlamCard />, entry: "components/sunset-slam/SunsetSlamCard.tsx" },
  { title: "Orbit - cursors riding an invisible sphere", node: <OrbitCard />, entry: "components/orbit/OrbitCard.tsx" },
  { title: "Word carousel - four nouns on a rail", node: <WordCarouselCard />, entry: "components/word-carousel/WordCarouselCard.tsx" },
  { title: "Slide stack - five blocks, one wave", node: <SlideStackCard />, entry: "components/slide-stack/SlideStackCard.tsx" },
  { title: "Spike - a word bristling from its own outline", node: <SpikeTypeCard />, entry: "components/spiketype/SpikeTypeCard.tsx" },
  { title: "Dot globes - three solids handing a mark along the row", node: <DotGlobeCard />, entry: "components/dotglobe/DotGlobeCard.tsx" },
  { title: "Arcade pixel - tiny type blown up into pixels", node: <ArcadePlayground />, entry: "components/arcade/playground.tsx" },
  { title: "Code trail - a staircase of fragments chasing the pointer", node: <CodeTrailCard />, entry: "components/code-trail/CodeTrailCard.tsx" },
  { title: "Glitch word - a badge tearing itself apart", node: <GlitchWordCard />, entry: "components/glitch-word/GlitchWordCard.tsx" },
  { title: "Datamosh - a corrupted decode, vertical only", node: <DatamoshCard />, entry: "components/datamosh/DatamoshCard.tsx" },
  { title: "Siri glow - a prism ribbon driven by sound", node: <SiriWaveCard />, entry: "components/siri-wave/SiriWaveCard.tsx" },
  { title: "Fade motion - two hundred copies of a word", node: <SmearCard />, entry: "components/smear/SmearCard.tsx" },
  { title: "Dotcut - a glyph cut out of a touching mesh", node: <DotCutCard />, entry: "components/dotcut/DotCutCard.tsx" },
  { title: "Badge trail - typography terms chasing the cursor", node: <BadgeTrailCard />, entry: "components/badge-trail/BadgeTrailCard.tsx" },
  { title: "Blur glow - a word lit through a bloom halo", node: <BlurGlowCard />, entry: "components/blur-glow/BlurGlowCard.tsx" },
  { title: "Text reveal - corner copy through a cloudy mask", node: <TextRevealCard />, entry: "components/text-reveal/TextRevealCard.tsx" },
  { title: "Blur reveal - panels dissolving into focus", node: <BlurRevealCard />, entry: "components/blur-reveal/BlurRevealCard.tsx" },
  { title: "Word stickers - die-cut vinyl you can fling", node: <WordStickersCard />, entry: "components/word-stickers/WordStickersCard.tsx" },
  { title: "Kinetic A - a letter rippling like water", node: <KineticACard />, entry: "components/kinetic-a/KineticACard.tsx" },
  { title: "Ransom note - letters torn from magazines", node: <RansomNotePlayground />, entry: "components/ransom/playground.tsx" },
  { title: "Chromatic glow - light pulling itself apart", node: <ChromaGlowPlayground />, entry: "components/chroma/playground.tsx" },
  { title: "Emboss - pressed into real plaster", node: <EmbossPlayground />, entry: "components/emboss/playground.tsx" },
  { title: "Design tiles - a sentence as one colour bar", node: <DesignTilesCard />, entry: "components/design-tiles/DesignTilesCard.tsx" },
  { title: "ASCII wordmark - a word as live glyphs", node: <AsciiWordmarkCard />, entry: "components/ascii-wordmark/AsciiWordmarkCard.tsx" },
  { title: "Pixel scan - a word assembled from blocks", node: <PixelScanCard />, entry: "components/pixel-scan/PixelScanCard.tsx" },
  { title: "Tile field - a wordmark of wandering light", node: <TileFieldCard />, entry: "components/tile-field/TileFieldCard.tsx" },
  { title: "Figma vector editor - blue boxes and bendy dots", node: <SvgEditorPlayground />, entry: "components/svg-editor/playground.tsx" },
  { title: "Symbols - a picture stamped out of marks", node: <SymbolsPlayground />, entry: "components/symbols/playground.tsx" },
  { title: "The typer - headlines that type themselves in", node: <TyperPlayground />, entry: "components/typer/playground.tsx" },
];

export default function Home() {
  const [theme, setTheme] = useState<AnimationTheme>({});
  const [revision, setRevision] = useState(0);

  const updateTheme = (next: AnimationTheme) => {
    setAnimationTheme(next);
    setTheme(next);
    setRevision((value) => value + 1);
  };

  return (
    <main className="page">
      <p className="source-credit">
        Adapted from: <a href="https://www.arlan.me/vault" target="_blank" rel="noopener noreferrer">arlan.me/vault</a>
      </p>
      <h1>Motion Type Studies</h1>
      <p className="sub">
        Fifty-three self-contained canvas, WebGL and DOM animations. All pause offscreen, when the
        tab is hidden and under reduced motion.
      </p>
      <div className="theme-controls" aria-label="Global animation colors">
        <button type="button" onClick={() => updateTheme({ foreground: "#ff0000", background: "#0000ff", accent: "#ffff00" })}>
          Red text / blue background
        </button>
        <label>Text <input aria-label="Text color" type="color" value={theme.foreground ?? "#ff0000"} onChange={(event) => updateTheme({ ...theme, foreground: event.target.value })} /></label>
        <label>Background <input aria-label="Background color" type="color" value={theme.background ?? "#0000ff"} onChange={(event) => updateTheme({ ...theme, background: event.target.value })} /></label>
        <label>Accent <input aria-label="Accent color" type="color" value={theme.accent ?? "#ff0000"} onChange={(event) => updateTheme({ ...theme, accent: event.target.value })} /></label>
        <button type="button" onClick={() => updateTheme({})}>Original colors</button>
      </div>
      <div className="stack" key={revision} style={{
        "--animation-foreground": theme.foreground,
        "--animation-background": theme.background,
        "--animation-accent": theme.accent,
      } as React.CSSProperties}>
        {SECTIONS.map((s) => (
          <section className="card-block" key={s.title}>
            <div className="card-header">
              <h2>{s.title}</h2>
              <CopySourceButton entry={s.entry} title={s.title} theme={theme} />
            </div>
            <GLGuard>{s.node}</GLGuard>
          </section>
        ))}
      </div>
    </main>
  );
}
