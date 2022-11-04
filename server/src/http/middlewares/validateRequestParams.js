const validateRequestParams = (validationSchema) => async (req, res, next) => {
  try {
    await validationSchema.validateAsync(req.params, { abortEarly: false });
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = validateRequestParams;
