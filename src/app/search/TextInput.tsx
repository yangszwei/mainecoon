import type { HTMLProps } from 'react';

export type TextInputProps = Readonly<HTMLProps<HTMLInputElement> & { label?: string }>;

export default function TextInput({ label, type, className, required, ...props }: Readonly<TextInputProps>) {
	return (
		<label className="block">
			{label && <span className="mb-1 block select-none text-nowrap text-xs font-medium text-gray-700">{label}</span>}
			<input
				type={type || 'text'}
				className={`block w-full rounded px-1.5 py-1.5 text-sm focus:border-green-500 focus:outline-none focus:ring-green-500 ${className || ''}`}
				required={required}
				{...props}
			/>
		</label>
	);
}
