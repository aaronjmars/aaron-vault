"use client";

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
import HoloCard from "../components/holo/HoloCard";
import GlitchWordCard from "../components/glitch-word/GlitchWordCard";
import DatamoshCard from "../components/datamosh/DatamoshCard";
import AiLightsCard from "../components/ai-lights/AiLightsCard";
import SiriWaveCard from "../components/siri-wave/SiriWaveCard";
import SmearCard from "../components/smear/SmearCard";
import PixelBrushCard from "../components/pixel-brush/PixelBrushCard";
import DotCutCard from "../components/dotcut/DotCutCard";
import LiquidPlayground from "../components/liquid/playground";
import EmbroideryCard from "../components/embroidery/EmbroideryCard";
import BadgeTrailCard from "../components/badge-trail/BadgeTrailCard";
import BlurGlowCard from "../components/blur-glow/BlurGlowCard";
import TextRevealCard from "../components/text-reveal/TextRevealCard";
import BlurRevealCard from "../components/blur-reveal/BlurRevealCard";
import WordStickersCard from "../components/word-stickers/WordStickersCard";
import KineticACard from "../components/kinetic-a/KineticACard";
import SquirclePlayground from "../components/squircle/playground";
import RansomNotePlayground from "../components/ransom/playground";
import ChromaGlowPlayground from "../components/chroma/playground";
import EmbossPlayground from "../components/emboss/playground";
import DesignTilesCard from "../components/design-tiles/DesignTilesCard";
import AsciiWordmarkCard from "../components/ascii-wordmark/AsciiWordmarkCard";
import PixelScanCard from "../components/pixel-scan/PixelScanCard";
import TileFieldCard from "../components/tile-field/TileFieldCard";
import HoverVideoPlayground from "../components/hover-video/playground";
import SvgEditorPlayground from "../components/svg-editor/playground";
import SymbolsPlayground from "../components/symbols/playground";
import TyperPlayground from "../components/typer/playground";

