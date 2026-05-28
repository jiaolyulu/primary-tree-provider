/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/providers": ["./data/provider-index/**/*.json"],
  },
};

export default nextConfig;
