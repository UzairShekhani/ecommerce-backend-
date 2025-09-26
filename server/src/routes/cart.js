import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'

const router = Router()

// In-memory cart per user for demo; replace with DB if needed
const memoryCarts = new Map()

router.get('/', authRequired, (req, res) => {
  const items = memoryCarts.get(req.user.id) || []
  res.json({ items })
})

router.post('/', authRequired, (req, res) => {
  const items = memoryCarts.get(req.user.id) || []
  const { product, variantKey } = req.body
  const key = `${product._id || product.id}:${variantKey || ''}`
  const existing = items.find((i) => i.key === key)
  if (existing) existing.qty += 1
  else items.push({ key, product, qty: 1, variantKey })
  memoryCarts.set(req.user.id, items)
  res.json({ items })
})

export default router



