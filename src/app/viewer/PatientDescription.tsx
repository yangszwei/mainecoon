import { type DicomJson, DicomTag } from '@/lib/dicom-web';
import Description from './Description';
import { formatPatientSex } from '@/lib/dicom-web/vr';

export interface PatientDescriptionProps {
	/** The study DICOM JSON object. */
	study: DicomJson | null;
	/** Whether the study was not found. */
	notFound: boolean;
}

/** Display the patient information. */
export default function PatientDescription({ study, notFound }: Readonly<PatientDescriptionProps>) {
	if (notFound) {
		return <p className="p-3.5 text-center text-sm tracking-wide text-gray-500">Not found</p>;
	}

	return (
		<Description
			dicomJson={study}
			fields={[
				{ tag: DicomTag.PatientID, label: 'ID' },
				{ tag: DicomTag.PatientName, label: 'Name' },
				{ tag: DicomTag.PatientSex, label: 'Gender', formatter: formatPatientSex },
				{ tag: DicomTag.PatientBirthDate, label: 'Birth Date' },
			]}
		/>
	);
}
