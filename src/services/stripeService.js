import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout session for the Pro plan.
 */
export const createCheckoutSession = async ({ userId, userEmail }) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    customer_email: userEmail,
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/plans?session_id={CHECKOUT_SESSION_ID}&success=1`,
    cancel_url: `${process.env.FRONTEND_URL}/plans?canceled=1`,
    metadata: { userId: userId.toString() },
    subscription_data: {
      metadata: { userId: userId.toString() },
    },
  });
  return session;
};

/**
 * Create a Stripe Billing Portal session so the user can manage / cancel.
 */
export const createPortalSession = async ({ customerId }) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.FRONTEND_URL}/plans`,
  });
  return session;
};

/**
 * Retrieve a Checkout session by ID (used to verify payment without a webhook).
 */
export const retrieveCheckoutSession = async (sessionId) => {
  return stripe.checkout.sessions.retrieve(sessionId);
};

/**
 * Verify and parse an incoming Stripe webhook payload.
 */
export const constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};
