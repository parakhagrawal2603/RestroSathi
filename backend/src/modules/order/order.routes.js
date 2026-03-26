const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getActiveOrders, getOrderHistory, updateOrderStatus, markOrderPaid, deleteOrder, getPublicOrder } = require('./order.controller');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const { checkRestaurantActive } = require('../../middlewares/restaurantMiddleware');

// Public route for customers 
router.post('/', checkRestaurantActive, createOrder);
router.get('/public/:id', getPublicOrder);

// Protected routes
router.use(protect, checkRestaurantActive);

// View orders
router.get('/', authorize('chef', 'reception', 'admin', 'super_admin'), getOrders);
router.get('/active', authorize('chef', 'reception', 'admin'), getActiveOrders);
router.get('/history', authorize('chef', 'reception', 'admin'), getOrderHistory);

// Update status
router.put('/:id/status', authorize('chef', 'reception', 'admin', 'super_admin'), updateOrderStatus);

// Mark paid
router.put('/:id/pay', authorize('reception', 'admin', 'super_admin'), markOrderPaid);

// Delete order
router.delete('/:id', authorize('chef', 'admin', 'reception'), deleteOrder);

module.exports = router;
