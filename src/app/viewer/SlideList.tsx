'use client';

import { $dicom, DicomJson, DicomTag, toDicomWebUri } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';

/** The properties of the {@link SlideList} component. */
export interface SlideListProps {
	/** The server configuration. */
	server: DicomServer;
	/** The study instance UID. */
	studyUid: string;
	/** The list of slides (SM series). */
	slides: DicomJson[];
	/** The current slide state. */
	currentSlideState: [DicomJson | null, (slide: DicomJson | null) => void];
	/** Whether the study was not found. */
	notFound: boolean;
}

/** Display the available slides in the study to select from. */
export default function SlideList({ server, studyUid, slides, currentSlideState, notFound }: Readonly<SlideListProps>) {
	const [currentSlide, setCurrentSlide] = currentSlideState;
	const baseUrl = server.url;

	if (notFound) {
		return <p className="p-3.5 text-center text-sm tracking-wide text-gray-500">No slides available</p>;
	}

	if (slides.length === 0) {
		return (
			<p className="p-3 text-center">
				<span className="spinner-sm border-green-500" />
			</p>
		);
	}

	return (
		<ul className="text-sm">
			{slides.map((slide) => {
				const seriesUid = $dicom(slide, DicomTag.SeriesInstanceUID);
				const currentSlideUid = $dicom(currentSlide, DicomTag.SeriesInstanceUID);
				const isActive = seriesUid === currentSlideUid;

				return (
					<li
						key={$dicom(slide, DicomTag.SeriesInstanceUID)}
						className={`cursor-pointer p-3 ${isActive ? 'bg-gray-100' : ''}`}
						onClick={() => setCurrentSlide(slide)}
					>
						<strong className="mb-2 block">{$dicom(slide, DicomTag.ContainerIdentifier)}</strong>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={toDicomWebUri({ baseUrl, studyUid, seriesUid, name: 'thumbnail' })}
							className="h-32 w-full border object-cover"
							alt=""
						/>
					</li>
				);
			})}
		</ul>
	);
}
