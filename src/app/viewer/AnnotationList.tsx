import type { Annotation, AnnotationMap, AnnotationMapAction } from './annotation';
import { useEffect, useRef } from 'react';
import GeometryPicker from './GeometryPicker';
import { GraphicType } from './annotation';
import { Icon } from '@iconify/react';
import type React from 'react';
import mdiChevronDown from '@iconify-icons/mdi/chevron-down';
import mdiCloseThick from '@iconify-icons/mdi/close-thick';
import mdiDelete from '@iconify-icons/mdi/delete';
import mdiPlus from '@iconify-icons/mdi/plus';
import { useState } from 'react';

function ErrorIndicator() {
	return (
		<div className="relative">
			<div className="spinner-sm border-transparent" />
			<Icon icon={mdiCloseThick} className="absolute inset-0 -left-0.5 h-5 w-5 text-red-500" />
		</div>
	);
}

function AnnotationGroupItem({ annotation }: Readonly<{ annotation: Annotation }>) {
	const fields = [
		{ name: 'Label', value: annotation.name },
		{ name: 'Graphic Type', value: annotation.graphicType },
		{ name: 'Count', value: annotation.numberOfAnnotations.toLocaleString() },
	];

	return (
		<ul className="grow space-y-0.5 p-3 text-sm">
			{fields.map(({ name, value }) => (
				<li key={name}>
					<span className="after:pl-0.5 after:pr-1.5 after:content-[':']">{name}</span>
					<strong className="inline">{value}</strong>
				</li>
			))}
		</ul>
	);
}

interface AnnotationGroupListProps {
	index: number;
	seriesUid: string;
	series: AnnotationMap[string];
	updateAnnotationMap: (action: AnnotationMapAction) => void;
	currentAnnotation: Annotation | null;
	setCurrentAnnotation: (annotation: Annotation | null) => void;
}

