/** The type definition for the available DICOMweb servers map. */
export type DicomServerConfig = { [key: string]: { name: string; url: string } };

/** The available DICOMweb servers, keyed by display name. */
export const servers: DicomServerConfig = (() => {
	const servers: DicomServerConfig = {};

	const serversString = process.env.NEXT_PUBLIC_DICOMWEB_SERVERS || '';
	for (const serverString of serversString.split(',')) {
		const parts = serverString.split('=');
		let [name, url] = parts.length > 1 ? parts : [new URL(parts[0]).host, parts[0]];
		if (Object.hasOwn(servers, name)) throw new Error(`Duplicate DICOMweb server name: ${name}`);
		if (!servers.default) servers.default = { name, url };
		servers[name || new URL(url).origin] = { name, url };
	}

	return servers;
})();
