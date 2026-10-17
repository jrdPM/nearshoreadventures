import type { NextConfig } from "next";

// The site is built as plain files (out/) and uploaded to Cloudways by GitHub Actions.
// Forms and the admin page talk to small PHP scripts in public/api/.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
