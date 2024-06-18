'use client';

import { Icon } from '@iconify/react';
import type { ReactNode } from 'react';
import mdiChevronDown from '@iconify-icons/mdi/chevron-down';
import { useState } from 'react';

export interface DrawerSectionProps {
	title: string;
	open?: boolean;
	fixed?: boolean;
	children?: ReactNode;
}

/** A collapsible section within the drawer. */
export function DrawerSection({ title, open, fixed, children }: Readonly<DrawerSectionProps>) {
	const [isOpen, setIsOpen] = useState(open || false);

	return (
		<div>
			<div className="border-y bg-green-200" onClick={() => setIsOpen(!isOpen)}>
				<button className="flex w-full select-none items-center justify-between px-3 py-2 text-sm font-bold">
					<span>{title}</span>
					{fixed || (
						<Icon
							icon={mdiChevronDown}
							className={`inline-block h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
						/>
					)}
				</button>
			</div>
			<div className={`${fixed || isOpen ? 'block' : 'hidden'}`}>{children}</div>
		</div>
	);
}

export interface DrawerProps {
	className?: string;
	placement?: 'left' | 'right';
	children?: ReactNode;
}

/** The drawer component (a.k.a. sidebar) provides access to secondary content. */
export default function Drawer({ className, placement, children }: Readonly<DrawerProps>) {
	// Default placement is 'left'.
	const placementClass = placement === 'right' ? 'border-l' : 'border-r';

	return (
		<aside className={`relative h-full w-72 shrink-0 bg-white shadow-sm ${placementClass} ${className || ''}`}>
			{children}
		</aside>
	);
}
