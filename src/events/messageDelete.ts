import Discord from "discord.js";
import { CustomClient } from "../types/index.js";
import { IDS } from "../constants.js";

export default async (client: CustomClient, message: Discord.Message): Promise<void> => {
	const entry = await client.prisma?.starboard.findFirst({
    where: { id: message.id }
  });

  if (entry) {
    if (IDS.channels.starboard) {
      const channel = await client.channels.fetch(IDS.channels.starboard) as Discord.TextChannel;

      if (channel) {
        await (await channel.messages.fetch(entry.messageId)).delete();
      }
    }

    await client.prisma?.starboard.delete({
      where: { id: entry.id }
    });
  }
};
