import User from "../../models/User.js";
import ApiKey from "../../models/ApiKey.js";
import ApiLog from "../../models/ApiLog.js";

// GET /admin/users?page=1&limit=20&search=&role=&plan=
export const listUsers = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (req.query.role && ["admin", "user"].includes(req.query.role)) {
    filter.role = req.query.role;
  }
  if (req.query.plan && ["free", "pro"].includes(req.query.plan)) {
    filter.plan = req.query.plan;
  }

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Enrich with key count
  const userIds = users.map((u) => u._id);
  const keyCounts = await ApiKey.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $group: { _id: "$userId", count: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } } } },
  ]);
  const keyMap = Object.fromEntries(keyCounts.map((k) => [k._id.toString(), k]));

  const enriched = users.map((u) => ({
    ...u,
    keyCount: keyMap[u._id.toString()]?.count || 0,
    activeKeys: keyMap[u._id.toString()]?.active || 0,
  }));

  res.json({ users: enriched, total, page, pages: Math.ceil(total / limit) });
};

// GET /admin/users/:id
export const getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select("-password").lean();
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// PATCH /admin/users/:id/role
export const updateRole = async (req, res) => {
  const { role } = req.body;
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  // Prevent demoting yourself
  if (req.params.id === req.user._id.toString() && role !== "admin") {
    return res.status(400).json({ message: "Cannot change your own role" });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: `Role updated to ${role}`, user });
};

// DELETE /admin/users/:id  — cascade-deletes keys & logs
export const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot delete your own account" });
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  // Cascade delete
  await Promise.all([
    ApiKey.deleteMany({ userId: user._id }),
    ApiLog.deleteMany({ userId: user._id }),
    User.deleteOne({ _id: user._id }),
  ]);

  res.json({ message: "User and related data deleted" });
};
