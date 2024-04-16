import { fontFamily } from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['"Noto Sans TC"', ...fontFamily.sans],
			},
		},
	},
	plugins: [forms],
};
