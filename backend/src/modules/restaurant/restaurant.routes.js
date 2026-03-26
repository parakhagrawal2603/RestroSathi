const express = require('express');
const router = express.Router();
const { 
  getRestaurants, 
  getRestaurantById,
  createRestaurant, 
  toggleStatus, 
  updateRestaurant,
  deleteRestaurant,
  extendPlan, 
  markPaid,
  getOrdersSummary,
  updateExpiryDate,
  getMyRestaurant,
  approveRestaurant,
  rejectRestaurant,
  getPublicRestaurantInfo
} = require('./restaurant.controller');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const { checkRestaurantActive } = require('../../middlewares/restaurantMiddleware');

// Public Routes
router.get('/:id/public', getPublicRestaurantInfo);

// Super Admin Routes
router.use(protect);

router.route('/')
  .get(authorize('super_admin'), getRestaurants)
  .post(authorize('super_admin'), createRestaurant);

router.get('/orders-summary', authorize('super_admin'), getOrdersSummary);
router.get('/me', authorize('admin'), getMyRestaurant);
router.put('/update', authorize('admin'), require('./restaurant.controller').updateMyRestaurant);

router.get('/:id', authorize('super_admin', 'admin'), getRestaurantById);
router.put('/:id/toggle-status', authorize('super_admin'), toggleStatus);

// Admins can only update their own restaurant if it's active
router.patch('/:id', authorize('super_admin', 'admin'), checkRestaurantActive, updateRestaurant);

router.delete('/:id', authorize('super_admin'), deleteRestaurant);
router.put('/:id/extend', authorize('super_admin'), extendPlan);
router.put('/:id/mark-paid', authorize('super_admin'), markPaid);
router.put('/:id/approve', authorize('super_admin'), approveRestaurant);
router.put('/:id/reject', authorize('super_admin'), rejectRestaurant);
router.put('/:id/update-expiry', authorize('super_admin'), updateExpiryDate);

module.exports = router;
