const { ValidationError } = require("yup");
const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });
      next();
    } catch (err) {
      if (err instanceof ValidationError) {
        const errors = err.inner.reduce((acc, curr) => {
          if (curr.path) {
            acc[curr.path] = curr.message;
          }
          return acc;
        }, {});
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors
        });
        return;
      }
      next(err);
    }
  };
};
module.exports = {
  validateBody,
};
