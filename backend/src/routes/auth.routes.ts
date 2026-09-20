import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validate.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { signupSchema, signinSchema } from "../validator/auth.validator.ts";
import * as c from "../controllers/auth.controller.ts";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "too many attempts , try again later" },
});

const router = Router();

router.post("/signup", authLimiter, validate(signupSchema), c.signup);
router.post("/signin", authLimiter, validate(signinSchema), c.signin);
router.post("/refresh", c.refresh);
router.post("/logout", authMiddleware, c.logout);
router.get("/me", authMiddleware, c.me);

export default router;
