import { buildAuthorizationUrl, calculatePKCECodeChallenge, randomPKCECodeVerifier } from 'openid-client';
import { config, getClient, getSession, isAuthEnabled } from '@/lib/auth';

// GET /api/auth/login - Login route
export async function GET() {
	if (!isAuthEnabled) {
		return Response.redirect(config.postLoginRoute!);
	}

	const session = await getSession();
	const client = await getClient();

	// Generate a random code verifier and PKCE challenge
	session.codeVerifier = randomPKCECodeVerifier();

	// Build the authorization URL
	const authorizationUrl = buildAuthorizationUrl(client, {
		scope: config.scope,
		audience: config.issuer!.href,
		redirect_uri: new URL('./api/auth/callback', config.origin!).href,
		code_challenge: await calculatePKCECodeChallenge(session.codeVerifier),
		code_challenge_method: 'S256',
	});

	// Save the session
	await session.save();

	return Response.redirect(authorizationUrl);
}
