import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  slug: String,
  images: [String],
  variantKey: String,
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
})

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentIntentId: String, // Stripe Payment Intent ID
    clientSecret: String, // Stripe client secret for frontend confirmation
  },
  { timestamps: true }
)

export default mongoose.model('Order', orderSchema)
