const Boom = require("boom");

module.exports = () => {
  // eslint-disable-next-line no-unused-vars
  return (rawError, req, res, next) => {
    req.err = rawError;

    let error;
    if (rawError.isBoom) {
      error = rawError;
    } else if (rawError.name === "ValidationError") {
      //This is a joi validation error
      error = Boom.badRequest("Erreur de validation");
      error.output.payload.details = rawError.details;
    } else {
      error = Boom.boomify(rawError, {
        statusCode: rawError.status || 500,
        ...(!rawError.message ? "Une erreur est survenue" : {}),
      });
    }

    return res.status(error.output.statusCode).send(error.output.payload);
  };
};
