import type { Annotation, AnnotationMap, AnnotationMapAction } from './annotation';
import GeometryPicker from './GeometryPicker';
import { GraphicType } from './annotation';
import { Icon } from '@iconify/react';
import mdiHand from '@iconify-icons/mdi/hand';
import mdiPencil from '@iconify-icons/mdi/pencil';
import { useEffect } from 'react';

export interface GeometryPickerProps {
	annotationMap: AnnotationMap;
	currentAnnotationState: [Annotation | null, (annotation: Annotation | null) => void];
	drawTypeState: [GraphicType | null, (drawType: GraphicType | null) => void];
	updateAnnotationMap: (action: AnnotationMapAction) => void;
}

export default function DrawActions({
	annotationMap,
	currentAnnotationState,
	drawTypeState,
	updateAnnotationMap,
}: Readonly<GeometryPickerProps>) {
	const [currentAnnotation, setCurrentAnnotation] = currentAnnotationState;
	const [drawType, setDrawType] = drawTypeState;

	/** Create a new annotation group with the specified graphic type. */
	function createAnnotationGroup(graphicType: GraphicType) {
		const seriesUid = currentAnnotation?.seriesUid || '';
		if (seriesUid && annotationMap[seriesUid]) {
			const group = Object.values(annotationMap[seriesUid].groupMap).findLast((g) => g.graphicType === graphicType);
			if (group) {
				setCurrentAnnotation(group);
				setDrawType(graphicType);
				return;
			}
		}

		updateAnnotationMap({
			type: 'create',
			seriesUid: currentAnnotation?.seriesUid || undefined,
			annotation: { name: 'Untitled Annotation', color: '#000000', graphicType },
		});
	}

	// Toggle the draw type on key press.
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'd' || e.key === 'D') {
				setDrawType(drawType ? null : currentAnnotation?.graphicType || null);
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [currentAnnotation, drawType, setDrawType]);

	// todo: hide the geometry picker during loading
	if (!Object.keys(annotationMap).length) {
		return null;
	}

	return (
		<div className="flex items-center gap-3">
			{currentAnnotation && (
				<button
					type="button"
					className="rounded bg-white/80 p-1.5"
					onClick={() => setDrawType(drawType ? null : currentAnnotation?.graphicType || null)}
				>
					<Icon icon={drawType === null ? mdiPencil : mdiHand} className="h-5 w-5" />
				</button>
			)}
			<GeometryPicker className="contents" onPick={createAnnotationGroup} />
		</div>
	);
}
