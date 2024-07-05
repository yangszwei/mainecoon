import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/500.css';
import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

export const metadata: Metadata = {
	title: 'Mainecoon',
	description: 'Web-based Digital Pathology Viewer',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	const loading = <div className="flex h-full items-center justify-center">Loading...</div>;

	return (
		<html className="h-full" lang="en">
			<body className="h-full bg-gray-100 text-gray-800">
				<Suspense fallback={loading}>{children}</Suspense>
			</body>
		</html>
	);
}
