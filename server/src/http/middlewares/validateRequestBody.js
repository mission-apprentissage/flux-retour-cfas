const validateRequestBody = (validationSchema) => async (req, res, next) => {
  try {
    await validationSchema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validateRequestBody;
