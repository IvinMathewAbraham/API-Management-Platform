import { z } from "zod";

// ── Schemas ───────────────────────────────────────────

export const registerSchema = z.object({
  name: z
    .string({ required_error: "name is required" })
    .trim()
    .min(1, "name must not be empty")
    .max(100, "name must be at most 100 characters"),
  email: z
    .string({ required_error: "email is required" })
    .trim()
    .email("invalid email format"),
  password: z
    .string({ required_error: "password is required" })
    .min(6, "password must be at least 6 characters")
    .max(128, "password must be at most 128 characters"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "email is required" })
    .trim()
    .email("invalid email format"),
  password: z
    .string({ required_error: "password is required" })
    .min(1, "password is required"),
});

export const updatePlanSchema = z.object({
  plan: z.enum(["free", "pro"], {
    required_error: "plan is required",
    invalid_type_error: "plan must be 'free' or 'pro'",
  }),
});

// ── Generic middleware factory ─────────────────────────

/**
 * Returns Express middleware that validates `req.body` against a Zod schema.
 * On failure, responds with 400 and a structured error message.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    return res.status(400).json({ message: messages.join("; ") });
  }
  // Replace body with parsed/trimmed data
  req.body = result.data;
  next();
};
