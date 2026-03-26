const Restaurant = require('./restaurant.model');
const User = require('../user/user.model');
const bcrypt = require('bcryptjs');

exports.getAllRestaurants = async (filter = {}) => {
  let query = {};
  if (filter.approvalStatus) {
    query.approvalStatus = filter.approvalStatus;
  }
  return await Restaurant.find(query);
};

exports.getRestaurantById = async (id, caller) => {
  if (caller && caller.role === 'admin' && caller.restaurantId?.toString() !== id) {
    throw new Error('Not authorized to access this restaurant data');
  }
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');
  return restaurant;
};

exports.createRestaurant = async (data) => {
  const existingRestaurant = await Restaurant.findOne({ email: data.email });
  if (existingRestaurant) {
    throw new Error('Restaurant with this email already exists');
  }

  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Create Restaurant (Approved by default for Super Admin onboarding)
  const restaurant = await Restaurant.create({
    ...data,
    approvalStatus: 'approved',
    status: 'active'
  });

  // Create Admin User
  if (!data.password || data.password.length < 6) {
    throw new Error('Admin password is required and must be at least 6 characters');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  await User.create({
    name: data.ownerName || 'Admin',
    email: data.email,
    password: hashedPassword,
    role: 'admin',
    restaurantId: restaurant._id
  });

  return restaurant;
};

exports.toggleStatus = async (id) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');

  restaurant.status = restaurant.status === 'active' ? 'inactive' : 'active';
  await restaurant.save();
  return restaurant;
};

exports.extendPlan = async (id, days) => {
  if (!days) throw new Error('Please provide number of days');

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');

  const now = new Date();
  let currentExpiry = restaurant.expiryDate;

  if (!currentExpiry || currentExpiry < now) {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));
    restaurant.expiryDate = newExpiry;
  } else {
    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));
    restaurant.expiryDate = newExpiry;
  }

  if (restaurant.status === 'inactive') {
      restaurant.status = 'active';
  }

  await restaurant.save();
  return restaurant;
};

exports.markPaid = async (id, paymentMode) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');

  restaurant.paymentStatus = 'paid';
  restaurant.paymentMode = paymentMode || 'cash';
  restaurant.lastPaymentDate = new Date();

  await restaurant.save();
  return restaurant;
};

exports.updateRestaurant = async (id, data, caller) => {
  if (caller && caller.role === 'admin' && caller.restaurantId?.toString() !== id) {
    throw new Error('Not authorized to update this restaurant data');
  }
  
  const oldRestaurant = await Restaurant.findById(id);
  if (!oldRestaurant) throw new Error('Restaurant not found');

  const restaurant = await Restaurant.findByIdAndUpdate(id, data, { new: true });

  // Sync email with Admin user if changed
  if (data.email && data.email !== oldRestaurant.email) {
    await User.findOneAndUpdate(
      { restaurantId: id, role: 'admin' },
      { email: data.email.toLowerCase().trim() }
    );
  }

  return restaurant;
};

exports.deleteRestaurant = async (id) => {
  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Invalid Restaurant ID');
  }

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');
  
  // Also delete associated data for this restaurant
  const User = require('../user/user.model');
  const Order = require('../order/order.model');
  const MenuItem = require('../menu/menuItem.model');
  const Category = require('../menu/category.model');
  const TimeSlot = require('../menu/timeSlot.model');

  // Delete all related records in parallel
  await Promise.all([
    Restaurant.findByIdAndDelete(id),
    User.deleteMany({ restaurantId: id }),
    Order.deleteMany({ restaurantId: id }),
    MenuItem.deleteMany({ restaurantId: id }),
    Category.deleteMany({ restaurantId: id }),
    TimeSlot.deleteMany({ restaurantId: id })
  ]);
  
  return restaurant;
};

exports.getOrdersSummary = async () => {
  const Order = require('../order/order.model');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await Order.aggregate([
    {
      $group: {
        _id: '$restaurantId',
        totalOrders: { $sum: 1 },
        ordersToday: {
          $sum: {
            $cond: [{ $gte: ['$createdAt', today] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: '_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    { $unwind: '$restaurant' },
    {
      $project: {
        _id: 0,
        restaurantId: '$_id',
        restaurantName: '$restaurant.name',
        totalOrders: 1,
        ordersToday: 1
      }
    }
  ]);
};

exports.updateExpiryDate = async (id, expiryDate) => {
  if (!expiryDate) throw new Error('Expiry date is required');
  
  const date = new Date(expiryDate);
  if (isNaN(date.getTime())) throw new Error('Invalid date format');

  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');

  restaurant.expiryDate = date;
  
  // Logic: Set status based on new expiry date
  const now = new Date();
  if (date > now) {
    restaurant.status = 'active';
  } else {
    restaurant.status = 'inactive';
  }

  await restaurant.save();
  return restaurant;
};
exports.approveRestaurant = async (id) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');
  
  restaurant.approvalStatus = 'approved';
  restaurant.status = 'active';
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  restaurant.expiryDate = expiry;
  
  await restaurant.save();
  return restaurant;
};

exports.rejectRestaurant = async (id) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new Error('Restaurant not found');

  restaurant.approvalStatus = 'rejected';
  restaurant.status = 'inactive';
  await restaurant.save();
  return restaurant;
};
