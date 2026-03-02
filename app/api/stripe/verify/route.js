export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ active: false, error: 'No session ID' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      active: session.payment_status === 'paid' || session.status === 'complete',
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
