'use client';

import Drawer, { DrawerSection } from '@/app/_components/Drawer';
import { useEffect, useState } from 'react';
import type { DicomJson } from '@/lib/dicom-web';
import Header from '@/app/_components/Header';
import SearchForm from './SearchForm';
import SearchResultTable from './SearchResultTable';
import { getStudies } from '@/app/search/actions';
import { servers } from '@/config/dicom-web';

export default function SearchPage() {
	const [server, setServer] = useState(servers.default);
	const [studies, setStudies] = useState<DicomJson[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Get initial studies when the server url loads.
	useEffect(() => {
		const initialFormData = new FormData();
		initialFormData.set('baseUrl', server.url);
		initialFormData.set('limit', '10');
		initialFormData.set('offset', '0');
		getStudies(initialFormData).then((studies) => {
			setStudies(studies);
			setIsLoading(false);
		});
	}, [server]);

	return (
		<>
			<Header className="h-16" />
			<div className="flex h-full pt-16">
				<Drawer>
					<DrawerSection title="Search Filter" fixed>
						<SearchForm server={server} setStudies={setStudies} isLoadingState={[isLoading, setIsLoading]} />
					</DrawerSection>
				</Drawer>
				<main className="m-3 grow overflow-hidden rounded bg-white shadow">
					<SearchResultTable server={server} studies={studies} isLoading={isLoading} />
				</main>
			</div>
		</>
	);
}
