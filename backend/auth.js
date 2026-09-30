const jwt = require("jsonwebtoken");

const activeSessions = new Set();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (!activeSessions.has(token)) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid."
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};

const addSession = (token, userId) => {
  if (token) {
    activeSessions.add(token);
  }
  return token;
};

const removeSession = (token) => {
  activeSessions.delete(token);
};

module.exports = {
  authMiddleware,
  addSession,
  removeSession,
  activeSessions
};
