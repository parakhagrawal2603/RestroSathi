const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  address: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  paymentStatus: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  paymentMode: { type: String, enum: ['UPI', 'cash', 'bank', 'none'], default: 'none' },
  expiryDate: { type: Date },
  lastPaymentDate: { type: Date },
  notes: { type: String },
}, { timestamps: true });

// Indexes for common queries
restaurantSchema.index({ status: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
