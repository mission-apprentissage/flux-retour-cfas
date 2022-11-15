export default (validationSchema) => async (req, res, next) => {
  try {
    await validationSchema.validateAsync(req.query, { abortEarly: false });
    next();
  } catch (err) {
    next(err);
  }
};
