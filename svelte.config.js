import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csrf: {
			checkOrigin: process.env.NODE_ENV !== 'development',
		},
		paths: {
			base: process.env.BASE_PATH ?? '',
		},
	},
};

export default config;
