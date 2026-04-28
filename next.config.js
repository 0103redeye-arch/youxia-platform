/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "profile.line-scdn.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  // CORS headers for all API routes — covers automatic OPTIONS 204 responses too
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin",  value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,X-Auth-Token" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
