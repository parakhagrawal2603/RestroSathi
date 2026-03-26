const Order = require('./order.model');

exports.createOrder = async (data, io) => {
  const { restaurantId, tableNumber, customer, items, instructions } = data;

  if (!restaurantId || !tableNumber || !items || items.length === 0) {
    throw new Error('Missing required fields');
  }

  const newOrder = await Order.create({
    restaurantId,
    tableNumber,
    customer,
    items,
    instructions: instructions || ''
  });

  const populatedOrder = await Order.findById(newOrder._id).populate('items.menuItem');

  // Emit to restaurant room
  if (io) {
    io.to(restaurantId.toString()).emit('newOrder', populatedOrder);
  }

  return populatedOrder;
};

exports.getOrders = async (restaurantId, status) => {
  const filter = {};
  if (restaurantId) filter.restaurantId = restaurantId;
  if (status) filter.status = status;

  return await Order.find(filter)
    .populate('items.menuItem')
    .populate('restaurantId', 'name')
    .sort('-createdAt');
};

exports.getActiveOrders = async (restaurantId) => {
  return await Order.find({ restaurantId, isCompleted: { $ne: true } })
    .populate('items.menuItem')
    .sort('-createdAt');
};

exports.getOrderHistory = async (restaurantId, from, to) => {
  const filter = { restaurantId, isCompleted: true };
  
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from + "T00:00:00.000Z");
    if (to) filter.createdAt.$lte = new Date(to + "T23:59:59.999Z");
  }

  return await Order.find(filter)
    .populate('items.menuItem')
    .sort('-createdAt');
};

exports.updateOrderStatus = async (id, status, io, restaurantId) => {
  const allowedStatuses = ['pending', 'preparing', 'ready', 'served'];
  if (!allowedStatuses.includes(status)) {
    throw new Error('Invalid status');
  }

  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');

  // Ownership check: if restaurantId is provided, it must match the order
  if (restaurantId && order.restaurantId.toString() !== restaurantId.toString()) {
    throw new Error('Not authorized to update orders from other restaurants');
  }

  order.status = status;
  
  // Auto-complete if served and paid
  if (order.status === 'served' && order.isPaid) {
    order.isCompleted = true;
  }

  await order.save();

  // Socket emit
  if (io) {
    io.to(order.restaurantId.toString()).emit('orderUpdated', order);
  }

  return order;
};

exports.markOrderPaid = async (id, paymentMethod, io, restaurantId) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');

  // Ownership check
  if (restaurantId && order.restaurantId.toString() !== restaurantId.toString()) {
    throw new Error('Not authorized to mark orders from other restaurants as paid');
  }

  order.isPaid = true;
  order.paymentMethod = paymentMethod || 'other';

  // Auto-complete if served and paid
  if (order.status === 'served') {
    order.isCompleted = true;
  }

  await order.save();

  if (io) {
    io.to(order.restaurantId.toString()).emit('orderUpdated', order);
  }

  return order;
};

exports.deleteOrder = async (id, io, restaurantId) => {
  const order = await Order.findById(id);
  if (!order) throw new Error('Order not found');

  // Ownership check
  if (restaurantId && order.restaurantId.toString() !== restaurantId.toString()) {
    throw new Error('Not authorized to delete orders from other restaurants');
  }

  // Status check: Only pending orders can be deleted
  if (order.status !== 'pending') {
    throw new Error('Only pending orders can be deleted');
  }

  const orderId = order._id.toString();
  await order.deleteOne();

  if (io) {
    console.log("Broadcasting orderDeleted:", orderId, "to room:", order.restaurantId.toString());
    io.to(order.restaurantId.toString()).emit('orderDeleted', orderId);
  }

  return { message: 'Order deleted successfully' };
};

exports.getPublicOrder = async (id) => {
  return await Order.findById(id).populate('items.menuItem');
};
