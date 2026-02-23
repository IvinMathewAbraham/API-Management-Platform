import { registerUser, loginUser } from "../services/authService.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const data = await registerUser({ name, email, password });
  res.status(201).json(data);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const data = await loginUser({ email, password });
  res.status(200).json(data);
};
