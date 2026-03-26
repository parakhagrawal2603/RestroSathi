const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true },
  startTime: { type: String, required: true }, // Format HH:mm
  endTime: { type: String, required: true },   // Format HH:mm
}, { timestamps: true });

// Ensure fast tenant-level queries
timeSlotSchema.index({ restaurantId: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
