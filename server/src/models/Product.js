import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    price: { type: Number, required: true },
    colour: String,
    role: { type: String, enum: ['admin', 'user'], default: 'admin' },
    size: { type: String, enum: ['sm', 'md', 'lg', 'xl'], default: 'md' },
    images: { type: [String], default: [] },
    inStock: { type: Boolean, default: true },
    totalStock: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('Product', productSchema)



