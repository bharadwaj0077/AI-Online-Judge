import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

export const validateBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const parsed = await schema.safeParseAsync(req.body);
    
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed parsing incoming parameters.",
        errors: parsed.error.format(),
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
};