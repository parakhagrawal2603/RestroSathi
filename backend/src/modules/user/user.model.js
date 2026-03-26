const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false }, // null for super_admin
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['super_admin', 'admin', 'chef', 'reception'], required: true },
}, { timestamps: true });

// Indexes for login and tenant isolation
userSchema.index({ restaurantId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
