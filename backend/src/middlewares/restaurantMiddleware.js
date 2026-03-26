const Restaurant = require('../modules/restaurant/restaurant.model');

/**
 * Middleware to check if a restaurant is active before processing the request.
 * Can find restaurantId from:
 * 1. Authenticated user (req.user.restaurantId)
 * 2. Query parameters (req.query.restaurantId)
 * 3. Request body (req.body.restaurantId)
 */
const checkRestaurantActive = async (req, res, next) => {
  try {
    // Super Admins are exempt from this check as they manage the system
    if (req.user && req.user.role === 'super_admin') {
      return next();
    }

    const restaurantId = req.user?.restaurantId || req.query.restaurantId || req.body.restaurantId;

    if (!restaurantId) {
      // If no ID is provided, we can't check status. 
      // Context will determine if this should be an error or proceed.
      // Usually, critical routes will have restaurantId.
      return next();
    }

    const restaurant = await Restaurant.findById(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.status !== 'active') {
      console.warn(`[Restaurant Check] Blocked request for inactive restaurant: ${restaurant.name} (${restaurantId})`);
      return res.status(403).json({ 
        message: 'Restaurant is inactive',
        status: restaurant.status
      });
    }

    next();
  } catch (error) {
    console.error(`[Restaurant Check] Error: ${error.message}`);
    res.status(500).json({ message: 'Internal server error during restaurant status check' });
  }
};

module.exports = { checkRestaurantActive };
