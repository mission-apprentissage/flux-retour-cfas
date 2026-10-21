import * as Sentry from "@sentry/node";
import axios from "axios";
import nock from "nock";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { detectRuntime, getSentryOptions } from "./sentry";

const argv = (...args: string[]) => ["/usr/bin/node", "/app/dist/index.js", ...args];

describe("detectRuntime", () => {
  it.each([
    ["job_processor:start", "job-processor"],
    ["queue_processor:start", "queue-processor"],
    ["start", "api"],
    ["hydrate:daily", "cli"],
    ["migrations:up", "cli"],
  ])("classe « %s » en %s", (command, expected) => {
    expect(detectRuntime(argv(command))).toBe(expected);
  });

  it("ignore les options placées avant la commande", () => {
    expect(detectRuntime(argv("--verbose", "job_processor:start"))).toBe("job-processor");
  });

  it("classe le serveur avec processor intégré comme api", () => {
    expect(detectRuntime(argv("start", "--withProcessor"))).toBe("api");
  });

  it("retombe sur cli sans commande", () => {
    expect(detectRuntime(argv())).toBe("cli");
  });
});

describe("événements envoyés à Sentry", () => {
  let envelopes: string[] = [];

  const sentItems = () =>
    envelopes.flatMap((body) =>
      body
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    );

  const sentWithoutStack = () => JSON.stringify(sentItems().map((item) => ({ ...item, exception: undefined })));

  beforeEach(() => {
    envelopes = [];
    Sentry.init({
      ...getSentryOptions("cli", []),
      dsn: "https://public@sentry.example/1",
      enabled: true,
      transport: (options) =>
        Sentry.createTransport(options, async (request) => {
          envelopes.push(typeof request.body === "string" ? request.body : new TextDecoder().decode(request.body));
          return { statusCode: 200 };
        }),
    });
  });

  afterEach(async () => {
    await Sentry.close();
    nock.cleanAll();
  });

  it("résume un appel Brevo en échec, sans clé ni corps", async () => {
    nock("https://api.brevo.com")
      .post("/v3/contacts")
      .reply(400, { code: "invalid_parameter", message: "Invalid phone number +33600000000" });

    const error = await axios
      .post(
        "https://api.brevo.com/v3/contacts",
        { attributes: { PRENOM: "Camille", SMS: "+33600000000" } },
        { headers: { "api-key": "xkeysib-factice" } }
      )
      .catch((err: unknown) => err);
    Sentry.captureException(error);
    await Sentry.flush();

    const [event] = sentItems().filter((item) => "exception" in item);
    expect(event.contexts.AxiosError).toEqual({
      method: "POST",
      url: "https://api.brevo.com/v3/contacts",
      status: 400,
      code: "ERR_BAD_REQUEST",
    });
    expect(sentWithoutStack()).not.toMatch(/xkeysib-factice|Camille|33600000000/);
  });

  it("n'envoie pas la query string d'un appel sortant, ni en breadcrumb ni en span", async () => {
    const url = "https://entreprise.api.gouv.fr/v3/insee/sirene/etablissements/diffusibles/12345678900011";
    nock("https://entreprise.api.gouv.fr")
      .get("/v3/insee/sirene/etablissements/diffusibles/12345678900011")
      .query(true)
      .reply(200, { data: {} });

    await Sentry.startSpan({ name: "hydrate:organismes", op: "processor.job" }, async () => {
      await axios.get(url, { params: { token: "jeton-factice" } });
      Sentry.captureException(new Error("échec après l'appel"));
    });
    await Sentry.flush();

    const items = sentItems();
    const transaction = items.find((item) => item.type === "transaction" && "contexts" in item);
    const event = items.find((item) => "exception" in item);
    expect(transaction.spans).toContainEqual(
      expect.objectContaining({ op: "http.client", data: expect.objectContaining({ url }) })
    );
    expect(event.breadcrumbs).toContainEqual(
      expect.objectContaining({ category: "http", data: expect.objectContaining({ url }) })
    );
    expect(sentWithoutStack()).not.toContain("jeton-factice");
  });
});
