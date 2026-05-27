// services/billing.service.js

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (user, plan, isYearly) => {

    const priceId = getPriceId(plan, isYearly);

    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        customer_email: user.email,
        success_url: `${process.env.FRONT_URL}/success`,
        cancel_url: `${process.env.FRONT_URL}/pricing`,
    });

    return session.url;
};