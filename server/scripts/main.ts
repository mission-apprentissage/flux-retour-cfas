import { program } from "commander";
import { MongoClient } from "mongodb";

import { getMongodbUri } from "@/common/mongodb";

import registerCommand from "./commands/generate-import-effectif";

let client: MongoClient | null = null;

const getClient = (): MongoClient => {
  if (!client) {
    throw new Error("Missing mongodb client");
  }
  return client;
};

program
  .configureHelp({
    sortSubcommands: true,
  })
  .showSuggestionAfterError()
  .hook("preAction", async () => {
    client = new MongoClient(getMongodbUri() ?? "");
    await client.connect();
  })
  .hook("postAction", async () => {
    await client?.close();
  });

registerCommand(program, getClient);
await program.parseAsync(process.argv);