function AnnotationGroupList({
	index,
	seriesUid,
	series,
	updateAnnotationMap,
	currentAnnotation,
	setCurrentAnnotation,
}: Readonly<AnnotationGroupListProps>) {
	const [open, setOpen] = useState(series.editable);
	const [showGeometryPicker, setShowGeometryPicker] = useState(false);
	const popoverRef = useRef<HTMLDivElement | null>(null);

	useClickOutside(popoverRef, () => setShowGeometryPicker(false));

	if (!seriesUid || !series) {
		return null;
	}

	function selectGroup(group: Annotation) {
		if (!group.editable) return;

		if (currentAnnotation?.seriesUid === seriesUid && currentAnnotation?.groupUid === group.groupUid) {
			setCurrentAnnotation(null);
			return;
		}

		setCurrentAnnotation(group);
		updateAnnotationMap({ type: 'update', seriesUid, groupUid: group.groupUid, annotation: { visible: true } });
	}

	function isGroupSelected(groupUid: string) {
		return currentAnnotation && currentAnnotation.seriesUid === seriesUid && currentAnnotation.groupUid === groupUid;
	}

	function createGroup(graphicType: GraphicType) {
		setShowGeometryPicker(false);
		updateAnnotationMap({
			type: 'create',
			seriesUid,
			annotation: { name: 'Untitled Annotation', color: '#000000', graphicType },
		});
	}

	function deleteGroup(e: React.MouseEvent, groupUid: string) {
		e.stopPropagation();
		updateAnnotationMap({ type: 'delete', seriesUid, groupUid });
	}

	return (
		<li>
			<div className="bg-green-100/60" onClick={() => setOpen(!open)}>
				<div className="flex w-full cursor-pointer select-none items-center gap-3 px-3 py-2 text-sm">
					{Object.values(series.groupMap).some(
						(group) => group.status === 'initialized' || group.status === 'loading',
					) ? (
						<div className="spinner-sm border-green-500" />
					) : Object.values(series.groupMap).every((g) => g.status === 'error') ? (
						<ErrorIndicator />
					) : (
						<input
							type="checkbox"
							className="rounded-sm text-green-500 focus:ring-0 focus:ring-offset-0"
							checked={Object.values(series.groupMap).every((group) => group.visible)}
							onClick={(e) => {
								e.stopPropagation();
							}}
							onChange={(e) => {
								const visible = !Object.values(series.groupMap).every((group) => group.visible);
								Object.keys(series.groupMap).forEach((groupUid) =>
									updateAnnotationMap({ type: 'update', seriesUid, groupUid, annotation: { visible } }),
								);
							}}
						/>
					)}
					<span className={series.editable ? 'italic' : ''}>Annotation {index + 1}</span>
					<div className="ml-auto mr-0 flex items-center space-x-3">
						{series.editable && (
							<div className="relative flex items-center">
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setShowGeometryPicker(true);
									}}
								>
									<Icon icon={mdiPlus} className="h-4 w-4" />
								</button>
								{showGeometryPicker && (
									<div
										ref={popoverRef}
										className="absolute right-0 top-full z-10 mt-2 flex flex-col rounded border bg-white p-1 shadow-lg"
									>
										<GeometryPicker onClick={(e) => e.stopPropagation()} onPick={createGroup} />
									</div>
								)}
							</div>
						)}
						<Icon
							icon={mdiChevronDown}
							className={`inline-block h-5 w-5 transition-transform ${open ? 'rotate-180' : 'rotate-0'}`}
						/>
					</div>
				</div>
			</div>
			<ul className={open ? 'block' : 'hidden'}>
				{Object.entries(series.groupMap).map(([groupUid, group], index) => {
					return (
						<li
							key={index}
							className={`${group.editable ? 'cursor-pointer' : 'cursor-default'} select-none hover:bg-gray-100 ${isGroupSelected(groupUid) ? 'bg-gray-800/10 hover:bg-gray-800/10' : ''}`}
							onClick={() => selectGroup(group)}
						>
							<div className="ml-2 flex items-center px-3">
								{group.status === 'initialized' || group.status === 'loading' ? (
									<div className="spinner-sm border-green-500" />
								) : group.status === 'error' ? (
									<ErrorIndicator />
								) : (
									<input
										type="checkbox"
										className="rounded-sm text-green-500 focus:ring-0 focus:ring-offset-0 disabled:text-gray-500/80"
										checked={group.visible}
										onClick={(e) => e.stopPropagation()}
										onChange={() => {
											const visible = isGroupSelected(groupUid) ? true : !group.visible;
											updateAnnotationMap({ type: 'update', seriesUid, groupUid, annotation: { visible } });
										}}
										disabled={isGroupSelected(groupUid) || undefined}
									/>
								)}

								<AnnotationGroupItem annotation={group} />

								{/* Action Buttons */}
								{group.editable && (
									<div className="flex items-center gap-1.5">
										<button
											type="button"
											className="rounded-full p-1 transition-colors hover:bg-black/10"
											onClick={(e) => deleteGroup(e, groupUid)}
										>
											<Icon icon={mdiDelete} className="h-5 w-5 text-red-500" />
										</button>
									</div>
								)}
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
	currentAnnotation: Annotation | null;
	setCurrentAnnotation: (annotation: Annotation | null) => void;
	loading: boolean;
}

export default function AnnotationList({
	annotationMap,
	updateAnnotationMap,
	currentAnnotation,
	setCurrentAnnotation,
	loading,
}: Readonly<AnnotationListProps>) {
	const [showGeometryPicker, setShowGeometryPicker] = useState(false);
	const popoverRef = useRef<HTMLDivElement | null>(null);

	useClickOutside(popoverRef, () => setShowGeometryPicker(false));

	if (loading) {
		return (
			<p className="p-3 text-center">
				<span className="spinner-sm border-green-500" />
			</p>
		);
	}

	function createSeries(graphicType: GraphicType) {
		setShowGeometryPicker(false);
		updateAnnotationMap({
			type: 'create',
			annotation: { name: 'Untitled Annotation', color: '#000000', graphicType },
		});
	}

	return (
		<ul>
			{Object.keys(annotationMap).length > 0 ? (
				Object.entries(annotationMap).map(([seriesUid, series], index) => {
					return (
						<AnnotationGroupList
							key={seriesUid}
							index={index}
							seriesUid={seriesUid}
							series={series}
							updateAnnotationMap={updateAnnotationMap}
							currentAnnotation={currentAnnotation}
							setCurrentAnnotation={setCurrentAnnotation}
						/>
					);
				})
			) : (
				<p className="mt-1 p-3 text-center text-sm tracking-wide text-gray-500">No annotations available</p>
			)}
			<li className="relative flex justify-center">
				<button
					type="button"
					className="mx-auto my-3 block rounded bg-green-500 px-2 py-1 text-center text-xs text-white"
					onClick={() => setShowGeometryPicker(true)}
				>
					Create Series
				</button>
				{showGeometryPicker && (
					<div ref={popoverRef} className="absolute top-full mt-2 flex flex-col rounded border bg-white p-1 shadow-lg">
						<GeometryPicker onPick={createSeries} />
					</div>
				)}
			</li>
		</ul>
	);
}

function useClickOutside(ref: React.RefObject<HTMLElement>, handler: (event: MouseEvent) => void) {
	useEffect(() => {
		const listener = (event: MouseEvent) => {
			if (!ref.current || ref.current.contains(event.target as Node)) {
				return;
			}
			handler(event);
		};

		document.addEventListener('mousedown', listener);

		return () => {
			document.removeEventListener('mousedown', listener);
		};
	}, [ref, handler]);
}
