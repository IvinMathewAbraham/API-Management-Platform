import ApiKey from "../../models/ApiKey.js";
import User from "../../models/User.js";

// GET /admin/keys?page=1&limit=20&status=&userId=
export const listKeys = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status && ["active", "revoked"].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  const [keys, total] = await Promise.all([
    ApiKey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "name email").lean(),
    ApiKey.countDocuments(filter),
  ]);

  const data = keys.map((k) => ({
    _id: k._id,
    maskedKey: `${k.keyPrefix || k.keyHash.slice(0, 8)}${"*".repeat(24)}`,
    status: k.status,
    user: k.userId ? { _id: k.userId._id, name: k.userId.name, email: k.userId.email } : null,
    createdAt: k.createdAt,
    updatedAt: k.updatedAt,
  }));

  res.json({ keys: data, total, page, pages: Math.ceil(total / limit) });
};

// PATCH /admin/keys/:id/suspend  — toggle active ↔ revoked
export const toggleKeyStatus = async (req, res) => {
  const key = await ApiKey.findById(req.params.id);
  if (!key) return res.status(404).json({ message: "API key not found" });

  key.status = key.status === "active" ? "revoked" : "active";
  await key.save();

  res.json({ message: `Key ${key.status}`, status: key.status });
};

// DELETE /admin/keys/:id
export const deleteKey = async (req, res) => {
  const key = await ApiKey.findByIdAndDelete(req.params.id);
  if (!key) return res.status(404).json({ message: "API key not found" });
  res.json({ message: "API key deleted" });
};
