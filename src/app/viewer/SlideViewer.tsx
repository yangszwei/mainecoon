'use client';

import 'ol/ol.css';
import { AnnotationConfig, AnnotationMap, useAnnotationGroupLayers } from './annotation';
import type { DicomJson } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';
import { useMap } from './map';

/** The props for the SlideViewer component. */
export interface SlideViewerProps {
	/** The server configuration. */
	server: DicomServer;
	/** The DICOM JSON object of the current slide. */
	slide: DicomJson | null;
	/** The list of annotations for the current slide. */
	annotations: AnnotationMap;
	/** The function to update an annotation. */
	updateAnnotation: (seriesUid: string, groupUid: string, update: Partial<AnnotationConfig>) => void;
}

export default function SlideViewer({ server, slide, annotations, updateAnnotation }: Readonly<SlideViewerProps>) {
	const [mapRef, resolutions, loading] = useMap('map', server, slide);

	// Add the annotation layers to the map.
	useAnnotationGroupLayers(mapRef, annotations, resolutions, updateAnnotation);

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div id="map" className={`h-full w-full ${loading ? 'cursor-wait' : 'cursor-auto'}`} />
		</div>
	);
}
