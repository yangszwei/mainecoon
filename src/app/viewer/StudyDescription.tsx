import { type DicomJson, DicomTag } from '@/lib/dicom-web';
import Description from './Description';

export interface StudyDescriptionProps {
	/** The study DICOM JSON object. */
	study: DicomJson | null;
	/** Whether the study was not found. */
	notFound: boolean;
}

/** Display the study information. */
export default function StudyDescription({ study, notFound }: Readonly<StudyDescriptionProps>) {
	if (notFound) {
		return <p className="p-3.5 text-center text-sm tracking-wide text-gray-500">Not found</p>;
	}

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
