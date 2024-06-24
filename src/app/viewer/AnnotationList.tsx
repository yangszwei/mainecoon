import { $dicom, DicomTag } from '@/lib/dicom-web';
import type { AnnotationConfig, AnnotationMap } from './annotation';
import Description from './Description';
import { Icon } from '@iconify/react';
import mdiChevronDown from '@iconify-icons/mdi/chevron-down';
import { useState } from 'react';

interface AnnotationGroupListProps {
	series: AnnotationMap['series'][string];
	configs: AnnotationMap['configs'][string];
	updateAnnotation: (groupUid: string, update: Partial<AnnotationConfig>) => void;
}

function AnnotationGroupList({ series, configs, updateAnnotation }: Readonly<AnnotationGroupListProps>) {
	const [open, setOpen] = useState(true);
	const isOpen = !Object.values(configs).every((group) => group.loading) && open;

	if (!series || !configs) {
		return null;
	}

	return (
		<li>
			<div className="bg-green-100/60" onClick={() => setOpen(!open)}>
				<div className="flex w-full cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm">
					{Object.values(configs).every((group) => group.loading) ? (
						<div className="spinner-sm border-green-500" />
					) : (
						<input
							type="checkbox"
							className="rounded-sm text-green-500 focus:ring-0 focus:ring-offset-0"
							checked={Object.values(configs).every((group) => group.visible)}
							onClick={(e) => {
								e.stopPropagation();
							}}
							onChange={(e) => {
								const visible = !Object.values(configs).every((group) => group.visible);
								Object.keys(configs).forEach((groupUid) => updateAnnotation(groupUid, { visible }));
							}}
						/>
					)}
					<span>Annotation {$dicom(series.dicomJson, DicomTag.SeriesNumber) ?? 'Untitled'}</span>
					<Icon
						icon={mdiChevronDown}
						className={`ml-auto mr-0 inline-block h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
					/>
				</div>
			</div>
			<ul className={isOpen ? 'block' : 'hidden'}>
				{Object.entries(configs).map(([groupUid, group], index) => {
					return (
						<li key={index} className="hover:bg-gray-100">
							<div className="ml-2 flex items-center px-3">
								{group.loading ? (
									<div className="spinner-sm border-green-500" />
								) : (
									<input
										type="checkbox"
										className="rounded-sm text-green-500 focus:ring-0 focus:ring-offset-0"
										checked={group.visible}
										onChange={() => updateAnnotation(groupUid, { visible: !group.visible })}
									/>
								)}
								{/* eslint-disable-next-line react/jsx-no-undef */}
								<Description
									dicomJson={series.groups[groupUid]}
									fields={[
										{ tag: DicomTag.AnnotationGroupLabel, label: 'Label' },
										{ tag: DicomTag.GraphicType, label: 'Graphic Type' },
									]}
								/>
							</div>
						</li>
					);
				})}
			</ul>
		</li>
	);
}

export interface AnnotationListProps {
	annotations: AnnotationMap;
	updateAnnotation: (seriesUid: string, groupUid: string, update: Partial<AnnotationConfig>) => void;
}

export default function AnnotationList({ annotations, updateAnnotation }: Readonly<AnnotationListProps>) {
	if (!annotations) {
		return null;
	}

	return (
		<ul>
			{Object.entries(annotations.series).map(([seriesUid, series]) => {
				return (
					<AnnotationGroupList
						key={seriesUid}
						series={series}
						configs={annotations.configs[seriesUid]}
						updateAnnotation={updateAnnotation.bind(null, seriesUid)}
					/>
				);
			})}
		</ul>
	);
}
