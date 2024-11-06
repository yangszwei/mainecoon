import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authorize } from '@/lib/auth/middleware';
import { isAuthEnabled } from '@/lib/auth';

export default function middleware(request: NextRequest) {
	if (isAuthEnabled) {
		return authorize(request);
	}

	return NextResponse.next();
}
