export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.headers.set(
    'Set-Cookie',
    'dink_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure'
  );
  return response;
}
