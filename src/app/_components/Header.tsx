import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import icon from '@/app/icon.png';

/** The application title with logo. */
function AppTitle() {
	return (
		<Link href="/" target="_self" className="flex select-none items-center gap-3 text-2xl text-white">
			<Image src={icon} className="object-contain" draggable="false" height={48} width={48} alt="" />
			<span className="font-serif font-bold uppercase tracking-wider">MaineCoon</span>
		</Link>
	);
}

/** Base header for the application. */
export default function Header({ className, children }: Readonly<{ className?: string; children?: ReactNode }>) {
	return (
		<header
			className={`fixed inset-x-0 top-0 z-50 flex items-center gap-3 bg-green-500 px-3 shadow ${className || ''}`}
		>
			<AppTitle />
			<div className="grow">{children}</div>
		</header>
	);
}
