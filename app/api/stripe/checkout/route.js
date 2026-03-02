export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { getAuthUser } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const user = getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create Stripe customer
    const userDoc = await getAdminDb().collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    let customerId = userData?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { firebaseUid: user.uid },
      });
      customerId = customer.id;

      // Save Stripe customer ID
      await getAdminDb().collection('users').doc(user.uid).update({
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}?cancelled=true`,
      metadata: {
        firebaseUid: user.uid,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
