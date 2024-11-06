import 'server-only';

import { IronSession, SessionOptions, getIronSession } from 'iron-session';
import { allowInsecureRequests, discovery } from 'openid-client';
import { cookies } from 'next/headers';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const origin = new URL(basePath + '/', process.env.ORIGIN || 'http://localhost:3000').href;

/** Whether authentication is enabled */
export const isAuthEnabled = process.env.AUTH_ENABLED === 'true';

/** OIDC Authentication Configuration */
export const config = Object.freeze({
	origin: origin,
	issuer: process.env.OIDC_ISSUER ? new URL(process.env.OIDC_ISSUER) : undefined,
	clientId: process.env.OIDC_CLIENT_ID,
	clientSecret: process.env.OIDC_CLIENT_SECRET,
	scope: 'openid profile email',
	responseType: 'code',
	grantType: 'authorization_code',
	postLoginRoute: origin,
});

export function getClient() {
	return discovery(config.issuer!, config.clientId!, config.clientSecret, undefined, {
		execute: [allowInsecureRequests],
	});
}

export interface SessionData {
	isLoggedIn: boolean;
	codeVerifier?: string;
	userInfo?: {
		sub: string;
		name: string;
		email: string;
		emailVerified: boolean;
	};
	tenantId?: string;
}

export const defaultSession: SessionData = {
	isLoggedIn: false,
	codeVerifier: undefined,
	userInfo: undefined,
	tenantId: undefined,
};

export const sessionOptions: SessionOptions = {
	password: process.env.AUTH_SECRET!,
	cookieName: 'session',
	cookieOptions: {
		// secure only works in `https` environments
		// if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
		secure: process.env.NODE_ENV === 'production',
	},
	ttl: 60 * 60 * 24 * 7, // 1 week
};

export async function getSession(): Promise<IronSession<SessionData>> {
	const cookieStore = cookies();

	const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
	if (!session.isLoggedIn) {
		session.userInfo = defaultSession.userInfo;
	}

	return session;
}
