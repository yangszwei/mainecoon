import type { Annotation, AnnotationMap, AnnotationMapAction } from './annotation';
import { Icon } from '@iconify/react';
import mdiChevronDown from '@iconify-icons/mdi/chevron-down';
import mdiCloseThick from '@iconify-icons/mdi/close-thick';
import { useState } from 'react';

function AnnotationGroupItem({ annotation }: Readonly<{ annotation: Annotation }>) {
	const fields = [
		{ name: 'Label', value: annotation.name },
		{ name: 'Graphic Type', value: annotation.graphicType },
		{ name: 'Count', value: annotation.numberOfAnnotations.toLocaleString() },
	];

	return (
		<>
			<ul className="space-y-0.5 p-3 text-sm">
				{fields.map(({ name, value }) => (
					<li key={name}>
						<span className="after:pl-0.5 after:pr-1.5 after:content-[':']">{name}</span>
						<strong className="inline">{value}</strong>
					</li>
				))}
			</ul>
		</>
	);
}

interface AnnotationGroupListProps {
	index: number;
	seriesUid: string;
	groupMap: AnnotationMap[string]['groupMap'];
	updateAnnotationMap: (action: AnnotationMapAction) => void;
}

function AnnotationGroupList({ index, seriesUid, groupMap, updateAnnotationMap }: Readonly<AnnotationGroupListProps>) {
	const [open, setOpen] = useState(true);
	const isOpen = open;

	if (!seriesUid || !groupMap) {
		return null;
	}

	return (
		<li>
			<div className="bg-green-100/60" onClick={() => setOpen(!open)}>
				<div className="flex w-full cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm">
					{Object.values(groupMap).some((group) => group.status === 'initialized' || group.status === 'loading') ? (
						<div className="spinner-sm border-green-500" />
					) : (
						<input
							type="checkbox"
							className="rounded-sm text-green-500 focus:ring-0 focus:ring-offset-0"
							checked={Object.values(groupMap).every((group) => group.visible)}
							onClick={(e) => {
								e.stopPropagation();
							}}
							onChange={(e) => {
								const visible = !Object.values(groupMap).every((group) => group.visible);
								Object.keys(groupMap).forEach((groupUid) =>
									updateAnnotationMap({ type: 'update', seriesUid, groupUid, annotation: { visible } }),
								);
							}}
						/>
					)}
					<span>Annotation {index + 1}</span>
					<Icon
						icon={mdiChevronDown}
						className={`ml-auto mr-0 inline-block h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}
					/>
				</div>
			</div>
			<ul className={isOpen ? 'block' : 'hidden'}>
				{Object.entries(groupMap).map(([groupUid, group], index) => {
					return (
						<li key={index} className="hover:bg-gray-100">
							<div className="ml-2 flex items-center px-3">
								{group.status === 'initialized' || group.status === 'loading' ? (
									<div className="spinner-sm border-green-500" />
								) : group.status === 'error' ? (
									<div className="relative">
										<div className="spinner-sm border-transparent" />
										<Icon icon={mdiCloseThick} className="absolute inset-0 -left-0.5 h-5 w-5 text-red-500" />
									</div>
								) : (
									<input
										type="checkbox"
										className="rounded-sm text-green-500 focus:ring-0 focus:ring-offset-0"
										checked={group.visible}
										onChange={() => {
											updateAnnotationMap({
												type: 'update',
												seriesUid,
												groupUid,
												annotation: { visible: !group.visible },
											});
										}}
									/>
								)}
								<AnnotationGroupItem annotation={group} />
							</div>
						</li>
					);
				})}
			</ul>
		</li>
	);
}

export interface AnnotationListProps {
	annotationMap: AnnotationMap;
	updateAnnotationMap: (action: AnnotationMapAction) => void;
	notFound: boolean;
}

export default function AnnotationList({
	annotationMap,
	updateAnnotationMap,
	notFound,
}: Readonly<AnnotationListProps>) {
	if (annotationMap.loading && !notFound) {
		return (
			<p className="p-3 text-center">
				<span className="spinner-sm border-green-500" />
			</p>
		);
	}

	if (Object.keys(annotationMap).length === 0 || notFound) {
		return <p className="p-3.5 text-center text-sm tracking-wide text-gray-500">No annotations available</p>;
	}

	return (
		<ul>
			{Object.entries(annotationMap).map(([seriesUid, series], index) => {
				return (
					<AnnotationGroupList
						key={seriesUid}
						index={index}
						seriesUid={seriesUid}
						groupMap={series.groupMap}
						updateAnnotationMap={updateAnnotationMap}
					/>
				);
			})}
		</ul>
	);
}
