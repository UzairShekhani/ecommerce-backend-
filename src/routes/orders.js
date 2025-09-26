import { Router } from 'express'
import { authRequired, adminOnly } from '../middleware/auth.js'
import Order from '../models/Order.js'

const router = Router()

// GET /api/orders - Get orders for the logged-in user
router.get('/', authRequired, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate('items.product').sort({ createdAt: -1 })
    res.json(orders)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// GET /api/orders/:id - Get a specific order by ID
router.get('/:id', authRequired, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).populate('items.product')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ADMIN ROUTES
// GET /api/admin/orders - List all orders (admin only)
router.get('/admin', authRequired, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.product').sort({ createdAt: -1 })
    res.json(orders)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// PATCH /api/admin/orders/:id/status - Update order status (admin only)
router.patch('/admin/:id/status', authRequired, adminOnly, async (req, res) => {
  try {
    const { status } = req.body
    if (!status || !['pending', 'paid', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided' })
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
