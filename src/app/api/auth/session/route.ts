import { defaultSession, getSession, isAuthEnabled } from '@/lib/auth';

// GET /api/auth/session - Get the current session
export async function GET() {
	try {
		if (!isAuthEnabled) {
			return Response.json(defaultSession);
		}

		const session = await getSession();
		if (!session.isLoggedIn) {
			return Response.json(defaultSession);
		}

		return Response.json({
			isLoggedIn: session.isLoggedIn,
			userInfo: session.userInfo,
		});
	} catch (error) {
		return Response.json({ error }, { status: 500 });
	}
}
