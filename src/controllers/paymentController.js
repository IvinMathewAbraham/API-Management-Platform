import User from "../models/User.js";
import {
  createCheckoutSession,
  createPortalSession,
  constructWebhookEvent,
} from "../services/stripeService.js";

/**
 * POST /payment/checkout
 * Creates a Stripe Checkout session and returns the redirect URL.
 */
export const checkout = async (req, res) => {
  const user = req.user;

  if (user.plan === "pro") {
    return res.status(400).json({ message: "You already have the Pro plan." });
  }

  const session = await createCheckoutSession({
    userId: user._id,
    userEmail: user.email,
  });

  res.json({ url: session.url });
};

/**
 * POST /payment/portal
 * Creates a Stripe Billing Portal session for subscription management.
 */
export const portal = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.stripeCustomerId) {
    return res.status(400).json({ message: "No Stripe billing account found." });
  }

  const session = await createPortalSession({ customerId: user.stripeCustomerId });
  res.json({ url: session.url });
};

/**
 * POST /payment/webhook
 * Handles Stripe webhook events (raw body required — set up in route).
 */
export const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error("[Stripe] Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // Payment completed — upgrade user to Pro
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (userId) {
          await User.findByIdAndUpdate(userId, {
            plan: "pro",
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          });
          console.log(`[Stripe] User ${userId} upgraded to Pro`);
        }
        break;
      }

      // Subscription cancelled (via portal or non-payment) — downgrade to Free
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await User.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          { plan: "free", stripeSubscriptionId: null }
        );
        console.log(`[Stripe] Subscription ${sub.id} cancelled — user downgraded to Free`);
        break;
      }

      // Payment failed — log warning (you can email the user here)
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn(`[Stripe] Payment failed for customer ${invoice.customer}`);
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error("[Stripe] Webhook handler error:", err.message);
    // Still return 200 so Stripe doesn't retry indefinitely
  }

  res.json({ received: true });
};
