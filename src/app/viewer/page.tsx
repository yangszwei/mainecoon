'use client';

import { DicomJson, DicomTag } from '@/lib/dicom-web';
import Drawer, { DrawerSection } from '@/app/_components/Drawer';
import { useEffect, useMemo, useState } from 'react';
import AnnotationList from './AnnotationList';
import Header from '@/app/_components/Header';
import Image from 'next/image';
import PatientDescription from './PatientDescription';
import SlideList from './SlideList';
import SlideViewer from './SlideViewer';
import StudyDescription from './StudyDescription';
import icon from '@/app/icon.png';
import { servers } from '@/config/dicom-web';
import { useAnnotationMap } from '@/app/viewer/annotation';
import { useSearchParams } from 'next/navigation';
import { useStudy } from './study';

/**
 * Builds a valid options object based on the search parameters for the viewer page.
 *
 * @returns The options object, guaranteed to be valid.
 */
function useOptions() {
	const searchParams = useSearchParams();

	const [server, setServer] = useState(servers.default);
	const [studyUid, setStudyUid] = useState<string>('');
	const [seriesUid, setSeriesUid] = useState<string | null>(null);

	useEffect(() => {
		if (searchParams.get('server')) setServer(servers[searchParams.get('server')!] || servers.default);
		if (searchParams.get('studyUid')) setStudyUid(searchParams.get('studyUid')!);
		if (searchParams.get('seriesUid')) setSeriesUid(searchParams.get('seriesUid')!);
	}, [searchParams]);

	return { server, studyUid, seriesUid };
}

/**
 * Generates a random animation class for the loader.
 *
 * @returns The random animation class.
 */
function useLoaderAnimation() {
	const [loader, setLoader] = useState('');

	useEffect(() => {
		const animations = ['animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce'];
		setLoader(animations[Math.floor(Math.random() * animations.length)]);
	}, []);

	return loader;
}

export default function ViewerPage() {
	const { server, studyUid, seriesUid } = useOptions();
	const [study, slides, loading] = useStudy(server, studyUid);
	const [currentSlide, setCurrentSlide] = useState<DicomJson | null>(null);
	const [annotationMap, updateAnnotationMap] = useAnnotationMap(server, currentSlide);
	const loaderAnimation = useLoaderAnimation();
	const notFound = useMemo(() => !loading && !study, [loading, study]);

	// Set the current slide when the search params changes.
	useEffect(() => {
		const selectedSlide = slides.find((slide) => slide[DicomTag.SeriesInstanceUID]!.Value?.[0] === seriesUid);
		setCurrentSlide(selectedSlide || slides[0]);
	}, [seriesUid, slides]);

	return (
		<>
			<Header className="h-16" server={server} />
			<div className="flex h-full pt-16">
				<Drawer placement="left">
					<DrawerSection title="Patient" open>
						<PatientDescription study={study} notFound={notFound} />
					</DrawerSection>
					<DrawerSection title="Study" open>
						<StudyDescription study={study} notFound={notFound} />
					</DrawerSection>
					<DrawerSection title="Slides" open>
						<SlideList
							server={server}
							studyUid={studyUid}
							slides={slides}
							currentSlideState={[currentSlide, setCurrentSlide]}
							notFound={notFound}
						/>
					</DrawerSection>
				</Drawer>
				<main className="grow">
					{loading ? (
						<p className="flex h-full items-center justify-center text-gray-500">
							<Image src={icon} height={120} width={120} className={`${loaderAnimation} rounded-full`} alt="" />
						</p>
					) : currentSlide ? (
						<SlideViewer
							server={server}
							slide={currentSlide}
							annotationMap={annotationMap}
							updateAnnotationMap={updateAnnotationMap}
						/>
					) : (
						<p className="flex h-full items-center justify-center text-gray-500">No slide selected</p>
					)}
				</main>
				<Drawer placement="right">
					<DrawerSection title="Annotations" open>
						<AnnotationList
							annotationMap={annotationMap}
							updateAnnotationMap={updateAnnotationMap}
							notFound={notFound}
						/>
					</DrawerSection>
				</Drawer>
			</div>
		</>
	);
}
