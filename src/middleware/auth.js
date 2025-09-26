import jwt from 'jsonwebtoken'

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  next()
}



