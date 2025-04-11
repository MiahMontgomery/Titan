/** @type {import('next').NextConfig} */
const nextConfig = {
  // This is a simple passthrough config for Vercel
  // It won't actually be used for Next.js functionality
  // But it helps Vercel detect this as a deployable project
  reactStrictMode: true,
  swcMinify: true
};

module.exports = nextConfig;