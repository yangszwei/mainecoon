'use client';

import { DicomJson, DicomTag } from '@/lib/dicom-web';
import Drawer, { DrawerSection } from '@/app/_components/Drawer';
import { useEffect, useState } from 'react';
import AnnotationList from './AnnotationList';
import Header from '@/app/_components/Header';
import PatientDescription from './PatientDescription';
import SlideList from './SlideList';
import SlideViewer from './SlideViewer';
import StudyDescription from './StudyDescription';
import { servers } from '@/config/dicom-web';
import { useAnnotations } from '@/app/viewer/annotation';
import { useStudy } from './study';

/**
 * Builds a valid options object based on the search parameters for the viewer page.
 *
 * @param searchParams The search parameters.
 * @returns The options object, guaranteed to be valid.
 */
export function useOptions(searchParams: Readonly<SearchParams>) {
	const [server, setServer] = useState(servers.default);
	const [studyUid, setStudyUid] = useState<string>('');
	const [seriesUid, setSeriesUid] = useState<string | null>(null);

	useEffect(() => {
		if (typeof searchParams.server === 'string') setServer(servers[searchParams.server] || servers.default);
		if (typeof searchParams.studyUid === 'string') setStudyUid(searchParams.studyUid);
		if (typeof searchParams.seriesUid === 'string') setSeriesUid(searchParams.seriesUid);
	}, [searchParams]);

	return { server, studyUid, seriesUid };
}

export default function ViewerPage({ searchParams }: Readonly<{ searchParams: SearchParams }>) {
	const { server, studyUid, seriesUid } = useOptions(searchParams);
	const [study, slides] = useStudy(server, studyUid);
	const [currentSlide, setCurrentSlide] = useState<DicomJson | null>(null);
	const [annotations, updateAnnotation] = useAnnotations(server, currentSlide);

	// Set the current slide when the search params changes.
	useEffect(() => {
		const selectedSlide = slides.find((slide) => slide[DicomTag.SeriesInstanceUID].Value?.[0] === seriesUid);
		setCurrentSlide(selectedSlide || slides[0]);
	}, [seriesUid, slides]);

	return (
		<>
			<Header className="h-16" />
			<div className="flex h-full pt-16">
				<Drawer placement="left">
					<DrawerSection title="Patient" open>
						<PatientDescription study={study} />
					</DrawerSection>
					<DrawerSection title="Study" open>
						<StudyDescription study={study} />
					</DrawerSection>
					<DrawerSection title="Slides" open>
						<SlideList
							server={server}
							studyUid={studyUid}
							slides={slides}
							currentSlideState={[currentSlide, setCurrentSlide]}
						/>
					</DrawerSection>
				</Drawer>
				<main className="grow">
					{currentSlide ? (
						<SlideViewer
							server={server}
							slide={currentSlide}
							annotations={annotations}
							updateAnnotation={updateAnnotation}
						/>
					) : (
						<p className="flex h-full items-center justify-center text-gray-500">No slide selected</p>
					)}
				</main>
				<Drawer placement="right">
					<DrawerSection title="Annotations" open>
						<AnnotationList annotations={annotations} updateAnnotation={updateAnnotation} />
					</DrawerSection>
				</Drawer>
			</div>
		</>
	);
}
