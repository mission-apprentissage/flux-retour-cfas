import Boom from "boom";

export default () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (rawError, req, res, next) => {
    req.err = rawError;

    console.log("rawError", rawError);
    console.log("raw", JSON.stringify(rawError, null, 2));
    let boomError;

    if (rawError.isBoom) {
      boomError = rawError;
    } else if (rawError.issues) {
      //This is a Zod validation error
      boomError = Boom.badRequest("Erreur de validation");
      boomError.output.payload.issues = rawError.issues;
      boomError.output.payload.details = rawError.issues[0].message; // compatibility with other error handling
    } else if (rawError?.[0]?.errors?.name === "ZodError") {
      //This is a Zod validation error
      boomError = Boom.badRequest("Erreur de validation");
      boomError.output.payload.details = rawError?.[0].errors.issues;
    } else if (rawError.name === "ValidationError") {
      //This is a joi validation error
      boomError = Boom.badRequest("Erreur de validation");
      boomError.output.payload.details = rawError.details;
    } else {
      boomError = Boom.boomify(rawError, {
        statusCode: rawError.status || 500,
        ...(!rawError.message ? { message: "Une erreur est survenue" } : {}),
      });
    }

    const { error, message, details, issues } = boomError.output.payload;
    return res.status(boomError.output.statusCode).send({ error, message, details, issues });
  };
};
