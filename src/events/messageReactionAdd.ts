import Discord from "discord.js";
import { CustomClient } from "../types/index.js";
import { STARBOARD_EMOTE, updateStarboard } from "../utils/starboard.js";

export default async (client: CustomClient, reaction: Discord.MessageReaction, _: Discord.GuildMember): Promise<void> => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Something went wrong when fetching the message:', error);
			return;
		}
	}

  if (reaction.emoji.name !== STARBOARD_EMOTE) return;

  // if (user.id === reaction.message.author?.id) {
  //   await reaction.remove();
  //   return;
  // }

  await updateStarboard(client, await reaction.message.fetch());
};
