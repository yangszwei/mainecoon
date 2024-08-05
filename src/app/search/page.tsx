'use client';

import Drawer, { DrawerSection } from '@/app/_components/Drawer';
import type { DicomJson } from '@/lib/dicom-web';
import Header from '@/app/_components/Header';
import { Icon } from '@iconify/react';
import SearchForm from './SearchForm';
import SearchResultTable from './SearchResultTable';
import ServerSelect from './ServerSelect';
import mdiGithub from '@iconify-icons/mdi/github';
import { servers } from '@/config/dicom-web';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function SearchPage() {
	const searchParams = useSearchParams();
	const [server, setServer] = useState(servers[searchParams.get('server')!] || servers.default);
	const [studies, setStudies] = useState<DicomJson[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	return (
		<>
			<Header className="h-16" server={server} />
			<div className="flex h-full pt-16">
				<Drawer>
					<DrawerSection title="Server" fixed>
						<ServerSelect server={server} setServer={setServer} />
					</DrawerSection>
					<DrawerSection title="Search Filter" fixed>
						<SearchForm server={server} setStudies={setStudies} isLoadingState={[isLoading, setIsLoading]} />
					</DrawerSection>
					<div className="mt-auto p-3">
						<a href="https://github.com/yangszwei/mainecoon" className="inline-block">
							<Icon icon={mdiGithub} className="text-xl" ssr={true} />
						</a>
					</div>
				</Drawer>
				<main className="m-3 grow overflow-hidden rounded bg-white shadow">
					<SearchResultTable server={server} studies={studies} isLoading={isLoading} />
				</main>
			</div>
		</>
	);
}
