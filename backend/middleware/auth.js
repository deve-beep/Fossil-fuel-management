const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized. Invalid or expired token.' });
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden. Insufficient role privileges.' });
  }
  next();
};

const checkPermission = (moduleName, action) => (req, res, next) => {
  const { PERMISSIONS } = require('../config/roles');
  const rule = PERMISSIONS[moduleName];
  if (!rule || !rule[action] || !rule[action].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Forbidden. Role '${req.user.role}' cannot ${action} '${moduleName}'.` });
  }
  next();
};

module.exports = { protect, authorize, checkPermission };
