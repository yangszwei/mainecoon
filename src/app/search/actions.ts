'use server';

import { DicomTag, fetchDicomJson } from '@/lib/dicom-web';

/** Builds the search parameters for the studies search. */
function buildSmSearchParams(formData: FormData) {
	const field = (name: string) => formData.get(name) as string | null;

	const searchParams = new URLSearchParams({ [DicomTag.ModalitiesInStudy]: 'SM' });
	if (field('patientId')) searchParams.set(DicomTag.PatientID, field('patientId')!);
	if (field('patientName')) searchParams.set(DicomTag.PatientName, field('patientName')!);
	if (field('studyUid')) searchParams.set(DicomTag.StudyInstanceUID, field('studyUid')!);
	if (field('accessionNumber')) searchParams.set(DicomTag.AccessionNumber, field('accessionNumber')!);
	if (field('studyDate')) searchParams.set(DicomTag.StudyDate, field('studyDate')!.replace(/-/g, ''));
	if (field('limit')) searchParams.set('limit', field('limit')!);
	if (field('offset')) searchParams.set('offset', field('offset')!);

	return searchParams;
}

/** Fetches the studies from the DICOMweb server. */
export async function getStudies(formData: FormData) {
	return fetchDicomJson({
		baseUrl: formData.get('baseUrl') as string,
		name: 'studies',
		searchParams: buildSmSearchParams(formData),
	});
}
