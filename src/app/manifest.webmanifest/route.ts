// See: https://github.com/vercel/next.js/issues/56687

import appleTouchIcon from '@/app/apple-touch-icon.png';
import { basePath } from '@/lib/constants';

export function GET() {
	return Response.json({
		name: 'Mainecoon',
		short_name: 'Mainecoon',
		description: 'Web-based Digital Pathology Viewer',
		start_url: basePath.replace(/\/?$/, '/'),
		display: 'standalone',
		orientation: 'landscape',
		background_color: '#fff',
		theme_color: '#22c55e',
		icons: [
			{
				src: appleTouchIcon.src,
				sizes: '180x180',
				type: 'image/png',
			},
			{
				src: `${basePath}/android-chrome-192x192.png`,
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: `${basePath}/android-chrome-384x384.png`,
				sizes: '384x384',
				type: 'image/png',
			},
		],
		screenshots: [
			{
				src: `${basePath}/search-page.jpg`,
				sizes: '1280x800',
				type: 'image/jpeg',
				form_factor: 'wide',
				label: 'Search Page',
			},
			{
				src: `${basePath}/viewer-page.jpg`,
				sizes: '1280x800',
				type: 'image/jpeg',
				form_factor: 'wide',
				label: 'Viewer Page',
			},
		],
	});
}
