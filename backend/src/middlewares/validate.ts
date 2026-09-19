import type { Request, Response, NextFunction } from "express";
import { z } from "zod/v3";
import { apiError } from "../utils/apiError";

export const validate =
  (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        field: i.path.slice(1).join("."),
        message: i.message,
      }));
      return next(new apiError(422, "validation failed", errors));
    }
    req.body = result.data.body ?? req.body;
    next();
  };
