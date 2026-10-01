/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: "/vortex-by-brilliant-mere",
  assetPrefix: "/vortex-by-brilliant-mere/",
  trailingSlash: true,
};

module.exports = nextConfig;
