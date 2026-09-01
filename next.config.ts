import type { NextConfig } from "next";

// GitHub Pages serves this repo as a project page at /portfolio/, not
// from the domain root, and has no Node server to run — so the export
// build needs a basePath and can't use the on-demand image optimizer.
// Gated behind an env var rather than always-on so `next dev`/a server
// deploy (Vercel etc.) stays prefix-free and keeps the optimizer.
const BASE_PATH = "/portfolio";
const isGithubPagesExport = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(isGithubPagesExport && {
    output: "export",
    basePath: BASE_PATH,
    images: { unoptimized: true },
  }),
  // next/image with unoptimized:true renders a plain <img>, so a public/
  // asset referenced by a literal string src (the portrait) isn't run
  // through anything that would prefix it with basePath the way page
  // navigation is — DocBody prefixes it itself using this at render time.
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPagesExport ? BASE_PATH : "",
  },
};

export default nextConfig;
