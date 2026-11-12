import { Request, Response, NextFunction } from 'express';
import { AnyObjectSchema, ValidationError } from 'yup';

export const validateBody = (schema: AnyObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        const errors = err.inner.reduce<Record<string, string>>((acc, curr) => {
          if (curr.path) {
            acc[curr.path] = curr.message;
          }
          return acc;
        }, {});

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }
      next(err);
    }
  };
};

