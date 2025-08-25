import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	experimental: {
		// Enable Web Workers in Next.js 15
		workerThreads: false,
		cpus: 1,
	},
};

export default nextConfig;
