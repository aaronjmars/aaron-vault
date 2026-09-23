"use client";

import { HoverVideoButton } from "./HoverVideoButton";

export default function HoverVideoPlayground() {
  return (
    <div
      data-canvas-card
      aria-label="Small pill buttons that puff up into glossy inflated letters when you hover them, like amo.co. Move the cursor over each pill."
      className="relative mx-auto flex aspect-[1344/620] w-full select-none flex-col items-center justify-center gap-16 overflow-hidden rounded-[12px] border border-[var(--border-line)]"
      style={{ background: "radial-gradient(120% 120% at 30% 20%, #fdfcfa 0%, #efe9e2 60%, #e3dcd3 100%)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-10 text-center text-[13px] tracking-[0.14em] text-[#8a8378] uppercase">
        hover the pills
      </div>

      <div className="pointer-events-auto flex flex-col items-center gap-10">
        <HoverVideoButton label="Try amo" video="/vault/amo/amo-puff" width={420} variant="light" sound="soft" offsetY={-10} />
        <div className="flex items-center gap-6">
          <HoverVideoButton label="Get started" video="/vault/amo/amo-puff" width={340} variant="blue" sound="crisp" offsetY={20} />
          <HoverVideoButton label="Book a demo" video="/vault/amo/amo-puff" width={340} variant="dark" sound="thock" offsetY={20} />
        </div>
      </div>
    </div>
  );
}
