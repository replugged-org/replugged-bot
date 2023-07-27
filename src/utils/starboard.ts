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

export async function createStarboardMessage(stars: number, message: Discord.Message): Promise<Discord.BaseMessageOptions> {
  const [, star, color] = EMOTES.filter((e) => e[0] <= stars).pop()!;

  let reference_embed;
  let reference;
  if (message.reference) {
    reference = await message.fetchReference()
    reference_embed = new Discord.EmbedBuilder()
      .setAuthor({
        name: `Replying to ${reference.author.username}`,
        iconURL: reference.author.avatarURL() ?? "",
        url: reference.url
      })
      .setImage(reference.attachments.first()?.url || null)
      .setTimestamp(reference.editedTimestamp || reference.createdTimestamp)
    
    if (reference.content) reference_embed.setDescription(reference.cleanContent)
  }

  const embed = new Discord.EmbedBuilder()
    .setAuthor({
      name: message.author.username,
      iconURL: message.author.avatarURL() ?? "",
      url: message.url
    })
    .setImage(message.attachments.first()?.url || null)
    .setColor(color)
    .setTimestamp(message.editedTimestamp || message.createdTimestamp)

  if (message.content) embed.setDescription(message.cleanContent)

  const linked_attachments = message.attachments.map((a) => {
    return {
      type: 2,
      style: 5,
      label: a.name,
      url: a.url,
    }
  })

  return {
    content: `${star} **${stars}** - <#${message.channelId}>`,
    embeds: reference_embed ? [
      reference_embed,
      embed,
      ...message.embeds
    ] : [
      embed,
      ...message.embeds
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "Jump to Message",
            url: message.url,
          }
        ].concat(reference ? [
          {
            type: 2,
            style: 5,
            label: "Jump to Reply",
            url: reference.url,
          }
        ] : [])
      }
    ].concat(linked_attachments.length ? [
      {
        type: 1,
        components: linked_attachments
      }
    ] : [])
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
          await msg.edit(await createStarboardMessage(reaction.count, message));
        } else {
          await msg.delete();
          msg = undefined; // to remove id from db
        }
      } else if (reaction.count >= BOARD_MINIMUM) {
        msg = await channel.send(await createStarboardMessage(reaction.count, message));
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
      msg = await channel.send(await createStarboardMessage(reaction.count, message));
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
