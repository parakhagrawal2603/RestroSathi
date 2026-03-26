const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');
const SuperAdmin = require('../modules/user/superAdmin.model');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 1. Try finding in standard User collection
      req.user = await User.findById(decoded.id).select('-password');
      
      // 2. If not found, try finding in SuperAdmin collection
      if (!req.user) {
        const superAdmin = await SuperAdmin.findById(decoded.id).select('-password');
        if (superAdmin) {
          req.user = {
            _id: superAdmin._id,
            name: 'Super Admin',
            email: superAdmin.email,
            role: 'super_admin'
          };
        }
      }
      
      if (!req.user) {
         return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized` });
    }
    next();
  };
};

const protectOptional = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Try User first
      req.user = await User.findById(decoded.id).select('-password');
      
      // Try SuperAdmin if not found
      if (!req.user) {
        const superAdmin = await SuperAdmin.findById(decoded.id).select('-password');
        if (superAdmin) {
          req.user = {
            _id: superAdmin._id,
            name: 'Super Admin',
            email: superAdmin.email,
            role: 'super_admin'
          };
        }
      }

      return next();
    } catch (error) {
       // Token failed, but we continue as public access
       return next();
    }
  }
  next();
};

module.exports = { protect, authorize, protectOptional };
