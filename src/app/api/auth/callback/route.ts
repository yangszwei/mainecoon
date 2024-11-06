import { authorizationCodeGrant, fetchUserInfo } from 'openid-client';
import { config, getClient, getSession } from '@/lib/auth';
import { basePath } from '@/lib/constants';
import { cookies } from 'next/headers';

// GET /api/auth/callback - Callback route for the OIDC Authorization Code Flow
export async function GET(request: Request) {
	const session = await getSession();
	const client = await getClient();
	const cookieStore = cookies();

	// See: https://github.com/vercel/next.js/issues/62756
	const url = new URL(request.url);
	if (basePath.length > 0 && !url.pathname.startsWith(basePath)) {
		url.pathname = basePath + url.pathname;
	}

	// Exchange the authorization code for tokens
	const tokens = await authorizationCodeGrant(client, url, {
		pkceCodeVerifier: session.codeVerifier,
	});

	// Fetch the user info
	const userinfo = await fetchUserInfo(client, tokens.access_token!, tokens.claims()?.sub!);

	// Update & save the session
	session.isLoggedIn = true;
	session.userInfo = {
		sub: userinfo.sub,
		name: userinfo.given_name || userinfo.name || userinfo.preferred_username || 'Unknown',
		email: userinfo.email!,
		emailVerified: userinfo.email_verified!,
	};

	session.codeVerifier = undefined;

	await session.save();

	// Set the tokens in cookies
	const cookieOptions = {
		httpOnly: true,
		maxAge: 60 * 60 * 24 * 7, // 1 week
		path: basePath + '/',
		sameSite: 'lax' as const,
	};

	if (tokens.id_token) {
		cookieStore.set('idToken', tokens.id_token, cookieOptions);
	}

	cookieStore.set('accessToken', tokens.access_token, cookieOptions);

	// Redirect to the home page
	return Response.redirect(config.origin!, 302);
}
