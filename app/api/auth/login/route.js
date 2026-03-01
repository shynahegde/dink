export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Look up user in Firestore
    const usersRef = getAdminDb().collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Verify password
    const valid = await bcrypt.compare(password, userData.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({
      uid: userDoc.id,
      email: userData.email,
      name: userData.name,
      subscribed: userData.subscribed || false,
    });

    const response = NextResponse.json({
      user: {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name,
        subscribed: userData.subscribed || false,
        duprId: userData.duprId || null,
        region: userData.region || 'US',
      },
    });

    // Set auth cookie
    response.headers.set('Set-Cookie', setAuthCookie(token)['Set-Cookie']);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
