import { registerUser, loginUser } from "../services/authService.js";
import User from "../models/User.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const data = await registerUser({ name, email, password });
  res.status(201).json(data);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const data = await loginUser({ email, password });
  res.status(200).json(data);
};

// GET /auth/me  (auth-protected)
// Returns fresh user data so the frontend can refresh stale localStorage state.
export const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd:   user.currentPeriodEnd,
    },
  });
};
