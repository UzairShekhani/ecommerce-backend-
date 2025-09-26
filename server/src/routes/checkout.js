import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import Order from '../models/Order.js'
import stripe from 'stripe'

const router = Router()
const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY)

router.post('/', authRequired, async (req, res) => {
  try {
    const { items: cartItems } = req.body
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' })
    }

    const subtotal = cartItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const total = subtotal // For simplicity, no tax/shipping for now

    // Create a Stripe Payment Intent
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe expects amount in cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { userId: req.user.id },
    })

    // Create an Order record in MongoDB
    const order = await Order.create({
      user: req.user.id,
      items: cartItems.map(item => ({
        product: item.productId,
        name: item.name,
        slug: item.slug,
        images: item.images,
        variantKey: item.variantKey,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      subtotal,
      total,
      status: 'pending',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
    })

    res.json({ clientSecret: paymentIntent.client_secret, orderId: order._id, message: 'Payment intent created' })
  } catch (e) {
    console.error('Stripe/Checkout error:', e)
    res.status(500).json({ message: e.message || 'Failed to create checkout session' })
  }
})

// Endpoint to confirm payment (e.g., after Stripe webhook or client-side confirmation)
router.post('/confirm-payment', authRequired, async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body

    const order = await Order.findById(orderId)
    if (!order || order.user.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Order not found or unauthorized' })
    }

    if (order.paymentIntentId !== paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent mismatch' })
    }

    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === 'succeeded') {
      order.status = 'paid'
      await order.save()
      return res.json({ message: 'Payment confirmed and order updated to paid', order })
    } else {
      order.status = 'failed'
      await order.save()
      return res.status(400).json({ message: `Payment failed with status: ${paymentIntent.status}` })
    }

  } catch (e) {
    console.error('Confirm payment error:', e)
    res.status(500).json({ message: e.message || 'Failed to confirm payment' })
  }
})

export default router