const SECTIONS: { title: string; node: React.ReactNode }[] = [
  { title: "Warp - six cuts, the verb does the work", node: <WarpTypeCard /> },
  { title: "Flip - one word becoming the next", node: <FlipTypeCard /> },
  { title: "Drift into focus - one field, cut once, dithered", node: <CloudTypeCard /> },
  { title: "Eclipse - eighty rings and their discs", node: <EclipseGridCard /> },
  { title: "Shutter - type through a rolling shutter", node: <ShutterTypeCard /> },
  { title: "Pop - drop, swell, pop", node: <PopTypeCard /> },
  { title: "Misprint - two prints, one word", node: <MisprintTypeCard /> },
  { title: "Verbs - five words, five behaviours", node: <VerbTypeCard /> },
  { title: "Ripple - one scalar field, thresholded", node: <RippleGridCard /> },
  { title: "Flood - the word overruns the frame", node: <FloodTypeCard /> },
  { title: "Phase table - Lissajous in metal", node: <PhaseTableCard /> },
  { title: "Swing - letters turning on a linear angle", node: <SwingTypeCard /> },
  { title: "Spray - one press, six drawings, 24fps boil", node: <SprayBurstCard /> },
  { title: "Rush - speed tears the colour out", node: <RushTypeCard /> },
  { title: "Ink flood - the scribble becomes the room", node: <InkFloodCard /> },
  { title: "Bond - a name folds into a molecule", node: <BondTypeCard /> },
  { title: "Dash cascade - words unfurling from a dotted line", node: <DashCascadeCard /> },
  { title: "Wild - type, warp huge, un-type", node: <WildTypeCard /> },
  { title: "Loud burst - a sentence that explodes", node: <LoudBurstCard /> },
  { title: "Stamp - kinetic posters on a conveyor", node: <StampTypeCard /> },
  { title: "Flower lattice - blink in unison behind a frame", node: <FlowerLatticeCard /> },
  { title: "Reality split - a design tool thinking for itself", node: <RealitySplitCard /> },
  { title: "Checker conveyor - scenes riding the seam", node: <CheckerConveyorCard /> },
  { title: "Glass - type under one ripple lens", node: <GlassTypeCard /> },
  { title: "Sunset slam - a logo slams out of the dawn", node: <SunsetSlamCard /> },
  { title: "Orbit - cursors riding an invisible sphere", node: <OrbitCard /> },
  { title: "Word carousel - four nouns on a rail", node: <WordCarouselCard /> },
  { title: "Slide stack - five blocks, one wave", node: <SlideStackCard /> },
  { title: "Spike - a word bristling from its own outline", node: <SpikeTypeCard /> },
  { title: "Dot globes - three solids handing a mark along the row", node: <DotGlobeCard /> },
  { title: "Arcade pixel - tiny type blown up into pixels", node: <ArcadePlayground /> },
  { title: "Code trail - a staircase of fragments chasing the pointer", node: <CodeTrailCard /> },
  { title: "Holo - an identity card in holo foil", node: <HoloCard /> },
  { title: "Glitch word - a badge tearing itself apart", node: <GlitchWordCard /> },
  { title: "Datamosh - a corrupted decode, vertical only", node: <DatamoshCard /> },
  { title: "AI lights - one body becoming four components", node: <AiLightsCard /> },
  { title: "Siri glow - a prism ribbon driven by sound", node: <SiriWaveCard /> },
  { title: "Fade motion - two hundred copies of a word", node: <SmearCard /> },
  { title: "Pixel brushes - one spiral, three stamps", node: <PixelBrushCard /> },
  { title: "Dotcut - a glyph cut out of a touching mesh", node: <DotCutCard /> },
  { title: "Liquid UI - cards that pour together", node: <LiquidPlayground /> },
  { title: "Embroidery - word patches stitched in thread", node: <EmbroideryCard /> },
  { title: "Badge trail - typography terms chasing the cursor", node: <BadgeTrailCard /> },
  { title: "Blur glow - a word lit through a bloom halo", node: <BlurGlowCard /> },
  { title: "Text reveal - corner copy through a cloudy mask", node: <TextRevealCard /> },
  { title: "Blur reveal - panels dissolving into focus", node: <BlurRevealCard /> },
  { title: "Word stickers - die-cut vinyl you can fling", node: <WordStickersCard /> },
  { title: "Kinetic A - a letter rippling like water", node: <KineticACard /> },
  { title: "Squircle - the corner Apple fixed", node: <SquirclePlayground /> },
  { title: "Ransom note - letters torn from magazines", node: <RansomNotePlayground /> },
  { title: "Chromatic glow - light pulling itself apart", node: <ChromaGlowPlayground /> },
  { title: "Emboss - pressed into real plaster", node: <EmbossPlayground /> },
  { title: "Design tiles - a sentence as one colour bar", node: <DesignTilesCard /> },
  { title: "ASCII wordmark - a word as live glyphs", node: <AsciiWordmarkCard /> },
  { title: "Pixel scan - a word assembled from blocks", node: <PixelScanCard /> },
  { title: "Tile field - a wordmark of wandering light", node: <TileFieldCard /> },
  { title: "Amo hover button - pills that puff into video", node: <HoverVideoPlayground /> },
  { title: "Figma vector editor - blue boxes and bendy dots", node: <SvgEditorPlayground /> },
  { title: "Symbols - a picture stamped out of marks", node: <SymbolsPlayground /> },
  { title: "The typer - headlines that type themselves in", node: <TyperPlayground /> },
];

export default function Home() {
  return (
    <main className="page">
      <h1>Motion Type Studies</h1>
      <p className="sub">
        Sixty self-contained canvas, WebGL and DOM animations. All pause offscreen, when the
        tab is hidden and under reduced motion.
      </p>
      <div className="stack">
        {SECTIONS.map((s) => (
          <section className="card-block" key={s.title}>
            <h2>{s.title}</h2>
            {s.node}
          </section>
        ))}
      </div>
    </main>
  );
}
