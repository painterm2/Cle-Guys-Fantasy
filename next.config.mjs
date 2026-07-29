/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // ESPN team logos are served from these hosts.
    remotePatterns: [
      { protocol: "https", hostname: "**.espncdn.com" },
      { protocol: "https", hostname: "**.espn.com" },
    ],
  },
};

export default nextConfig;
