import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
	adapter: vercel({
		webAnalytics: { enabled: true },
	}),
	output: "hybrid",
	vite: {
		build: {
			cssMinify: "lightningcss"
		},
		ssr: {
			noExternal: ["path-to-regexp"]
		}
	}
});