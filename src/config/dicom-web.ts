/** The config for a single DICOMweb server. */
export type DicomServer = { name: string; url: string; raw: string };

/** The available DICOMweb servers, keyed by display name. */
export const servers: { [name: string]: DicomServer } = (() => {
	const servers: { [name: string]: DicomServer } = {};

	const serversString = process.env.NEXT_PUBLIC_DICOMWEB_SERVERS || '';
	for (const serverString of serversString.split(',')) {
		const parts = serverString.split('=');
		let [name, url] = parts.length > 1 ? parts : [new URL(parts[0]).host, parts[0]];
		if (Object.hasOwn(servers, name)) throw new Error(`Duplicate DICOMweb server name: ${name}`);
		if (!servers.default) servers.default = { name, url, raw: serverString };
		servers[name || new URL(url).origin] = { name, url, raw: serverString };
	}

	return servers;
})();
