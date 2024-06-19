import { basePath } from '@/lib/constants';
import { redirect } from 'next/navigation';

export async function GET() {
	redirect(`${basePath}/search`);
}
