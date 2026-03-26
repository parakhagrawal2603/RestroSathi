const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isVeg: { type: Boolean, default: true },
  availabilityMode: { 
    type: String, 
    enum: ["auto", "on", "off"], 
    default: "auto" 
  },
  timeSlotIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeSlot' }],
  image: { type: String, default: "" },
}, { timestamps: true });

// Optimize tenant-level queries and category filtering
menuItemSchema.index({ restaurantId: 1, categoryId: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
