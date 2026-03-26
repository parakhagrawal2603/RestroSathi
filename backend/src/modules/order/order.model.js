const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: { type: Number, required: true },
  customer: {
    name: { type: String },
    phone: { type: String },
  },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    name: { type: String },
  }],
  status: { type: String, enum: ['pending', 'preparing', 'ready', 'served'], default: 'pending' },
  isPaid: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'other', ''], default: '' },
  instructions: { type: String, default: '' },
}, { timestamps: true });

// Optimize pulling orders by status for Kitchen and Reception panels
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
