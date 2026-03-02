export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getAuthUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Push token required' }, { status: 400 });
    }

    // Store the push token
    await getAdminDb().collection('pushTokens').doc(user.uid).set(
      {
        token,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
        platform: 'web',
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push registration error:', error);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
