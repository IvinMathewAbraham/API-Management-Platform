import User from "../models/User.js";

export const updatePlan = async (req, res) => {
  const { plan } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { plan },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json({
    message: `Plan updated to '${plan}'`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      role: user.role,
    },
  });
};
