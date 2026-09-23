"use client";

import { useEffect, useState } from "react";
import { COMPACT_SET, DESKTOP_SET, MOBILE_QUERY, type SceneSet } from "./scenes";

export function useSceneSet(): SceneSet {
  const [set, setSet] = useState<SceneSet>(DESKTOP_SET);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setSet(mq.matches ? COMPACT_SET : DESKTOP_SET);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return set;
}
