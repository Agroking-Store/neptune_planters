import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ApiError } from '../utils/ApiError';

interface ValidationTargets {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

// ─────────────────────────────────────────────
// Generic Zod validation middleware factory
// Usage: validate({ body: loginSchema })
// ─────────────────────────────────────────────
export function validate(schemas: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const [target, schema] of Object.entries(schemas) as [
      keyof ValidationTargets,
      ZodSchema
    ][]) {
      const result = schema.safeParse(req[target]);
      if (!result.success) {
        const formatted = result.error.errors.map(
          (e) => `${target}.${e.path.join('.')}: ${e.message}`
        );
        errors.push(...formatted);
      } else {
        // Replace with parsed/coerced values
        (req as unknown as Record<string, unknown>)[target] = result.data as unknown;
      }
    }

    if (errors.length > 0) {
      return next(ApiError.badRequest('Validation failed', errors));
    }

    next();
  };
}

// Re-export zod for convenience in validators
export { z };
