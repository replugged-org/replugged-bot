import Discord from "discord.js";
import { CustomClient } from "../types/index.js";
import { updateStarboard } from "../utils/starboard.js";

export default async (client: CustomClient, message: Discord.Message): Promise<void> => {
	const entry = await client.prisma?.starboard.findFirst({
    where: { id: message.id }
  });

  if (entry) {
    await updateStarboard(client, await message.fetch());
  }
};
