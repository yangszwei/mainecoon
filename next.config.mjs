/** @type {import('next').NextConfig} */
const nextConfig = {
	basePath: process.env.NEXT_PUBLIC_BASE_PATH,
	output: 'standalone',
	experimental: {
		instrumentationHook: true,
	},
};

export default nextConfig;
