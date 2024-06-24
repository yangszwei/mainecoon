import { type DicomJson, DicomTag } from '@/lib/dicom-web';
import Description from './Description';

/**
 * Display the study information.
 *
 * @param study The DICOM JSON object.
 */
export default function StudyDescription({ study }: Readonly<{ study: DicomJson | null }>) {
	return (
		<Description
			dicomJson={study}
			fields={[
				{ tag: DicomTag.AccessionNumber, label: 'Accession #' },
				{ tag: DicomTag.StudyID, label: 'ID' },
				{ tag: DicomTag.StudyDate, label: 'Date' },
				{ tag: DicomTag.StudyTime, label: 'Time' },
			]}
		/>
	);
}
