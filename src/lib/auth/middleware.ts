import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { basePath } from '@/lib/constants';
import { getSession } from '@/lib/auth';

/** A middleware to enforce user authentication. */
export async function authorize(request: NextRequest): Promise<NextResponse> {
	const session = await getSession();
	const pathname = request.nextUrl.pathname;
	if (!session.isLoggedIn && !pathname.startsWith('/api/auth')) {
		return NextResponse.redirect(new URL(`${basePath}/api/auth/login`, request.url));
	}

	return NextResponse.next();
}
