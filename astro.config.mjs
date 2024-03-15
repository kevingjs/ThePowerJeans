import { defineConfig } from 'astro/config';
import vercel from "@astrojs/vercel/serverless";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	integrations: [ react() ],
	adapter: vercel({
		webAnalytics: {
			enabled: true
		}
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