const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { 
  createCategory, getCategories, deleteCategory,
  createMenuItem, updateMenuItem, updateMenuItemAvailability, deleteMenuItem, 
  createTimeSlot, getTimeSlots, deleteTimeSlot,
  getMenu, bulkUpload 
} = require('./menu.controller');
const { protect, authorize, protectOptional } = require('../../middlewares/authMiddleware');
const { checkRestaurantActive } = require('../../middlewares/restaurantMiddleware');

// Public menu route (for customer QR scan)
// Customer App will call this with ?filterByTime=true
router.get('/', protectOptional, checkRestaurantActive, getMenu);

// Admin/Reception routes
router.use(protect, authorize('admin', 'reception'), checkRestaurantActive);

// Shared GET routes & Availability Toggle
router.get('/category', getCategories);
router.get('/timeslot', getTimeSlots);
router.put('/item/:id/availability', updateMenuItemAvailability);

// Admin-only Mutation routes
const adminOnly = authorize('admin');

router.post('/category', adminOnly, createCategory);
router.delete('/category/:id', adminOnly, deleteCategory);

router.post('/item', adminOnly, createMenuItem);
router.put('/item/:id', adminOnly, updateMenuItem);
router.delete('/item/:id', adminOnly, deleteMenuItem);

router.post('/timeslot', adminOnly, createTimeSlot);
router.delete('/timeslot/:id', adminOnly, deleteTimeSlot);

router.post('/bulk-upload', adminOnly, upload.single('file'), bulkUpload);

module.exports = router;
