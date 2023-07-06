import { IDS } from "../constants.js";
import {
  cleanupGlobalCommands,
  cleanupGuildCommands,
  setupCommands,
} from "../handlers/slashcommands.js";
import { CustomClient } from "../types/index.js";

export default async (client: CustomClient): Promise<void> => {
  const dev = process.env.NODE_ENV == "development";
  const serverID = (dev && IDS.server) || undefined;

  if (dev) {
    await cleanupGlobalCommands(client);
  }
  if (serverID) {
    await cleanupGuildCommands(client, await client.guilds.fetch(serverID));
  }

  await setupCommands(client);

  console.log(`Logged in as ${client.user?.tag}!`);
};
