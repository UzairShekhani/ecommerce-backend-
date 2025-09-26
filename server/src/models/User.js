import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, unique: true },
    passwordHash: { type: String, required: true },
    avatarUrl: String,
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  { timestamps: true }
)

export default mongoose.model('User', userSchema)



