const mongoose = require('mongoose');

const superAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
}, { timestamps: true });

module.exports = mongoose.model('SuperAdmin', superAdminSchema);
