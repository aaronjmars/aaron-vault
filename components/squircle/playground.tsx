"use client";

import { PG_PREVIEW } from "../swirl/controls";
import { SquircleGlossyButton } from "./parts";

const SHAPE = { radius: 22, smoothing: 1, exponent: 5, compare: false };

export function SquirclePlayground() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className={`${PG_PREVIEW} flex aspect-[1344/620] w-full items-center justify-center`}>
        <SquircleGlossyButton {...SHAPE} />
      </div>
    </div>
  );
}

export default SquirclePlayground;
