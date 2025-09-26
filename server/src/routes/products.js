import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import Product from '../models/Product.js'
import { authRequired, adminOnly } from '../middleware/auth.js'
import multer from 'multer'
import { uploadBuffer } from '../services/cloudinary.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// Public list with filters, sort, pagination
router.get('/', async (req, res) => {
  const { page = 1, limit = 12, sort = 'popular', tag, q } = req.query
  const filter = {}
  if (tag) filter.tags = tag
  if (q) filter.name = { $regex: q, $options: 'i' }
  let query = Product.find(filter)
  if (sort === 'price-asc') query = query.sort({ price: 1 })
  if (sort === 'price-desc') query = query.sort({ price: -1 })
  if (sort === 'popular') query = query.sort({ soldCount: -1 })
  const total = await Product.countDocuments(filter)
  const items = await query
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
  res.json({ items, total })
})

router.get('/slug/:slug', async (req, res) => {
  const item = await Product.findOne({ slug: req.params.slug })
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

// Admin CRUD
router.post('/', authRequired, adminOnly, upload.array('images', 5), [body('name').notEmpty(), body('price').isNumeric()], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })
  let images = req.body.images || []
  if (req.files?.length) {
    const uploaded = await Promise.all(req.files.map((f, idx) => uploadBuffer(f.buffer, 'products', `img-${Date.now()}-${idx}`)))
    images = uploaded.map((u) => u.secure_url)
  }
  const created = await Product.create({ ...req.body, images })
  res.status(201).json(created)
})

router.patch('/:id', authRequired, adminOnly, upload.array('images', 5), async (req, res) => {
  let updates = { ...req.body }
  if (req.files?.length) {
    const uploaded = await Promise.all(req.files.map((f, idx) => uploadBuffer(f.buffer, 'products', `img-${Date.now()}-${idx}`)))
    updates.images = uploaded.map((u) => u.secure_url)
  }
  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true })
  res.json(updated)
})

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
})

export default router


