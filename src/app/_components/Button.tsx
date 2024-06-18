import type { HTMLProps } from 'react';

export type ButtonProps = HTMLProps<HTMLButtonElement> & { color?: 'primary' | 'danger' };

/** Button component */
export default function Button({ color, type, className, children, ...props }: Readonly<ButtonProps>) {
	const colors = {
		primary: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
		danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
	};

	return (
		<button
			type={(type as never) || 'button'}
			className={`rounded px-3 py-1.5 text-sm disabled:bg-gray-500/50 disabled:text-white ${colors[color || 'primary']} ${className || ''}`}
			{...props}
		>
			{children}
		</button>
	);
}
