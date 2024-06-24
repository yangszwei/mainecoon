import { type DicomJson, DicomTag } from '@/lib/dicom-web';
import Description from './Description';
import { formatPatientSex } from '@/lib/dicom-web/vr';

/**
 * Display the patient information.
 *
 * @param study The DICOM JSON object.
 */
export default function PatientDescription({ study }: Readonly<{ study: DicomJson | null }>) {
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
