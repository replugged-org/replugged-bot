import * as Discord from "discord.js";
import { CustomClient } from "../types/discord.js";
import { IDS } from "../constants.js";

type BoardDecoration = Array<[ number, string, number ]>;

export const BOARD_MINIMUM = 1;
export const STARBOARD_EMOTE = '⭐';
export const GENERIC_STAR_OBJ = {messageId: '', stars: 0};

export const EMOTES: BoardDecoration = [
  [ 0, '⭐', 0xffffff ],
  [ 5, '🌟', 0xffffaa ],
  [ 10, '💫', 0xffff66 ],
  [ 20, '✨', 0xffff00 ],
];

export function createStarboardMessage(stars: number, message: Discord.Message): Discord.BaseMessageOptions {
  const [, star, color] = EMOTES.filter((e) => e[0] <= stars).pop()!;

  const embed = new Discord.EmbedBuilder()
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.avatarURL() ?? "",
    })
    .addFields([{
      name: "Jump to Message",
      value: `[Click Here](${message.url})`
    }])
    .setImage(message.attachments.first()?.url || null)
    .setColor(color)

  if (message.content) embed.setDescription(message.cleanContent)

  return {
    content: `${star} **${stars}** - <#${message.channelId}>`,
    embeds: [
      embed,
      ...message.embeds
    ]
  }
}

export async function updateStarboard(client: CustomClient, message: Discord.Message): Promise<void> {
  const reaction = message.reactions.cache.filter(reaction => reaction.emoji.name === STARBOARD_EMOTE).first();

  const entry = await client.prisma?.starboard.findFirst({
    where: { id: message.id }
  });


  if (!reaction) {
    // Doesn't exist? Delete
    if (entry && IDS.channels.starboard) {
      const channel = await client.channels.fetch(IDS.channels.starboard) as Discord.TextChannel;
      const msg = await channel.messages.fetch(entry.messageId);
      await msg.delete()
    }
    await client.prisma?.starboard.update({
      where: { id: message.id },
      data: {
        id: message.id,
        messageId: "",
        starcount: 0
      }
    });
    return;
  }

  if (entry) {
    if (IDS.channels.starboard) {
      const channel = await client.channels.fetch(IDS.channels.starboard) as Discord.TextChannel;

      let msg;
      if (entry.messageId) {
        msg = await channel.messages.fetch(entry.messageId);
        if (reaction.count >= BOARD_MINIMUM) {
          await msg.edit(createStarboardMessage(reaction.count, message));
        } else {
          await msg.delete();
          msg = undefined; // to remove id from db
        }
      } else if (reaction.count >= BOARD_MINIMUM) {
        msg = await channel.send(createStarboardMessage(reaction.count, message));
      }

      await client.prisma?.starboard.update({
        where: { id: message.id },
        data: {
          id: message.id,
          messageId: msg?.id || "",
          starcount: reaction.count
        }
      })
    }
  } else if (IDS.channels.starboard) {
    const channel = await client.channels.fetch(IDS.channels.starboard) as Discord.TextChannel;

    let msg;
    if (reaction.count >= BOARD_MINIMUM) {
      msg = await channel.send(createStarboardMessage(reaction.count, message));
    }

    await client.prisma?.starboard.create({
      data: {
        id: message.id,
        messageId: msg?.id || "",
        starcount: reaction.count
      }
    })
  }
}
