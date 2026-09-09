import { connectToMongodb, closeMongodbConnection, getMongodbUri } from "@/common/mongodb";

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.VITEST_WORKER_ID}`;
  await connectToMongodb(getMongodbUri().replace("{{VITEST_WORKER_ID}}", workerId));
};

/**
 * Laisse un court délai aux opérations non attendues avant de fermer le client.
 *
 * Certaines écritures ne sont attendues par personne (createIndex internes de
 * librairies, écritures applicatives lancées sans await). Depuis mongodb v6,
 * `close()` ne les abandonne plus en silence : il les interrompt en leur
 * injectant un `MongoClientClosedError` (`closeCheckedOutConnections`). La
 * promesse rejetée n'ayant pas de porteur, elle remonte en unhandled rejection
 * et fait sortir vitest en code 1 même quand 100% des tests passent.
 *
 * ⚠️ Un try/catch autour de `close()` ne sert à rien ici : l'erreur n'est pas
 * levée PAR close(), elle est injectée DANS les opérations en vol.
 *
 * Ce délai est un filet. Les causes connues sont traitées à la source quand
 * c'est possible (cf createRateLimiterIndexes dans setupMongo.ts).
 */
const IN_FLIGHT_DRAIN_MS = 50;

/**
 * ⚠️ Référence capturée à l'import, AVANT que le moindre test n'installe des
 * faux timers. Plusieurs suites appellent `vi.useFakeTimers()` sans restaurer
 * (ex connexion-invitations.actions.test.ts) : un `setTimeout` global posé
 * après coup ne se déclencherait jamais, la promesse ne se résoudrait pas, et
 * le hook `afterAll` partirait en timeout de 30s.
 */
const realSetTimeout = globalThis.setTimeout;

export const stopMongodb = async () => {
  await new Promise((resolve) => realSetTimeout(resolve, IN_FLIGHT_DRAIN_MS));
  await closeMongodbConnection();
};
