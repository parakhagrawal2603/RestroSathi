const restaurantService = require('./restaurant.service');

// @route   GET /api/admin/restaurants
// @desc    Get all restaurants
// @access  Super Admin
exports.getRestaurants = async (req, res) => {
  try {
    const filter = {
      approvalStatus: req.query.approvalStatus
    };
    const restaurants = await restaurantService.getAllRestaurants(filter);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/admin/restaurants/:id
// @desc    Get restaurant by ID
// @access  Super Admin
exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id, req.user);
    res.json(restaurant);
  } catch (error) {
    const status = error.message.includes('authorized') ? 403 : error.message === 'Restaurant not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

// @route   POST /api/admin/restaurants
// @desc    Create a new restaurant
// @access  Super Admin
exports.createRestaurant = async (req, res) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.body);
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(error.message.includes('exists') ? 400 : 500).json({ message: error.message });
  }
};

// @route   PUT /api/admin/restaurants/:id/toggle-status
// @desc    Activate/Deactivate a restaurant
// @access  Super Admin
exports.toggleStatus = async (req, res) => {
  try {
    const restaurant = await restaurantService.toggleStatus(req.params.id);
    res.json(restaurant);
  } catch (error) {
    res.status(error.message === 'Restaurant not found' ? 404 : 500).json({ message: error.message });
  }
};

// @route   PATCH /api/admin/restaurants/:id
// @desc    Update restaurant details
// @access  Super Admin, Admin (own)
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(req.params.id, req.body, req.user);
    res.json(restaurant);
  } catch (error) {
    const status = error.message.includes('authorized') ? 403 : error.message === 'Restaurant not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

// @route   DELETE /api/admin/restaurants/:id
// @desc    Delete a restaurant
// @access  Super Admin
exports.deleteRestaurant = async (req, res) => {
  try {
    await restaurantService.deleteRestaurant(req.params.id);
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    if (error.message === 'Invalid Restaurant ID') {
      return res.status(400).json({ message: error.message });
    }
    res.status(error.message === 'Restaurant not found' ? 404 : 500).json({ message: error.message });
  }
};

// @route   PUT /api/admin/restaurants/:id/extend
// @desc    Extend restaurant plan
// @access  Super Admin
exports.extendPlan = async (req, res) => {
  try {
    const restaurant = await restaurantService.extendPlan(req.params.id, req.body.days);
    res.json(restaurant);
  } catch (error) {
    const status = error.message.includes('days') ? 400 : error.message === 'Restaurant not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};

// @route   PUT /api/admin/restaurants/:id/mark-paid
// @desc    Mark manual payment
// @access  Super Admin
exports.markPaid = async (req, res) => {
  try {
    const restaurant = await restaurantService.markPaid(req.params.id, req.body.paymentMode);
    res.json(restaurant);
  } catch (error) {
    res.status(error.message === 'Restaurant not found' ? 404 : 500).json({ message: error.message });
  }
};

// @route   GET /api/admin/orders-summary
// @desc    Get order summary aggregated by restaurant
// @access  Super Admin
exports.getOrdersSummary = async (req, res) => {
  try {
    const summary = await restaurantService.getOrdersSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateExpiryDate = async (req, res) => {
  try {
    const restaurant = await restaurantService.updateExpiryDate(req.params.id, req.body.expiryDate);
    res.json(restaurant);
  } catch (error) {
    res.status(error.message === 'Restaurant not found' ? 404 : 400).json({ message: error.message });
  }
};

exports.getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.user.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMyRestaurant = async (req, res) => {
  try {
    // 1. Authorization Check: Must be admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only restaurant administrators can update settings' });
    }

    // 2. Resource Check: Must have associated restaurant
    if (!req.user.restaurantId) {
      return res.status(400).json({ message: 'No restaurant associated with this account' });
    }

    // 3. Update execution (service already ensures caller matches target)
    const restaurant = await restaurantService.updateRestaurant(
      req.user.restaurantId.toString(), 
      req.body, 
      req.user
    );

    // 4. Success Response
    res.json({ 
      message: 'Settings updated successfully',
      restaurant 
    });
  } catch (error) {
    const status = error.message.includes('authorized') ? 403 : error.message === 'Restaurant not found' ? 404 : 500;
    res.status(status).json({ message: error.message });
  }
};
exports.approveRestaurant = async (req, res) => {
  try {
    const restaurant = await restaurantService.approveRestaurant(req.params.id);
    res.json(restaurant);
  } catch (error) {
    res.status(error.message === 'Restaurant not found' ? 404 : 500).json({ message: error.message });
  }
};

exports.rejectRestaurant = async (req, res) => {
  try {
    await restaurantService.rejectRestaurant(req.params.id);
    res.json({ message: 'Restaurant rejected and removed' });
  } catch (error) {
    res.status(error.message === 'Restaurant not found' ? 404 : 500).json({ message: error.message });
  }
};

exports.getPublicRestaurantInfo = async (req, res) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    res.json({
      name: restaurant.name,
      status: restaurant.status
    });
  } catch (error) {
    res.status(404).json({ message: 'Restaurant not found' });
  }
};
