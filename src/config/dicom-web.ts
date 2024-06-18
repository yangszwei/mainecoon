/** The type definition for the available DICOMweb servers map. */
export type DicomServerConfig = { default: string; [key: string]: string };

/** The available DICOMweb servers, keyed by display name. */
export const servers: DicomServerConfig = (() => {
	const servers: DicomServerConfig = { default: '' };

	const serversString = process.env.NEXT_PUBLIC_DICOMWEB_SERVERS || '';
	for (const serverString of serversString.split(',')) {
		const parts = serverString.split('=');
		const [name, url] = [parts[0], parts[1] || parts[0]];
		if (!servers.default) servers.default = url;
		servers[name || new URL(url).origin] = url;
	}

	return servers;
})();
