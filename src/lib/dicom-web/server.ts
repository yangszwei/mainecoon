import { derived, writable } from 'svelte/store';
import { DICOMWEB_URLS } from '$lib/dicom-web/index';

export const DICOMWEB_SERVER = writable('');

export const DICOMWEB_URL = derived(DICOMWEB_SERVER, ($DICOMWEB_SERVER) => {
	const server = DICOMWEB_URLS.find((url) => url.name === $DICOMWEB_SERVER);
	return server?.url ?? DICOMWEB_URLS[0].url;
});

export const getDicomwebUrl = (name: string) => {
	let serverIndex = DICOMWEB_URLS.findIndex((server) => name === server.name);
	if (serverIndex === -1) {
		serverIndex = 0;
	}
	return DICOMWEB_URLS[serverIndex].url;
};
