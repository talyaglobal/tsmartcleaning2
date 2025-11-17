import Stripe from 'stripe'

let stripeSingleton: Stripe | null = null

export function getStripe(): Stripe {
	const secretKey = process.env.STRIPE_SECRET_KEY
	if (!secretKey) {
		throw new Error('Missing STRIPE_SECRET_KEY')
	}
	if (!stripeSingleton) {
		stripeSingleton = new Stripe(secretKey, {
			apiVersion: '2024-06-20',
			typescript: true,
		})
	}
	return stripeSingleton
}

export function isStripeConfigured(): boolean {
	return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID)
}


