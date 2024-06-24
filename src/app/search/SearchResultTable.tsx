'use client';

import { $dicom, DicomJson, DicomTag, fetchDicomJson, toDicomWebUri } from '@/lib/dicom-web';
import { useEffect, useState } from 'react';
import type { DicomServer } from '@/config/dicom-web';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ThumbnailsProps {
	/** The current DICOMweb server. */
	server: DicomServer;
	/** The study UID to render thumbnails for. */
	studyUid: string;
}

/** Renders SM thumbnails for the given study. */
function Thumbnails({ server, studyUid }: Readonly<ThumbnailsProps>) {
	const [seriesUids, setSeriesUids] = useState<string[]>([]);

	useEffect(() => {
		const fetchSmSeries = async () => {
			const seriesUids = (await fetchDicomJson({ baseUrl: server.url, studyUid, name: 'series' }))
				.filter((series) => $dicom(series, DicomTag.Modality) === 'SM')
				.map((series) => $dicom(series, DicomTag.SeriesInstanceUID));

			setSeriesUids(seriesUids);
		};

		fetchSmSeries();
	}, [server, studyUid]);

	return (
		<div className="flex min-h-20 flex-wrap gap-3">
			{seriesUids.map((seriesUid) => (
				<Link
					key={seriesUid}
					href={`/viewer?server=${server.name}&studyUid=${studyUid}&seriesUid=${seriesUid}`}
					onClick={(e) => e.stopPropagation()}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={toDicomWebUri({ baseUrl: server.url, studyUid, seriesUid, name: 'thumbnail' })}
						className="break-all border bg-white text-xs"
						height={80}
						width={80}
						alt={seriesUid}
					/>
				</Link>
			))}
		</div>
	);
}

export interface SearchResultTableProps {
	/** The current DICOMweb server. */
	server: DicomServer;
	/** The studies to display. */
	studies: DicomJson[];
	/** The loading state of the search results. */
	isLoading: boolean;
}

/** The table for displaying the studies search results. */
export default function SearchResultTable({ server, studies, isLoading }: Readonly<SearchResultTableProps>) {
	const router = useRouter();

	function openStudy(study: DicomJson) {
		router.push(`/viewer?server=${server.name}&studyUid=${$dicom(study, DicomTag.StudyInstanceUID)}`);
	}

	return (
		<div className="relative h-full overflow-hidden">
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-white/60">
					<div className="spinner border-green-500" />
				</div>
			)}
			<div className="h-full overflow-auto">
				<table className="w-full border-separate border-spacing-0">
					<thead className="sticky top-0">
						<tr className="bg-green-500 text-left text-sm text-white">
							<th className="px-3 py-2">Patient ID</th>
							<th className="px-3 py-2">Patient Name</th>
							<th className="px-3 py-2">Birth Date</th>
							<th className="px-3 py-2">Gender</th>
							<th className="px-3 py-2">Accession Number</th>
							<th className="px-3 py-2">Study Date</th>
							<th className="px-3 py-2">Thumbnails</th>
						</tr>
					</thead>
					<tbody>
						{studies.length > 0 ? (
							studies.map((study) => (
								<tr
									className="hover:bg-gray-500/10"
									key={$dicom(study, DicomTag.StudyInstanceUID)}
									onClick={() => openStudy(study)}
								>
									<td className="border p-3">{$dicom(study, DicomTag.PatientID)}</td>
									{/* @ts-ignore-next-line */}
									<td className="border p-3">{$dicom(study, DicomTag.PatientName)}</td>
									<td className="border p-3">{$dicom(study, DicomTag.PatientBirthDate)}</td>
									<td className="border p-3">{$dicom(study, DicomTag.PatientSex)}</td>
									<td className="border p-3">{$dicom(study, DicomTag.AccessionNumber)}</td>
									<td className="border p-3">{$dicom(study, DicomTag.StudyDate)}</td>
									<td className="border p-3">
										<Thumbnails server={server} studyUid={$dicom(study, DicomTag.StudyInstanceUID)} />
									</td>
								</tr>
							))
						) : (
							<tr className="h-full">
								{isLoading || (
									<td colSpan={7} className="p-3 text-center">
										No Data
									</td>
								)}
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
}
