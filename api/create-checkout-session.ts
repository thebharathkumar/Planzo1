import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

interface CartItem {
  eventId: string;
  eventTitle: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({
      error: "Stripe is not configured. Set STRIPE_SECRET_KEY in Vercel environment variables.",
    });
  }

  try {
    const { items, origin } = req.body as { items: CartItem[]; origin?: string };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    const baseUrl =
      origin ||
      (req.headers.origin as string) ||
      `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: `${item.eventTitle} — ${item.tierName}`,
            metadata: {
              eventId: item.eventId,
              tierId: item.tierId,
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
