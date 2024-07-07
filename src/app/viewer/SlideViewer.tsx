'use client';

import 'ol/ol.css';
import type { Annotation, AnnotationMap, AnnotationMapAction } from './annotation';
import { GraphicType, useAnnotationLayers } from './annotation';
import type { DicomJson } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';
import { useMap } from './map';

/** The props for the SlideViewer component. */
export interface SlideViewerProps {
	/** The server configuration. */
	server: DicomServer;
	/** The DICOM JSON object of the current slide. */
	slide: DicomJson | null;
	/** The map of annotations for the current slide. */
	annotationMap: AnnotationMap;
	/** The current selected annotation. */
	currentAnnotation: Annotation | null;
	/** The function to update an annotation. */
	updateAnnotationMap: (action: AnnotationMapAction) => void;
	/** The state of current drawing graphic type, not drawing if null. */
	drawTypeState: [GraphicType | null, (drawType: GraphicType | null) => void];
}

export default function SlideViewer({
	server,
	slide,
	annotationMap,
	currentAnnotation,
	updateAnnotationMap,
	drawTypeState,
}: Readonly<SlideViewerProps>) {
	const [mapRef, resolutions, loading] = useMap('map', server, slide);

	// Load the annotation layers.
	useAnnotationLayers(mapRef, annotationMap, updateAnnotationMap, currentAnnotation, drawTypeState, resolutions);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div id="map" className={`h-full w-full ${loading ? 'cursor-wait' : 'cursor-auto'}`} />
		</div>
	);
}
