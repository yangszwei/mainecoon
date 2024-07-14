import { GraphicType } from './_hooks/annotation';
import { Icon } from '@iconify/react';
import type { MouseEvent } from 'react';
import mdiEllipseOutline from '@iconify-icons/mdi/ellipse-outline';
import mdiRectangleOutline from '@iconify-icons/mdi/rectangle-outline';
import mdiVectorPoint from '@iconify-icons/mdi/vector-point';
import mdiVectorPolygon from '@iconify-icons/mdi/vector-polygon';
import mdiVectorPolyline from '@iconify-icons/mdi/vector-polyline';

/** Props for the GeometryPicker component. */
export interface GeometryPickerProps {
	/** Additional class name for the button container. */
	className?: string;
	/** Function to call when the button is clicked. */
	onClick?: (event: MouseEvent) => void;
	/** Function to call when a graphic type is picked. */
	onPick?: (graphicType: GraphicType) => void;
}

/** A button group for picking a geometry type to create/select annotations. */
export default function GeometryPicker({ className, onClick, onPick }: Readonly<GeometryPickerProps>) {
	const drawTypes = [
		{ icon: mdiVectorPoint, graphicType: GraphicType.Point },
		{ icon: mdiVectorPolyline, graphicType: GraphicType.Polyline },
		{ icon: mdiVectorPolygon, graphicType: GraphicType.Polygon },
		{ icon: mdiEllipseOutline, graphicType: GraphicType.Ellipse },
		{ icon: mdiRectangleOutline, graphicType: GraphicType.Rectangle },
	];

	return (
		<div className={`flex items-center gap-3 ${className || ''}`}>
			{drawTypes.map((type) => (
				<button
					key={type.graphicType}
					type="button"
					className="rounded bg-white/80 p-1.5"
					onClick={(e) => {
						onClick?.(e);
						onPick?.(type.graphicType);
					}}
				>
					<Icon icon={type.icon} className="h-5 w-5" />
				</button>
			))}
		</div>
	);
}
