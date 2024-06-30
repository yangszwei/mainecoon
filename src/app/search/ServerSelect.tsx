import { DicomServer, servers } from '@/config/dicom-web';

export interface ServerSelectProps {
	/** The current DICOMweb server. */
	server: DicomServer;
	/** The function to set the current server. */
	setServer: (server: DicomServer) => void;
}

export default function ServerSelect({ server, setServer }: Readonly<ServerSelectProps>) {
	const options = Object.keys(servers).filter((name) => name !== 'default');

	return (
		<div className="p-3">
			{options.length > 1 ? (
				<select
					className="w-full text-ellipsis whitespace-pre-wrap border-none p-0 pr-8 text-sm focus:outline-0 focus:ring-0"
					value={server.name}
					onChange={(e) => setServer(servers[e.target.value])}
				>
					{options.map((name) => (
						<option key={name} value={name}>
							{servers[name].raw.replace('=', ' - ')}
						</option>
					))}
				</select>
			) : (
				<p className="text-sm">{server.raw.replace('=', ' - ')}</p>
			)}
		</div>
	);
}
