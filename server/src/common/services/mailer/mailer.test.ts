import nodemailer from "nodemailer";
import { afterEach, describe, expect, it, vi } from "vitest";

import config from "@/config";

import { createMailerService } from "./mailer";

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
