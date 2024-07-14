'use client';

import type { MouseEvent, ReactNode, TouchEvent } from 'react';
import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import mdiChevronDown from '@iconify-icons/mdi/chevron-down';
import mdiChevronLeft from '@iconify-icons/mdi/chevron-left';
import mdiChevronRight from '@iconify-icons/mdi/chevron-right';

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
			<div className="bg-green-200" onClick={() => setIsOpen(!isOpen)}>
				<button className="flex w-full select-none items-center justify-between px-3 py-2 text-sm">
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

function useResize(placement: 'left' | 'right' | undefined, widths: number[], hideThreshold: number) {
	const [isResizing, setIsResizing] = useState(false);
	const [defaultWidth, minWidth, maxWidth] = widths;
	const [width, setWidth] = useState(defaultWidth);
	const [isHidden, setIsHidden] = useState(false);

	useEffect(() => {
		const handleMove = (clientX: number) => {
			if (!isResizing) return;

			let newWidth = placement === 'right' ? window.innerWidth - clientX : clientX;

			// Snap to default width if close enough
			if (Math.abs(newWidth - defaultWidth) < 5) {
				newWidth = defaultWidth;
			}

			// Hide drawer if width is less than hideThreshold
			if (newWidth < hideThreshold) {
				setIsHidden(true);
				setWidth(0);
			} else {
				setIsHidden(false);
				setWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
			}
		};

		const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
		const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

		const handleEnd = () => {
			setIsResizing(false);
			document.documentElement.style.cursor = '';
			document.body.classList.remove('select-none');
			document.removeEventListener('mousemove', handleMouseMove as never);
			document.removeEventListener('mouseup', handleEnd);
			document.removeEventListener('touchmove', handleTouchMove as never);
			document.removeEventListener('touchend', handleEnd);
		};

		if (isResizing) {
			document.documentElement.style.cursor = 'ew-resize';
			document.body.classList.add('select-none');
			document.addEventListener('mousemove', handleMouseMove as never);
			document.addEventListener('mouseup', handleEnd);
			document.addEventListener('touchmove', handleTouchMove as never);
			document.addEventListener('touchend', handleEnd);
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove as never);
			document.removeEventListener('mouseup', handleEnd);
			document.removeEventListener('touchmove', handleTouchMove as never);
			document.removeEventListener('touchend', handleEnd);
		};
	}, [isResizing, placement, defaultWidth, minWidth, maxWidth, hideThreshold]);

	const handleStart = (e: MouseEvent | TouchEvent) => {
		e.preventDefault();
		setIsResizing(true);
	};

	const toggleDrawer = () => {
		if (isHidden) {
			setIsHidden(false);
			setWidth(defaultWidth);
		} else {
			setIsHidden(true);
			setWidth(0);
		}
	};

	return [isHidden, width, handleStart, toggleDrawer] as const;
}

export interface DrawerProps {
	className?: string;
	placement?: 'left' | 'right';
	children?: ReactNode;
}

/** The drawer component (a.k.a. sidebar) provides access to secondary content. */
export default function Drawer({ className, placement, children }: Readonly<DrawerProps>) {
	const [isHidden, width, handleStart, toggleDrawer] = useResize(placement, [318, 270, 510], 16);

	// Default placement is 'left'.
	const placementClass = placement === 'right' ? 'border-l' : 'border-r';

	return (
		<aside className={`relative h-full shrink-0 ${placementClass} ${className || ''}`}>
			{/* Drawer handle */}
			<div
				className={`flex h-full flex-col justify-center bg-white ${isHidden ? '' : 'hidden'} ${placementClass}`}
				onMouseDown={handleStart}
				onTouchStart={handleStart}
			>
				<button type="button" onClick={toggleDrawer}>
					<Icon icon={placement === 'right' ? mdiChevronLeft : mdiChevronRight} className="h-4 w-4" />
				</button>
			</div>

			{/* Drawer content */}
			<div className={isHidden ? 'hidden' : 'contents'}>
				<div className="h-full overflow-auto bg-white shadow-sm" style={{ width }}>
					{children}
				</div>
				<div
					onMouseDown={handleStart}
					onTouchStart={handleStart}
					className={`absolute top-0 ${placement === 'right' ? '-left-1' : '-right-1'} h-full w-2 cursor-ew-resize`}
				/>
			</div>
		</aside>
	);
}
