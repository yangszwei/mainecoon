import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

const config: Config = {
	content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Noto Sans TC"', ...fontFamily.sans],
			},
		},
	},
	plugins: [forms],
};

export default config;
