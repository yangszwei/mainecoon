import { $dicom, DicomTag, fetchDicomJson } from '@/lib/dicom-web';
import { useEffect, useState } from 'react';
import type { DicomJson } from '@/lib/dicom-web';
import { DicomServer } from '@/config/dicom-web';

/**
 * Fetches the study and slides from the DICOMweb server.
 *
 * @param server The DICOMweb server.
 * @param studyUid The study instance UID.
 * @returns The study and slide (SM) series.
 */
export function useStudy(server: DicomServer, studyUid: string | null) {
	const [study, setStudy] = useState<DicomJson | null>(null);
	const [slides, setSlides] = useState<DicomJson[]>([]);
	const baseUrl = server.url;

	useEffect(() => {
		async function fetchStudy() {
			if (!baseUrl || !studyUid) return;

			// Fetch the study metadata.
			const study = await fetchDicomJson({ baseUrl, studyUid, name: 'metadata' });

			setStudy(study[0]);
		}

		async function fetchSlides() {
			if (!baseUrl || !studyUid) return;

			// The search parameters to filter the SM series.
			const searchParams = new URLSearchParams({ [DicomTag.Modality]: 'SM' });

			// Fetch the SM series metadata.
			const slides = await fetchDicomJson({ baseUrl, studyUid, name: 'series', searchParams })
				.then((data) => data.filter((series) => $dicom(series, DicomTag.Modality) === 'SM'))
				.then((data) => data.map((series) => $dicom(series, DicomTag.SeriesInstanceUID)))
				.then((data) => data.map((seriesUid) => fetchDicomJson({ baseUrl, studyUid, seriesUid, name: 'metadata' })))
				.then((data) => Promise.all(data));

			setSlides(slides.map((s) => s[0]));
		}

		fetchStudy();
		fetchSlides();
	}, [baseUrl, studyUid]);

	return [study, slides] as const;
}
