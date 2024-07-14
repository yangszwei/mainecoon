import type { Annotation, AnnotationMap, AnnotationMapAction, GraphicType } from './_hooks/annotation';
import ColorPicker from './ColorPicker';
import GeometryPicker from './GeometryPicker';
import { Icon } from '@iconify/react';
import { defaultColor } from './_hooks/annotation';
import mdiHand from '@iconify-icons/mdi/hand';
import mdiPencil from '@iconify-icons/mdi/pencil';
import { useEffect } from 'react';

export interface DrawActionsProps {
	annotationMap: AnnotationMap;
	currentAnnotationState: [Annotation | null, (annotation: Annotation | null) => void];
	drawTypeState: [GraphicType | null, (drawType: GraphicType | null) => void];
	updateAnnotationMap: (action: AnnotationMapAction) => void;
	loading: boolean;
}

export default function DrawActions({
	annotationMap,
	currentAnnotationState,
	drawTypeState,
	updateAnnotationMap,
	loading,
}: Readonly<DrawActionsProps>) {
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
			annotation: { name: 'Untitled Annotation', color: defaultColor, graphicType },
		});
	}

	function updateCurrentColor(color: string) {
		if (!currentAnnotation) return;

		updateAnnotationMap({
			type: 'update',
			seriesUid: currentAnnotation.seriesUid,
			groupUid: currentAnnotation.groupUid,
			annotation: { color },
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

	// Hide the geometry picker during loading
	if (loading) return null;

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
			{currentAnnotation && <ColorPicker setValue={updateCurrentColor} value={currentAnnotation.color} />}
		</div>
	);
}
