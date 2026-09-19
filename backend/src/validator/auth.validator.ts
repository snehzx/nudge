import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    // this helps to validate all body queury or params as in one middleware
    username: z
      .string()
      .trim()
      .min(3)
      .max(20)
      .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers and underscore only"),
    email: z.email().trim(),
    password: z
      .string()
      .min(6)
      .max(72) // bcrypt silently truncates past 72 bytes , passwod gets ignored if exceeds that which is a bad type property so rather truncate
      .regex(/[a-z]/, "needs a lowercase letter")
      .regex(/[A-Z]/, "needs an uppercase letter")
      .regex(/[0-9]/, "needs a number"),
  }),
});

export const signinSchema = z.object({
  body: z.object({
    email: z.email().trim(),
    password: z.string().min(1, "password required"),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>["body"];
export type SigninInput = z.infer<typeof signinSchema>["body"];
