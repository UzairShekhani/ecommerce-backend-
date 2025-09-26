import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import Favorite from '../models/Favorite.js'
import Product from '../models/Product.js'

const router = Router()

// GET /api/favorites - Get all favorited products for the logged-in user
router.get('/', authRequired, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id }).populate('product')
    res.json(favorites.map(fav => fav.product))
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// POST /api/favorites - Add a product to favorites
router.post('/', authRequired, async (req, res) => {
  try {
    const { productId } = req.body
    if (!productId) return res.status(400).json({ message: 'Product ID is required' })

    // Check if product exists
    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ user: req.user.id, product: productId })
    if (existingFavorite) return res.status(200).json({ message: 'Product already favorited' })

    const favorite = await Favorite.create({ user: req.user.id, product: productId })
    await favorite.populate('product')
    res.status(201).json(favorite.product)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// DELETE /api/favorites/:productId - Remove a product from favorites
router.delete('/:productId', authRequired, async (req, res) => {
  try {
    const { productId } = req.params
    const result = await Favorite.deleteOne({ user: req.user.id, product: productId })
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Favorite not found' })
    res.json({ message: 'Product removed from favorites' })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
