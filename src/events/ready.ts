import { setupCommands } from "../handlers/slashcommands.js";
import { CustomClient } from "../types/index.js";

export default async (client: CustomClient): Promise<void> => {
  await setupCommands(client);

  console.log(`Logged in as ${client.user?.tag}!`);
};
