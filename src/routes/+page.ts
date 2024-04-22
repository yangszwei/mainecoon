import type { PageLoad } from './$types';
import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async () => {
	return redirect(303, `${base}/search`);
};
