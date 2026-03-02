export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { signToken, setAuthCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if user exists
    const usersRef = getAdminDb().collection('users');
    const existing = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();

    if (!existing.empty) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const userRef = await usersRef.add({
      name,
      email: email.toLowerCase(),
      passwordHash,
      subscribed: false,
      stripeCustomerId: null,
      duprId: null,
      region: 'US',
      fontSize: 'medium',
      createdAt: new Date().toISOString(),
    });

    const token = signToken({
      uid: userRef.id,
      email: email.toLowerCase(),
      name,
      subscribed: false,
    });

    const response = NextResponse.json({
      user: {
        uid: userRef.id,
        email: email.toLowerCase(),
        name,
        subscribed: false,
      },
    });

    response.headers.set('Set-Cookie', setAuthCookie(token)['Set-Cookie']);
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
