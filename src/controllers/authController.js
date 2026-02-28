import { registerUser, loginUser } from "../services/authService.js";

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
