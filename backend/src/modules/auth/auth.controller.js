const authService = require('./auth.service');

// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await authService.loginUser(email, password);
    res.json(userData);
  } catch (error) {
    res.status(error.message === 'Invalid email or password' ? 401 : 500).json({ message: error.message });
  }
};

// @route   POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const userData = await authService.signup(req.body);
    res.status(201).json(userData);
  } catch (error) {
    res.status(error.message === 'User already exists' ? 400 : 500).json({ message: error.message });
  }
};

// @route   POST /api/auth/demo
exports.demoLogin = async (req, res) => {
  try {
    const userData = await authService.demoLogin();
    res.json(userData);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @route   POST /api/auth/register-super
exports.registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userData = await authService.registerSuperAdmin(name, email, password);
    res.status(201).json(userData);
  } catch (error) {
    res.status(error.message === 'User already exists' ? 400 : 500).json({ message: error.message });
  }
};

// @route POST /api/auth/create-user
// @desc Create role accounts (chef, reception, admin)
// @access Private (Super Admin or Admin)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, restaurantId } = req.body;
    const userData = await authService.createUser(req.user, name, email, password, role, restaurantId);
    res.status(201).json(userData);
  } catch (error) {
    const status = error.message.includes('cannot') || error.message.includes('own restaurant') ? 403 : 
                   error.message === 'User already exists' ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    const users = await authService.getUsers(req.user, restaurantId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const result = await authService.deleteUser(req.user, req.params.id);
    res.json(result);
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 
                   error.message.includes('Not authorized') || error.message.includes('Cannot delete') ? 403 : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await authService.updateUser(req.user, req.params.id, req.body);
    res.json(user);
  } catch (error) {
    const status = error.message === 'User not found' ? 404 : 
                   error.message.includes('Not authorized') || error.message.includes('cannot be modified') ? 403 : 
                   error.message.includes('Invalid email') ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
