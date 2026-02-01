/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@node-llm/core", "@node-llm/orm"],
  trailingSlash: true,
  /* config options here */
};

export default nextConfig;
