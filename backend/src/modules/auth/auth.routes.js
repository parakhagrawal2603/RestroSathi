const express = require('express');
const router = express.Router();
const { login, registerSuperAdmin, createUser, demoLogin, signup, getUsers, deleteUser, updateUser, updateProfile } = require('./auth.controller');
const { protect, authorize } = require('../../middlewares/authMiddleware');
const { checkRestaurantActive } = require('../../middlewares/restaurantMiddleware');

router.post('/login', login);
router.post('/signup', signup);
router.post('/demo', demoLogin);
router.post('/register-super', registerSuperAdmin);

// Staff management routes require active restaurant
router.use(protect, checkRestaurantActive);
router.post('/create-user', authorize('super_admin', 'admin'), createUser);
router.get('/users', authorize('super_admin', 'admin'), getUsers);
router.put('/users/:id', authorize('super_admin', 'admin'), updateUser);
router.delete('/users/:id', authorize('super_admin', 'admin'), deleteUser);
router.put('/profile', protect, updateProfile);

module.exports = router;
