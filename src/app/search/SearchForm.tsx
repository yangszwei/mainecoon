'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '@/app/_components/Button';
import type { DicomJson } from '@/lib/dicom-web';
import type { DicomServer } from '@/config/dicom-web';
import type { FormEvent } from 'react';
import TextInput from './TextInput';
import { getStudies } from './actions';

/** Checks if two FormData objects are equal. */
function isFormDataEqual(a: FormData, b: FormData) {
	let equal = true;
	a.forEach((value, key) => value !== b.get(key) && (equal = false));
	b.forEach((value, key) => value !== a.get(key) && (equal = false));
	return equal;
}

export interface SearchFormProps {
	/** The current DICOMweb server. */
	server: DicomServer;
	/** Sets the studies to display. */
	setStudies: (studies: DicomJson[]) => void;
	/** The loading state of the search form. */
	isLoadingState: [boolean, (isLoading: boolean) => void];
}

/** The filter form for searching studies. */
export default function SearchForm({ server, setStudies, isLoadingState }: Readonly<SearchFormProps>) {
	const [formData, setFormData] = useState(new FormData());
	const [page, setPage] = useState({ limit: 10, offset: 0 });
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isLoading, setIsLoading] = isLoadingState;
	const formRef = useRef<HTMLFormElement>(null);

	const updateStudies = useCallback(
		() => {
			const currentFormData = new FormData(formRef.current!);

			// If the form data has changed, reset the pagination.
			if (!isFormDataEqual(currentFormData, formData)) {
				setFormData(currentFormData);
				setPage({ limit: 10, offset: 0 });
				return;
			}

			// Add limit + 1 to check if there is a next page.
			currentFormData.set('limit', String(page.limit + 1));
			currentFormData.set('offset', String(page.offset));

			// Show loading spinner.
			setIsLoading(true);

			// Fetch studies and update the states.
			getStudies(currentFormData).then((studies) => {
				setStudies(studies.length === page.limit + 1 ? studies.slice(0, -1) : studies);
				setHasNextPage(studies.length === page.limit + 1);
				setIsLoading(false);
			});
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[page, setIsLoading, setStudies],
	);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		updateStudies();
	};

	useEffect(() => {
		updateStudies();
	}, [updateStudies]);

	return (
		<form ref={formRef} className="flex flex-col gap-3 p-3" onSubmit={handleSubmit}>
			<TextInput label="Patient ID" name="patientId" />
			<TextInput label="Patient Name" name="patientName" />
			<TextInput label="Study UID" name="studyUid" />
			<TextInput label="Accession Number" name="accessionNumber" />
			<TextInput label="Study Date" name="studyDate" type="date" />
			<div className="flex items-end gap-3">
				<TextInput
					form=""
					label="Limit"
					name="limit"
					type="number"
					onChange={(e) => setPage({ ...page, limit: parseInt(e.currentTarget.value) })}
					value={page.limit}
				/>
				<TextInput
					form=""
					label="Offset"
					name="offset"
					type="number"
					onChange={(e) => setPage({ ...page, offset: parseInt(e.currentTarget.value) })}
					value={page.offset}
				/>
			</div>
			<input name="baseUrl" type="hidden" value={server.url} />
			<div className="flex items-center gap-3">
				<Button
					disabled={page.offset === 0 || isLoading}
					onClick={() => setPage({ ...page, offset: page.offset - page.limit })}
				>
					&lt;
				</Button>
				<Button type="submit" className="my-1.5 w-full">
					Search
				</Button>
				<Button
					disabled={!hasNextPage || isLoading}
					onClick={() => setPage({ ...page, offset: page.offset + page.limit })}
				>
					&gt;
				</Button>
			</div>
		</form>
	);
}
