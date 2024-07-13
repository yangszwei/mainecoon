import { HTMLProps } from 'react';

/** Props for the ColorPicker component */
export type ColorPickerProps = HTMLProps<HTMLInputElement> & {
	setValue: (value: string) => void;
	value: string;
};

/** A controlled color picker action button. */
export default function ColorPicker({ setValue, value, ...props }: Readonly<ColorPickerProps>) {
	if (!value) setValue('#3399CC');

	return (
		<div className="relative overflow-hidden rounded bg-white/80 p-2">
			<label className="cursor-pointer">
				<span className="block h-4 w-4" style={{ backgroundColor: value }}></span>
				<input
					{...props}
					type="color"
					className="absolute left-0.5 top-0.5 opacity-0"
					onChange={(e) => setValue(e.target.value)}
					value={value}
				/>
			</label>
		</div>
	);
}
