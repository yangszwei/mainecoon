import type { DicomJson, DicomTag } from '@/lib/dicom-web';
import { $dicom } from '@/lib/dicom-web';

/** The properties of the {@link Description} component. */
export interface DescriptionProps {
	/** The DICOM JSON object. */
	dicomJson: DicomJson | null;
	/** The list of DICOM attributes to display. */
	fields: { label: string; tag: DicomTag; formatter?: (value: string) => string }[];
	/** Whether to wrap the values. */
	wrapText?: boolean;
}

/** Display a list of DICOM attributes with their values. */
export default function Description({ dicomJson, fields, wrapText }: Readonly<DescriptionProps>) {
	if (!dicomJson) {
		return (
			<p className="p-3 text-center">
				<span className="spinner-sm border-green-500" />
			</p>
		);
	}

	return (
		<ul className="space-y-0.5 p-3 text-sm">
			{fields.map(({ label, tag, formatter }) => (
				<li key={label}>
					<span className="after:pl-0.5 after:pr-1.5 after:content-[':']">{label}</span>
					<strong className={wrapText ? 'block' : 'inline'}>
						{(formatter || ((value) => value))($dicom(dicomJson, tag))}
					</strong>
				</li>
			))}
		</ul>
	);
}
