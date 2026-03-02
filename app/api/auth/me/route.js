export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const tokenUser = getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Fetch latest user data from Firestore
    try {
      const userDoc = await getAdminDb().collection('users').doc(tokenUser.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        return NextResponse.json({
          user: {
            uid: tokenUser.uid,
            email: userData.email,
            name: userData.name,
            subscribed: userData.subscribed || false,
            duprId: userData.duprId || null,
            region: userData.region || 'US',
            avatar: userData.avatar || null,
          },
        });
      }
    } catch (dbError) {
      // If Firestore fails, return what we have from the JWT
      console.error('Firestore lookup failed:', dbError);
    }

    // Fallback to JWT data
    return NextResponse.json({
      user: {
        uid: tokenUser.uid,
        email: tokenUser.email,
        name: tokenUser.name,
        subscribed: tokenUser.subscribed || false,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
