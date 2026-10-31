import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Profiles live at /<username> (or /<user id>); old /users/... links move there.
  async redirects() {
    return [{ source: "/users/:handle", destination: "/:handle", permanent: true }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
