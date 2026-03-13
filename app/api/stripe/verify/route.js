export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ active: false, error: 'No session ID' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const active = session.payment_status === 'paid' || session.status === 'complete';

    // Persist subscription status to Firestore so it survives page refresh
    if (active) {
      const uid = session.metadata?.firebaseUid;
      if (uid) {
        await getAdminDb().collection('users').doc(uid).update({
          subscribed: true,
          stripeSubscriptionId: session.subscription,
          stripeCustomerId: session.customer,
          subscribedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      active,
      customerId: session.customer,
      subscriptionId: session.subscription,
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
