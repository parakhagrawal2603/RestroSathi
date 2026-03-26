const orderService = require('./order.service');

// @route   POST /api/orders
// @desc    Create a new order (Customer app)
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const io = req.app.get('io');
    const order = await orderService.createOrder(req.body, io);
    res.status(201).json(order);
  } catch (error) {
    res.status(error.message === 'Missing required fields' ? 400 : 500).json({ message: error.message });
  }
};

// @route   GET /api/orders
// @desc    Get orders for a restaurant (can filter by status)
// @access  Chef, Reception, Admin
exports.getOrders = async (req, res) => {
  try {
    const { status, restaurantId } = req.query;
    let targetRestaurantId = req.user.restaurantId;

    // Super Admin can see all or filter by restaurantId
    if (req.user.role === 'super_admin') {
      targetRestaurantId = restaurantId || null;
    }

    const orders = await orderService.getOrders(targetRestaurantId, status);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/orders/active
// @desc    Get active (not completed) orders
// @access  Reception, Admin
exports.getActiveOrders = async (req, res) => {
  try {
    console.log("Chef API hit - Fetching active orders");
    console.log("User:", req.user?._id, "Role:", req.user?.role, "Restaurant:", req.user?.restaurantId);
    
    const orders = await orderService.getActiveOrders(req.user.restaurantId);
    
    console.log("Orders found:", orders.length);
    if (orders.length > 0) console.log("Sample Active Order:", JSON.stringify(orders[0]).substring(0, 200) + "...");
    
    res.json(orders);
  } catch (error) {
    console.error("GET ACTIVE ORDERS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/orders/history
// @desc    Get completed orders history
// @access  Reception, Admin
exports.getOrderHistory = async (req, res) => {
  try {
    const { from, to } = req.query;
    console.log("Fetching order history for user:", req.user?._id, "Dates:", { from, to });
    const orders = await orderService.getOrderHistory(req.user.restaurantId, from, to);
    console.log("History orders found:", orders.length);
    res.json(orders);
  } catch (error) {
    console.error("GET ORDER HISTORY ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Chef, Reception
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const io = req.app.get('io');
    const restaurantId = req.user.role === 'super_admin' ? null : req.user.restaurantId;
    
    const order = await orderService.updateOrderStatus(req.params.id, status, io, restaurantId);
    res.json(order);
  } catch (error) {
    const statusCode = error.message.includes('authorized') ? 403 : 
                      error.message === 'Invalid status' ? 400 : 
                      error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// @route   PUT /api/orders/:id/pay
// @desc    Mark order as paid
// @access  Reception, Admin
exports.markOrderPaid = async (req, res) => {
  try {
    const io = req.app.get('io');
    const { paymentMethod } = req.body;
    const restaurantId = req.user.role === 'super_admin' ? null : req.user.restaurantId;

    const order = await orderService.markOrderPaid(req.params.id, paymentMethod, io, restaurantId);
    res.json(order);
  } catch (error) {
    const statusCode = error.message.includes('authorized') ? 403 : 
                      error.message === 'Order not found' ? 404 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// @route   DELETE /api/orders/:id
// @desc    Delete a pending order
// @access  Chef, Admin
exports.deleteOrder = async (req, res) => {
  try {
    const io = req.app.get('io');
    const restaurantId = req.user.role === 'super_admin' ? null : req.user.restaurantId;

    const result = await orderService.deleteOrder(req.params.id, io, restaurantId);
    res.json(result);
  } catch (error) {
    const statusCode = error.message.includes('authorized') ? 403 : 
                      error.message === 'Order not found' ? 404 : 
                      error.message.includes('pending') ? 400 : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

// @route   GET /api/orders/public/:id
// @desc    Get order by ID (Public access for customer tracking)
// @access  Public
exports.getPublicOrder = async (req, res) => {
  try {
    const order = await orderService.getPublicOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
