import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (email, plan = "PRO") => {

    const prices = {
        PRO: 2900,
        BUSINESS: 4900
    };

    const session = await stripe.checkout.sessions.create({

        payment_method_types: ["card"],
        mode: "subscription",

        customer_email: email,

        line_items: [
            {
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: `SEO Tool ${plan}`,
                    },
                    recurring: {
                        interval: "month",
                    },
                    unit_amount: prices[plan] || 2900,
                },
                quantity: 1,
            },
        ],

        success_url: "http://localhost:5173/fr/dashboard",
        cancel_url: "http://localhost:5173/fr/dashboard/pricing",

    });

    return session.url;
};