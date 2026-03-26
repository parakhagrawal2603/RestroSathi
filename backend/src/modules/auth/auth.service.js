const User = require('../user/user.model');
const SuperAdmin = require('../user/superAdmin.model');
const Restaurant = require('../restaurant/restaurant.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.loginUser = async (email, password) => {
  // 1. Try finding in standard User collection
  let user = await User.findOne({ email }).select('+password');
  
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');
    
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      token: exports.generateToken(user._id),
    };
  }

  // 2. Try finding in SuperAdmin collection
  const superAdmin = await SuperAdmin.findOne({ email }).select('+password');
  if (superAdmin) {
    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) throw new Error('Invalid email or password');

    return {
      _id: superAdmin._id,
      name: 'Super Admin',
      email: superAdmin.email,
      role: 'super_admin',
      token: exports.generateToken(superAdmin._id),
    };
  }

  throw new Error('Invalid email or password');
};


exports.signup = async (data) => {
  const { name, ownerName, phone, email, password } = data;

  if (!name || !ownerName || !phone || !email || !password) {
    throw new Error('All fields are required');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) throw new Error('User already exists');

  // Check if restaurant exists
  const restaurantExists = await Restaurant.findOne({ email });
  if (restaurantExists) throw new Error('Restaurant with this email already exists');

  // Create Restaurant (pending by default)
  const restaurant = await Restaurant.create({
    name,
    ownerName,
    phone,
    email,
    approvalStatus: 'pending',
    status: 'inactive'
  });

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create User (Admin)
  await User.create({
    name: ownerName,
    email,
    password: hashedPassword,
    role: 'admin',
    restaurantId: restaurant._id
  });

  return {
    message: 'Account created. Waiting for activation',
    restaurantId: restaurant._id
  };
};


exports.createUser = async (caller, name, email, password, role, restaurantId) => {
  if (caller.role === 'admin' && role === 'super_admin') {
    throw new Error('Admins cannot create super_admins');
  }
  if (caller.role === 'admin' && caller.restaurantId.toString() !== restaurantId) {
    throw new Error('Can only create users for your own restaurant');
  }

  const userExists = await User.findOne({ email });
  if (userExists) throw new Error('User already exists');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    restaurantId: restaurantId || caller.restaurantId
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId
  };
};

exports.getUsers = async (caller, restaurantId) => {
  let query = {};
  if (caller.role === 'admin') {
    query.restaurantId = caller.restaurantId;
    query.role = { $ne: 'super_admin' };
  } else if (caller.role === 'super_admin') {
    if (restaurantId) query.restaurantId = restaurantId;
  }

  return await User.find(query).select('-password').sort({ createdAt: -1 });
};

exports.deleteUser = async (caller, userId) => {
  const userToDelete = await User.findById(userId);
  if (!userToDelete) throw new Error('User not found');

  if (caller.role === 'admin' && userToDelete.restaurantId?.toString() !== caller.restaurantId?.toString()) {
    throw new Error('Not authorized to delete users from other restaurants');
  }

  if (userToDelete.role === 'admin') {
    throw new Error('Cannot delete restaurant admin');
  }

  if (userToDelete.role === 'super_admin' && caller.role !== 'super_admin') {
    throw new Error('Cannot delete super admins');
  }

  await User.findByIdAndDelete(userId);
  return { message: 'Staff member deleted successfully' };
};

exports.updateUser = async (caller, userId, updateData) => {
  const query = { _id: userId };
  if (caller.role !== 'super_admin') {
    query.restaurantId = caller.restaurantId;
  }
  
  const userToUpdate = await User.findOne(query);
  if (!userToUpdate) throw new Error('User not found');

  // Validation: Name is required
  if (updateData.name !== undefined && !updateData.name.trim()) {
    throw new Error('Name is required');
  }

  // Validation: Email format
  if (updateData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.email)) {
      throw new Error('Invalid email format');
    }
  }

  // Role Protection
  let finalRole = updateData.role || userToUpdate.role;
  if (userToUpdate.role === 'admin') {
    // Admins cannot have their role changed through this endpoint
    if (updateData.role && updateData.role !== 'admin') {
      throw new Error('Cannot modify restaurant admin role');
    }
    finalRole = 'admin';
  } else if (updateData.role && !['chef', 'reception'].includes(updateData.role)) {
    // Non-admin staff can only be toggled between staff roles
    throw new Error('Invalid role assignment');
  }

  const updateFields = {
    name: updateData.name?.trim(),
    email: updateData.email?.toLowerCase().trim(),
    phone: updateData.phone?.trim(),
    role: finalRole
  };

  // Handle password update
  if (updateData.password) {
    if (updateData.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    const salt = await bcrypt.genSalt(10);
    updateFields.password = await bcrypt.hash(updateData.password, salt);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true, runValidators: true }
  ).select('-password');

  // Sync email with Restaurant if it's an admin and email changed
  if (userToUpdate.role === 'admin' && updateData.email && updateData.email.toLowerCase().trim() !== userToUpdate.email) {
    await Restaurant.findByIdAndUpdate(
      userToUpdate.restaurantId,
      { email: updateData.email.toLowerCase().trim() }
    );
  }

  return updatedUser;
};

exports.updateProfile = async (userId, data) => {
  const { name, email, password } = data;
  let user = await User.findById(userId);
  let isSuperAdmin = false;

  if (!user) {
    user = await SuperAdmin.findById(userId);
    isSuperAdmin = true;
  }

  if (!user) throw new Error('User not found');

  const updateFields = {};
  if (name) updateFields.name = name.trim();
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error('Invalid email format');
    updateFields.email = email.toLowerCase().trim();
  }

  if (password) {
    if (password.length < 6) throw new Error('Password must be at least 6 characters long');
    const salt = await bcrypt.genSalt(10);
    updateFields.password = await bcrypt.hash(password, salt);
  }

  const Model = isSuperAdmin ? SuperAdmin : User;
  const updated = await Model.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select('-password');

  return updated;
};
