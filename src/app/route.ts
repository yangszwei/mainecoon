import { basePath } from '@/lib/constants';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
	redirect(`${basePath}/search${new URL(request.url).search}`);
}
