import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	serverExternalPackages: ["better-sqlite3"],
	images: {
		remotePatterns: [
			{ protocol: "https", hostname: "avatars.githubusercontent.com" },
			{ protocol: "https", hostname: "**.ytimg.com" },
			{ protocol: "https", hostname: "openweathermap.org" },
		],
	},
};

export default nextConfig;
