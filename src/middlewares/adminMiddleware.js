/**
 * Admin middleware — requires authenticated user with role === "admin".
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export default adminMiddleware;
