import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingIncludes: {
    "/api/component-source": [
      "./components/**/*",
      "./lib/**/*",
      "./app/globals.css",
      "./app/layout.tsx",
      "./package.json",
    ],
  },
};

export default config;
