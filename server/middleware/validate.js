// Swari Input Validation Middleware (Zod)
// Automatically validates and coerces req.body, req.query, or req.params

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }));
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: details[0]?.message || 'Invalid request payload',
        details
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message
      }));
      return res.status(400).json({
        success: false,
        error: 'QUERY_VALIDATION_ERROR',
        message: details[0]?.message || 'Invalid query parameters',
        details
      });
    }
    req.query = result.data;
    next();
  };
}
