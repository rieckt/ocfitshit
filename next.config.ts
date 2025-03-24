import { type NextConfig } from "next";

const config: NextConfig = {
	// Enable static exports for better performance
	output: "standalone",

	// Disable server-side image optimization since we're using Clerk's CDN
	images: {
		domains: ["img.clerk.com"],
	},

	// Enable strict mode for better development experience
	reactStrictMode: true,

	// Disable x-powered-by header for security
	poweredByHeader: false,

	// Disable source maps in development when using ngrok
	productionBrowserSourceMaps: false,

	// Allow connections from ngrok for development
	experimental: {
		allowedDevOrigins: ["*.ngrok.io", "*.ngrok-free.app"],
	},

	// Configure webpack for development
	webpack: (config, { dev, isServer }) => {
		if (dev && !isServer) {
			// Disable source maps in development when using ngrok
			config.devtool = false;

			// Enable HMR for ngrok
			config.watchOptions = {
				...config.watchOptions,
				poll: 1000,
				aggregateTimeout: 300,
			};
		}
		return config;
	},

	// Configure dev server for ngrok
	webSocketTimeout: 60000,
};

export default config;
