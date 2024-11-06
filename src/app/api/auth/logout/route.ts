import { buildEndSessionUrl, randomState } from 'openid-client';
import { config, getClient, getSession, isAuthEnabled } from '@/lib/auth';
import { basePath } from '@/lib/constants';
import { cookies } from 'next/headers';

// GET /api/auth/logout - Logout route
export async function GET() {
	if (!isAuthEnabled) {
		return Response.redirect(config.postLoginRoute!);
	}

	const session = await getSession();
	const client = await getClient();
	const cookieStore = await cookies();
	const idToken = cookieStore.get('idToken')?.value;

	const endSessionUrl = buildEndSessionUrl(client, {
		post_logout_redirect_uri: config.origin!,
		state: randomState(),
		...(idToken && { id_token_hint: idToken }),
	});

	session.destroy();

	cookieStore.set('idToken', '', { path: basePath + '/', maxAge: 0 });
	cookieStore.set('accessToken', '', { path: basePath + '/', maxAge: 0 });

	return Response.redirect(endSessionUrl, 302);
}
