import { createClient } from '@supabase/supabase-js'

// Stripe webhook — flips a user's profile to is_pro=true when they pay, and
// back to false when the subscription ends. This is wired but DORMANT until you
// add Stripe: set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in Vercel, then
// point a Stripe webhook at https://your-app.vercel.app/api/stripe-webhook.
//
// Flow: the Go Pro button sends the user to a Stripe Payment Link with
// ?client_reference_id=<their supabase user id>. Stripe includes that id in the
// checkout.session.completed event, which we use to find and upgrade the account.

export const config = { api: { bodyParser: false } }

async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secretKey || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe not configured yet' })
  }

  // Lazy import so the app builds/deploys fine before Stripe is installed.
  let Stripe
  try {
    Stripe = (await import('stripe')).default
  } catch {
    return res.status(503).json({ error: 'Run `npm install stripe` to enable billing' })
  }
  const stripe = new Stripe(secretKey)

  let event
  try {
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, req.headers['stripe-signature'], webhookSecret)
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` })
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  const setPro = async (match, value) => {
    await supabase.from('profiles').update({ is_pro: value, ...match.patch }).eq(match.col, match.val)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object
        const userId = s.client_reference_id
        if (userId) {
          await setPro(
            { col: 'id', val: userId, patch: { stripe_customer_id: s.customer } },
            true
          )
        }
        break
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const sub = event.data.object
        await setPro({ col: 'stripe_customer_id', val: sub.customer, patch: {} }, false)
        break
      }
      case 'customer.subscription.resumed': {
        const sub = event.data.object
        await setPro({ col: 'stripe_customer_id', val: sub.customer, patch: {} }, true)
        break
      }
    }
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }

  return res.status(200).json({ received: true })
}
