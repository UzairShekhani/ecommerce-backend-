// Load environment variables from .env
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'

// Import routes
import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import checkoutRoutes from './routes/checkout.js'
import favoritesRoutes from './routes/favorites.js'
import orderRoutes from './routes/orders.js'

// Create Express app
const app = express()

// Middlewares
app.use(morgan('dev'))

// ✅ CORS setup
const allowedOrigins = (process.env.CLIENT_ORIGIN).split(',').filter(Boolean)

const isLocalOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '')

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true) // allow non-browser requests
      if (isLocalOrigin(origin) || allowedOrigins.includes(origin)) {
        return cb(null, true)
      }
      console.warn('❌ Blocked by CORS:', origin)
      return cb(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  })
)

app.use(express.json({ limit: '10mb' }))

// Health check route
app.get('/health', (req, res) => res.json({ ok: true }))

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/api/orders', orderRoutes)

// Server & Database
const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI

console.log('Loaded MONGO_URI:', MONGO_URI)

if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found. Check your .env file.')
  process.exit(1)
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully')
    app.listen(PORT, () =>
      console.log(`🚀 API running on http://localhost:${PORT}`)
    )
  })
  .catch((err) => {
    console.error('❌ Mongo connect error:', err.message)
    process.exit(1)
  })
