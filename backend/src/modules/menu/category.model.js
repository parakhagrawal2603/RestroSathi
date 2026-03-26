const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
}, { timestamps: true });

// Ensure fast tenant-level queries
categorySchema.index({ restaurantId: 1 });

module.exports = mongoose.model('Category', categorySchema);
