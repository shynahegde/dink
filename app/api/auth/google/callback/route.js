export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { signToken, setAuthCookie } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=no_code`);
    }

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userInfoRes.json();

    // Find or create user in Firestore
    const usersRef = getAdminDb().collection('users');
    let snapshot = await usersRef.where('email', '==', googleUser.email).limit(1).get();

    let userId;
    let userData;

    if (snapshot.empty) {
      // Create new user
      const newUser = {
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        provider: 'google',
        subscribed: false,
        stripeCustomerId: null,
        duprId: null,
        region: 'US',
        fontSize: 'medium',
        createdAt: new Date().toISOString(),
      };
      const docRef = await usersRef.add(newUser);
      userId = docRef.id;
      userData = newUser;
    } else {
      userId = snapshot.docs[0].id;
      userData = snapshot.docs[0].data();
    }

    const token = signToken({
      uid: userId,
      email: userData.email,
      name: userData.name,
      subscribed: userData.subscribed || false,
    });

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}?auth=success`
    );
    response.headers.set('Set-Cookie', setAuthCookie(token)['Set-Cookie']);
    return response;
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}?error=auth_failed`);
  }
}
