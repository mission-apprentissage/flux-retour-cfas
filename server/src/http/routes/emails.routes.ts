import Boom from "boom";
import express from "express";
import Joi from "joi";
import passport from "passport";
import { Strategy as LocalAPIKeyStrategy } from "passport-localapikey";

import {
  checkIfEmailExists,
  unsubscribeUser,
  markEmailAsOpened,
  markEmailAsFailed,
  markEmailAsDelivered,
  renderEmail,
} from "@/common/actions/emails.actions";
import config from "@/config";

function checkWebhookKey() {
  passport.use(
    new LocalAPIKeyStrategy(
      {
        apiKeyField: "webhookKey",
      },
      async (apiKey, done) => {
        return done(null, (config.smtp as any).webhookKey === apiKey ? { apiKey } : false);
      }
    )
  );

  return passport.authenticate("localapikey", { session: false, failWithError: true });
}

export default () => {
  const router = express.Router(); // eslint-disable-line new-cap

  async function checkEmailToken(req, res, next) {
    const { token } = req.params;
    if (!(await checkIfEmailExists(token))) {
      return next(Boom.notFound());
    }

    next();
  }

  router.get("/:token/preview", checkEmailToken, async (req, res) => {
    const html = await renderEmail(req.params.token);
    res.set("Content-Type", "text/html");
    res.send(Buffer.from(html));
  });

  router.get("/:token/markAsOpened", async (req, res) => {
    const { token } = req.params;

    markEmailAsOpened(token);

    res.writeHead(200, { "Content-Type": "image/gif" });
    res.end(Buffer.from("R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64"), "binary");
  });

  router.post("/webhook", checkWebhookKey(), async (req, res) => {
    const parameters = await Joi.object({
      event: Joi.string().required(), //https://developers.sendinblue.com/docs/transactional-webhooks
      "message-id": Joi.string().required(),
    })
      .unknown()
      .validateAsync(req.body, { abortEarly: false });

    if (parameters.event === "delivered") {
      markEmailAsDelivered(parameters["message-id"]);
    } else {
      markEmailAsFailed(parameters["message-id"], parameters.event);
    }

    return res.json({});
  });

  router.get("/:token/unsubscribe", checkEmailToken, async (req, res) => {
    const { token } = req.params;

    await unsubscribeUser(token);

    res.set("Content-Type", "text/html");
    res.send(
      Buffer.from(`<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Désinscription</title>
    </head>
    <body>
        <div class="sib-container rounded ui-sortable" style="position: relative; max-width: 540px; margin: 0px auto; text-align: left; background: rgb(252, 252, 252); padding: 40px 20px 20px; line-height: 150%; border-radius: 4px; border-width: 0px !important; border-color: transparent !important;">
            <div class="header" style="padding: 0px 20px;">
                <h1 class="title editable" data-editfield="newsletter_name" contenteditable="true" style="font-weight: normal; text-align: center; font-size: 25px; margin-bottom: 5px; padding: 0px; margin-top: 0px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: rgb(35, 35, 35);">Désinscription</h1>
            </div>
             <div class="innercontainer rounded2 email-wrapper" style="border-radius: 10px; padding: 10px; background: rgb(241, 241, 241);">
                <div class="description editable" data-editfield="newsletter_description" contenteditable="true" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: rgb(52, 52, 52); padding: 0px 20px 15px; text-align: center">Vous êtes désinscrit.</div>
            </div>
        </div>

    </body>
</html>
`)
    );
  });

  return router;
};
