import '@fontsource/noto-sans-tc/400.css';
import '@fontsource/noto-sans-tc/500.css';
import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'MaineCoon',
	description: 'Web-based Digital Pathology Viewer',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<html className="h-full" lang="en">
			<body className="h-full bg-gray-100 text-gray-800">{children}</body>
		</html>
	);
}
