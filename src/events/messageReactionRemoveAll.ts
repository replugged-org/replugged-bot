import Discord from "discord.js";
import { CustomClient } from "../types/index.js";
import { STARBOARD_EMOTE, updateStarboard } from "../utils/starboard.js";

export default async (client: CustomClient, _: Discord.Message, reactions: Discord.Collection<Discord.Snowflake, Discord.MessageReaction>): Promise<void> => {
  const reaction = reactions.first();

  if (reaction) {
    if (reaction.emoji.name !== STARBOARD_EMOTE) return;

    await updateStarboard(client, await reaction.message.fetch());
  }
};
