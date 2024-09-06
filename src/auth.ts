import Keycloak from 'next-auth/providers/keycloak';
import NextAuth from 'next-auth';

declare module 'next-auth' {
	interface Session {
		accessToken: string;
	}
}

export const { handlers, signIn, signOut, auth } = NextAuth({
	providers: [Keycloak],
	callbacks: {
		jwt: async ({ token, account }) => {
			if (account) {
				token.accessToken = account.access_token;
			}
			return token;
		},
		session: async ({ session, token }) => {
			return { ...session, accessToken: token.accessToken };
		},
	},
});
