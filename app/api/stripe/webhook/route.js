export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.metadata.firebaseUid;
        if (uid) {
          await getAdminDb().collection('users').doc(uid).update({
            subscribed: true,
            stripeSubscriptionId: session.subscription,
            subscribedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Find user by Stripe customer ID
        const usersRef = getAdminDb().collection('users');
        const snapshot = await usersRef
          .where('stripeCustomerId', '==', subscription.customer)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            subscribed: false,
            cancelledAt: new Date().toISOString(),
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const usersRef = getAdminDb().collection('users');
        const snapshot = await usersRef
          .where('stripeCustomerId', '==', invoice.customer)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            paymentFailed: true,
            paymentFailedAt: new Date().toISOString(),
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// Stripe webhooks need raw body
//export const config = {
  //api: { bodyParser: false },
//};
