import nodemailer from "nodemailer";
import { afterEach, describe, expect, it, vi } from "vitest";

import config from "@/config";

import { createMailerService, getEmailInfos, type SendEmailOptions } from "./mailer";

describe("createMailerService", () => {
  const envInitial = config.env;

  afterEach(() => {
    config.env = envInitial;
  });

  it("impose STARTTLS en production", () => {
    config.env = "production";
    const createTransport = vi.spyOn(nodemailer, "createTransport");

    createMailerService();

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ requireTLS: true }));
  });

  it("n'impose pas STARTTLS hors production", () => {
    config.env = "recette";
    const createTransport = vi.spyOn(nodemailer, "createTransport");

    createMailerService();

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ requireTLS: false }));
  });
});

describe("sendEmailMessage", () => {
  async function getFromHeader(options?: SendEmailOptions) {
    const transporter = nodemailer.createTransport({ streamTransport: true, buffer: true });
    const sendMail = vi.spyOn(transporter, "sendMail");
    const template = getEmailInfos("confirmation_cfa", { recipient: { prenom: "Jeanne" }, cfaName: "CFA Test" });

    await createMailerService(transporter).sendEmailMessage("jeanne@example.fr", template, options);

    const { message } = await sendMail.mock.results[0].value;
    return message.toString().match(/^From:.*(\r\n[ \t].*)*/m)?.[0];
  }

  it("conserve le nom complet de l'expéditeur noreply", async () => {
    expect(await getFromHeader({ noreply: true })).toBe(
      "From: =?UTF-8?Q?Tableau_de_bord_=28ne_pas_r=C3=A9pondre?= =?UTF-8?Q?=29?=\r\n <noreply@apprentissage.beta.gouv.fr>"
    );
  });

  it("garde l'en-tête de l'expéditeur par défaut", async () => {
    expect(await getFromHeader()).toBe(
      'From: "Tableau de bord de l\'apprentissage"\r\n <tableau-de-bord@apprentissage.beta.gouv.fr>'
    );
  });
});
